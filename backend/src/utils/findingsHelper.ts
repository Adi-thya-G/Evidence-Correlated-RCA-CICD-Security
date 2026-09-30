import type { Request } from "express";
import { Types } from "mongoose";
import ApiError from "@utils/ApiError";

import ApiResponse from "./ApiResponse";
export const TOOLS = ["sonarqube", "semgrep", "trivy", "gitleaks"] as const;
export const STATUSES = ["pending", "triaged", "resolved", "false_positive"] as const;
export const SEVERITIES = ["critical", "high", "medium", "low"] as const;

export type Tool = (typeof TOOLS)[number];
export type Status = (typeof STATUSES)[number];
export type Sev = (typeof SEVERITIES)[number];

// Raw scanner value -> normalized. Sonar: BLOCKER..INFO, Trivy/Gitleaks: CRITICAL..LOW, Semgrep: ERROR/WARNING/INFO
export const RAW_TO_SEV: Record<string, Sev> = {
  BLOCKER: "critical", CRITICAL: "critical",
  MAJOR: "high", HIGH: "high", ERROR: "high",
  MINOR: "medium", MEDIUM: "medium", WARNING: "medium",
  INFO: "low", LOW: "low", UNKNOWN: "low",
};
export const SEV_RANK: Record<Sev, number> = { critical: 3, high: 2, medium: 1, low: 0 };
export const RANK_TO_SEV: Sev[] = ["low", "medium", "high", "critical"];

export const toSev = (raw?: string): Sev => RAW_TO_SEV[String(raw ?? "").toUpperCase()] ?? "low";

export const rawValuesFor = (sevs: Sev[]) =>
  Object.entries(RAW_TO_SEV).filter(([, s]) => sevs.includes(s)).map(([raw]) => raw);

// Mongo expression: numeric rank of the raw severity, so we can sort/aggregate without a stored field
export const sevRankExpr = {
  $switch: {
    branches: Object.entries(RAW_TO_SEV).map(([raw, sev]) => ({
      case: { $eq: [{ $toUpper: "$severity" }, raw] },
      then: SEV_RANK[sev],
    })),
    default: 0,
  },
};

const escapeRegex = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

export function parseList<T extends string>(v: unknown, allowed: readonly T[], name: string): T[] {
  if (v == null || v === "") return [];
  const items = String(v).split(",").map((s) => s.trim()).filter(Boolean);
  const bad = items.filter((i) => !allowed.includes(i as T));
  if (bad.length) throw new ApiError(422, `invalid ${name}`, `${name}: ${bad.join(", ")} not allowed`);
  return items as T[];
}

export function getScope(req: Request) {
  const userId = req.user?.userId;
  if (!userId) throw new ApiError(401, "unauthorized", "user id missing from token");
  const repo_id = Number(req.query.repo_id);
  if (!Number.isInteger(repo_id)) throw new ApiError(400, "invalid repo id", "repo_id must be a number");
  // accountId always comes from the token, never from the client: this is the ownership check
  return { accountId: new Types.ObjectId(String(userId)), repo_id };
}

export function getPaging(req: Request) {
  const page = Math.max(1, Number(req.query.page) || 1);
  const pageSize = Math.min(100, Math.max(1, Number(req.query.pageSize) || 25));
  return { page, pageSize, skip: (page - 1) * pageSize };
}

export function buildMatch(req: Request, opts: { includeTool: boolean }) {
  const match: Record<string, any> = { ...getScope(req) };

  const tool = req.query.tool;
  if (opts.includeTool && tool && tool !== "all") {
    if (!TOOLS.includes(tool as Tool)) throw new ApiError(422, "invalid tool", `tool: ${tool}`);
    match.tool = tool;
  }

  const statuses = parseList(req.query.status, STATUSES, "status");
  if (statuses.length) {
    // documents created before the status field existed count as pending
    match.status = { $in: statuses.includes("pending") ? [...statuses, null] : statuses };
  }

  const sevs = parseList(req.query.severity, SEVERITIES, "severity");
  if (sevs.length) match.severity = { $in: rawValuesFor(sevs) };

  if (req.query.commit) {
    match.git_commit_hash = { $regex: `^${escapeRegex(String(req.query.commit))}` };
  }

  if (req.query.q) {
    const rx = { $regex: escapeRegex(String(req.query.q)), $options: "i" };
    match.$or = [{ message: rx }, { file: rx }, { ruleId: rx }];
  }
  return match;
}

export function parseSort(sort: unknown): Record<string, 1 | -1> {
  switch (sort) {
    case "-severity": return { sevRank: -1, enrichedAt: -1, _id: -1 };
    case "file": return { file: 1, startLine: 1, _id: 1 };
    default: return { enrichedAt: -1, _id: -1 };
  }
}

// ---- serializers ----
const authorFromDiff = (diff?: string) => diff?.match(/^Author:\s*(.+?)\s*<[^>]+>/m)?.[1];

export const toCommit = (d: any, diffFallback?: string) => ({
  hash: d.git_commit_hash,
  author: d.git_author_name ?? authorFromDiff(diffFallback) ?? d.git_author?.split("@")[0] ?? "unknown",
  email: d.git_author ?? "",
  date: d.git_commit_date,
  summary: d.git_commit_summary ?? "",
});

export const toListItem = (d: any) => ({
  id: String(d._id),
  tool: d.tool,
  category: d.category,
  ruleId: d.ruleId,
  severity: toSev(d.severity),
  rawSeverity: d.severity,
  message: d.message,
  file: d.file,
  startLine: d.startLine,
  endLine: d.endLine,
  status: (d.status ?? "pending") as Status,
  enrichedAt: d.enrichedAt,
  commit: toCommit(d),
});

// git_diff holds the WHOLE commit. Return only this file's section, starting at the first @@ hunk
export function sliceFileDiff(fullDiff: string | undefined, file: string): string | null {
  if (!fullDiff) return null;
  const parts = fullDiff.split(/^(?=diff --git )/m);
  const target = parts.find((p) => p.split("\n", 1)[0].endsWith(` b/${file}`));
  if (!target) return null;
  const i = target.indexOf("\n@@");
  return i === -1 ? target : target.slice(i + 1);
}

// Allowed status moves; 409 otherwise
export const TRANSITIONS: Record<Status, Status[]> = {
  pending: ["triaged", "resolved", "false_positive"],
  triaged: ["pending", "resolved", "false_positive"],
  resolved: ["pending", "triaged"],
  false_positive: ["pending", "triaged"],
};