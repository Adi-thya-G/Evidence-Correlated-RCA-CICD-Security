import { Request, Response } from "express";
import { TrivyFinding } from "@modules/Trivyfinding";
import { SecurityScanReport } from "@modules/SecurityScannerReport";
import { asyncHandler } from "@utils/asyncHandler";

import ApiError from "@utils/ApiError";
import fs from 'fs'
import path from "path";
import { Installation } from "@modules/Installation";

const workDir=path.join('D:','Evidence-Correlated-RCA-CICD-Security','data','installations');
/**
 * Returns the Trivy findings from the most recent scan (most recent push)
 * for a given project + repo, sorted worst-severity-first.
 *
 * Looks up the current scanId from SecurityScanReport first rather than
 * just querying TrivyFinding by projectKey — the findings collection is
 * always the latest scan already (scan-and-store.js replaces it on every
 * run), but pinning to scanId avoids a race where a new scan is
 * half-written while this query runs.
 */
const SEVERITY_ORDER = ["CRITICAL", "HIGH", "MEDIUM", "LOW", "UNKNOWN"];
const DEFAULT_PAGE_SIZE = 20;
const MAX_PAGE_SIZE = 100;

export async function getLatestTrivyFindings(
  repo_id: number,
  page = 1,
  pageSize = DEFAULT_PAGE_SIZE
) {
  const safePage = Math.max(1, page);
  const safePageSize = Math.min(Math.max(1, pageSize), MAX_PAGE_SIZE);

  const report = await SecurityScanReport.findOne({ repo_id }).lean();


  if (!report) {
    return {
      scanId: null,
      scannedAt: null,
      findings: [],
      page: safePage,
      pageSize: safePageSize,
      totalFindings: 0,
      totalPages: 0,
    };
  }

  const filter = {  repo_id, scanId: report.scanId };
  const totalFindings = await TrivyFinding.countDocuments(filter);
  console.log(totalFindings)

  // Severity isn't a fixed enum in Mongo, so sort in JS: fetch the whole
  // scan's findings once, order them, then slice the requested page.
  // Fine at this scale (one scan's worth of findings); if a project ever
  // has thousands, switch to a $addFields severity-rank + $sort in an
  // aggregation pipeline instead.
  const all = await TrivyFinding.find(filter).lean().sort({
scannedAt:-1});
  all.sort(
    (a, b) => SEVERITY_ORDER.indexOf(a.severity) - SEVERITY_ORDER.indexOf(b.severity)
  );

  const start = (safePage - 1) * safePageSize;
  const findings = all.slice(start, start + safePageSize);

  return {
    scanId: report.scanId,
    scannedAt: report.scannedAt,
    findings,
    page: safePage,
    pageSize: safePageSize,
    totalFindings,
    totalPages: Math.ceil(totalFindings / safePageSize),
  };
}

/**

 */
export const getLatestTrivyFindingsHandler = asyncHandler(async (req: Request, res: Response) => {
  const  repo_id  = req.query.repo_id;
  const page = Number(req.query.page) || 1;
  const pageSize = Number(req.query.pageSize) || DEFAULT_PAGE_SIZE;

  const repoIdNum = Number(repo_id);
  console.log(repoIdNum)
  if (!Number.isFinite(repoIdNum)) {
    return res.status(400).json({ error: "repo_id must be numeric" });
  }

  try {
    const result = await getLatestTrivyFindings( repoIdNum, page, pageSize);
    if (!result.scanId) {
      return res.status(404).json({ error: "No scan found for this project" });
    }
    return res.json(result);
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
})

const MAX_FILE_READ_BYTES = 5 * 1024 * 1024;

export const getSourceCode = asyncHandler(async (req, res, next) => {
  const { line, component, context, scanId, pkgName } = req.query ?? {};

  // line is now optional — required only when there's no pkgName to fall back on
  if (!component || !context || !scanId || (!line && !pkgName)) {
    throw new ApiError(
      400,
      "necessary query param not found",
      "please provide component, context, scanId, and either line (SAST) or pkgName (SCA)"
    );
  }

  const contextNum = Number(context);
  if (!Number.isInteger(contextNum) || contextNum < 0 || contextNum > 500) {
    throw new ApiError(400, "invalid context", "context must be a non-negative integer (max 500)");
  }
  if (typeof component !== "string" || component.trim() === "") {
    throw new ApiError(400, "invalid component", "component must be a non-empty string");
  }

  let lineNum: number | null = null;
  if (line) {
    lineNum = Number(line);
    if (!Number.isInteger(lineNum) || lineNum <= 0) {
      throw new ApiError(400, "invalid line", "line must be a positive integer");
    }
  }

  // ---- auth ----
  const userId = req.user?.userId;
  const githubId = req.user?.githubId;
  if (!userId || !githubId) {
    throw new ApiError(401, "credentials not found", "user id and github id not found");
  }

  const installation = await Installation.findOne({ accountId: githubId });
  if (!installation) {
    throw new ApiError(404, "installation not found", "no installation found for this account");
  }

  const report = await SecurityScanReport.findOne({
    scanId,
  }).lean();
 
  if (!report) {
    throw new ApiError(404, "repo not found", "scan id -> repo not found for this installation");
  }

  const workDir = path.join(
    "D:",
    "Evidence-Correlated-RCA-CICD-Security",
    "data",
    "installations",
    String(installation.installationId),
    "repo",
    String(report.repo_id)
  );

  if (!fs.existsSync(workDir)) {
    throw new ApiError(404, "folder not found", "user specific repo folder is not found");
  }

  // ---- resolve target file safely (path traversal guard) ----
  const requestedPath = path.normalize(component).replace(/^(\.\.[/\\])+/, "");
  const resolvedPath = path.resolve(workDir, requestedPath);
  const workDirWithSep = workDir.endsWith(path.sep) ? workDir : workDir + path.sep;

  if (!resolvedPath.startsWith(workDirWithSep)) {
    throw new ApiError(400, "invalid path", "component resolves outside repo directory");
  }
  if (!fs.existsSync(resolvedPath)) {
    throw new ApiError(404, "file not found", `source file not found: ${component}`);
  }

  const stat = fs.statSync(resolvedPath);
  if (!stat.isFile()) {
    throw new ApiError(400, "invalid target", "component does not point to a file");
  }
  if (stat.size > MAX_FILE_READ_BYTES) {
    throw new ApiError(413, "file too large", "source file exceeds the read size limit");
  }

  const content = fs.readFileSync(resolvedPath, "utf-8");
  const lines = content.split(/\r\n|\r|\n/);

  // ---- SAST path: exact line + context window ----
  if (lineNum !== null) {
    if (lineNum > lines.length) {
      throw new ApiError(400, "line out of range", `line ${lineNum} exceeds file length (${lines.length} lines)`);
    }

    const startLine = Math.max(1, lineNum - contextNum);
    const endLine = Math.min(lines.length, lineNum + contextNum);
    const snippetLines = lines.slice(startLine - 1, endLine).map((text, idx) => ({
      lineNumber: startLine + idx,
      text,
      isTarget: startLine + idx === lineNum,
    }));

    return res.status(200).json({
      success: true,
      data: {
        mode: "line",
        component,
        scanId,
        repoId: report.repo_id,
        targetLine: lineNum,
        startLine,
        endLine,
        totalLines: lines.length,
        lines: snippetLines,
      },
    });
  }

  // ---- SCA path: no line number, locate by package name instead ----
  // e.g. component === "package-lock.json", pkgName === "mongoose"
  const pkgNameStr = String(pkgName);
  const matchIndex = lines.findIndex((text) => text.includes(`"${pkgNameStr}"`));

  if (matchIndex === -1) {
    throw new ApiError(
      404,
      "package not found",
      `could not locate "${pkgNameStr}" in ${component}`
    );
  }

  const targetLine = matchIndex + 1; // convert to 1-indexed
  const startLine = Math.max(1, targetLine - contextNum);
  const endLine = Math.min(lines.length, targetLine + contextNum);
  const snippetLines = lines.slice(startLine - 1, endLine).map((text, idx) => ({
    lineNumber: startLine + idx,
    text,
    isTarget: startLine + idx === targetLine,
  }));

  return res.status(200).json({
    success: true,
    data: {
      mode: "package",
      component,
      pkgName: pkgNameStr,
      scanId,
      repoId: report.repo_id,
      targetLine,
      startLine,
      endLine,
      totalLines: lines.length,
      lines: snippetLines,
    },
  });
});


export async function getTrivySeverityCounts(repo_id: number) {
  const report = await SecurityScanReport.findOne({ repo_id }).lean().sort({ createdAt: -1 });

  if (!report) {
    return { scanId: null, counts: { CRITICAL: 0, HIGH: 0, MEDIUM: 0, LOW: 0, UNKNOWN: 0 } };
  }

  const filter = { repo_id, scanId: report.scanId };

  const grouped = await TrivyFinding.aggregate([
    { $match: filter },
    { $group: { _id: "$severity", count: { $sum: 1 } } },
  ]);

  const counts: Record<string, number> = { CRITICAL: 0, HIGH: 0, MEDIUM: 0, LOW: 0, UNKNOWN: 0 };
  grouped.forEach((g) => {
    if (g._id in counts) counts[g._id] = g.count;
  });

  return {
    scanId: report.scanId,
    scannedAt: report.scannedAt,
    counts,
    total: Object.values(counts).reduce((a, b) => a + b, 0),
  };
}

export const getTrivySeverityCountsHandler = asyncHandler(async (req: Request, res: Response) => {
  const repo_id = Number(req.query.repo_id);
  if (!Number.isFinite(repo_id)) {
    return res.status(400).json({ error: "repo_id must be numeric" });
  }

  const result = await getTrivySeverityCounts(repo_id);
  if (!result.scanId) {
    return res.status(404).json({ error: "No scan found for this project" });
  }
  return res.json(result);
});