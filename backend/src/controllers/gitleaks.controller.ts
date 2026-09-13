import { Request, Response } from "express";
import { GitleaksFinding } from "@modules/Gitleakfinding";
import { SecurityScanReport } from "@modules/SecurityScannerReport";
import { asyncHandler } from "@utils/asyncHandler";

const SEVERITY_ORDER = ["CRITICAL", "HIGH", "MEDIUM", "LOW", "UNKNOWN"];
const DEFAULT_PAGE_SIZE = 20;
const MAX_PAGE_SIZE = 100;

/**
 * Returns the Gitleaks findings from the most recent scan for a given repo,
 * sorted worst-severity-first. Pins to the current scanId from
 * SecurityScanReport (rather than just querying GitleaksFinding by repo_id)
 * to avoid a race where a new scan is half-written while this query runs.
 *
 * raw.Secret / raw.Match are explicitly excluded from every query in this
 * file — those fields hold live/partially-live credential values and must
 * never leave the server.
 */
export async function getLatestGitleaksFindings(
  repo_id: number,
  page = 1,
  pageSize = DEFAULT_PAGE_SIZE
) {
  const safePage = Math.max(1, page);
  const safePageSize = Math.min(Math.max(1, pageSize), MAX_PAGE_SIZE);

  const report = await SecurityScanReport.findOne({ repo_id })
    .lean()
    .sort({ createdAt: -1 });

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

  const filter = { repo_id, scanId: report.scanId };
  const totalFindings = await GitleaksFinding.countDocuments(filter);

  // Severity isn't a fixed enum in Mongo, so sort in JS: fetch the whole
  // scan's findings once (minus secret material), order them, then slice
  // the requested page. Fine at this scale; switch to an aggregation
  // pipeline with a severity-rank $addFields if a project ever has
  // thousands of findings.
  const all = await GitleaksFinding.find(filter)
    .select("-raw.Secret -raw.Match")
    .lean();

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

export const getLatestGitleaksFindingsHandler = asyncHandler(
  async (req: Request, res: Response) => {
    const repo_id = req.query.repo_id;
    const page = Number(req.query.page) || 1;
    const pageSize = Number(req.query.pageSize) || DEFAULT_PAGE_SIZE;

    const repoIdNum = Number(repo_id);
    if (!Number.isFinite(repoIdNum)) {
      return res.status(400).json({ error: "repo_id must be numeric" });
    }

    const result = await getLatestGitleaksFindings(repoIdNum, page, pageSize);
    if (!result.scanId) {
      return res.status(404).json({ error: "No scan found for this project" });
    }
    return res.json(result);
  }
);

/**
 * Returns severity counts across the entire latest scan (not just the
 * current page), for the summary cards on the Gitleaks dashboard.
 */
export async function getGitleaksSeverityCounts(repo_id: number) {
  const report = await SecurityScanReport.findOne({ repo_id })
    .lean()
    .sort({ createdAt: -1 });

  if (!report) {
    return {
      scanId: null,
      counts: { CRITICAL: 0, HIGH: 0, MEDIUM: 0, LOW: 0, UNKNOWN: 0 },
      total: 0,
    };
  }

  const filter = { repo_id, scanId: report.scanId };

  const grouped = await GitleaksFinding.aggregate([
    { $match: filter },
    { $group: { _id: "$severity", count: { $sum: 1 } } },
  ]);

  const counts: Record<string, number> = {
    CRITICAL: 0,
    HIGH: 0,
    MEDIUM: 0,
    LOW: 0,
    UNKNOWN: 0,
  };
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

export const getGitleaksSeverityCountsHandler = asyncHandler(
  async (req: Request, res: Response) => {
    const repo_id = Number(req.query.repo_id);
    if (!Number.isFinite(repo_id)) {
      return res.status(400).json({ error: "repo_id must be numeric" });
    }

    const result = await getGitleaksSeverityCounts(repo_id);
    if (!result.scanId) {
      return res.status(404).json({ error: "No scan found for this project" });
    }
    return res.json(result);
  }
);