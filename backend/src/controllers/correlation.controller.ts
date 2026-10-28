import { Request, Response } from "express";
import { Types } from "mongoose";
import { Correlation } from "@services/correlate";
import { Finding } from "@modules/finding.models"; // your existing Finding model

// ---- helpers -------------------------------------------------------------
// Adjust to however your auth middleware stores the logged-in account.
const accountOf = (req: Request) => new Types.ObjectId((req as any).user.id);
const SHA = /^[0-9a-f]{7,40}$/i;
const int = (v: unknown, def: number, min: number, max: number) =>
  Math.min(Math.max(parseInt(String(v), 10) || def, min), max);

// whitelist: user input never goes straight into $sort
const SORTS = {
  smart:  { day: -1, findings: -1, topScore: -1, lastScan: -1 }, // newest day, then most errors
  newest: { lastScan: -1 },
  errors: { findings: -1, topScore: -1, lastScan: -1 },
} as const;

// ---- GET /api/v1/correlation/repos --------------------------------------
export async function listRepos(req: Request, res: Response) {
  const rows = await Correlation.aggregate([
    { $match: { accountId: accountOf(req) } },
    { $group: { _id: "$repo_id", clusters: { $sum: 1 }, commits: { $addToSet: "$commitSha" }, lastScan: { $max: "$createdAt" } } },
    { $sort: { lastScan: -1 } },
    { $project: { _id: 0, repo_id: "$_id", clusters: 1, commits: { $size: "$commits" }, lastScan: 1 } },
  ]);
  res.json(rows.map((r) => ({ ...r, name: String(r.repo_id) }))); // TODO: join your repos collection for the real name
}

// ---- GET /api/v1/correlation/:repoId?sort=smart|newest|errors&page=1&limit=50
// Returns EVERY commit that has clusters (paged), not just 10.
export async function listCommits(req: Request, res: Response) {
  const repo_id = Number(req.params.repoId);
  if (!Number.isInteger(repo_id)) return res.status(400).json({ error: "bad repoId" });

  const key = String(req.query.sort);
  const sort = SORTS[(Object.hasOwn(SORTS, key) ? key : "smart") as keyof typeof SORTS];
  const limit = int(req.query.limit, 50, 1, 200);
  const page = int(req.query.page, 1, 1, 10_000);

  const [r] = await Correlation.aggregate([
    { $match: { accountId: accountOf(req), repo_id, commitSha: { $type: "string", $ne: "" } } },
    { $group: {
        _id: "$commitSha",
        clusters: { $sum: 1 },
        findings: { $sum: "$size" },            // errors inside the clusters
        topScore: { $max: "$avgScore" },
        tools: { $addToSet: { $arrayElemAt: ["$tools", 0] } },
        lastScan: { $max: "$createdAt" },
    } },
    { $addFields: { day: { $dateToString: { format: "%Y-%m-%d", date: "$lastScan", timezone: "Asia/Kolkata" } } } },
    { $facet: {
        items: [
          { $sort: sort },
          { $skip: (page - 1) * limit },
          { $limit: limit },
          { $project: { _id: 0, commitSha: "$_id", clusters: 1, findings: 1, topScore: 1, tools: 1, lastScan: 1 } },
        ],
        total: [{ $count: "n" }],
    } },
  ]);

  const total = r?.total?.[0]?.n ?? 0;
  res.json({ items: r?.items ?? [], page, limit, total, hasMore: page * limit < total });
}

// ---- GET /api/v1/correlation/:repoId/commits/:sha  (clusters of one commit)
export async function listClusters(req: Request, res: Response) {
  const repo_id = Number(req.params.repoId);
  const sha = String(req.params.sha);
  if (!Number.isInteger(repo_id) || !SHA.test(sha)) return res.status(400).json({ error: "bad params" });

  const items = await Correlation.find(
    { accountId: accountOf(req), repo_id, commitSha: { $regex: "^" + sha } }, // URL carries the short sha
    { edges: 0, findingIds: 0 }
  ).sort({ avgScore: -1 }).limit(200).lean();

  res.json(items);
}

// ---- GET /api/v1/correlation/:repoId/clusters/:clusterId  (graph + findings)
export async function getCluster(req: Request, res: Response) {
  const repo_id = Number(req.params.repoId);
  const doc: any = await Correlation.findOne({
    accountId: accountOf(req), repo_id, clusterId: req.params.clusterId,
  }).lean();
  if (!doc) return res.status(404).json({ error: "cluster not found" });

  const found: any[] = await Finding.find({ _id: { $in: doc.findingIds }, accountId: accountOf(req) })
    .select("ruleId severity message tool file startLine endLine git_author git_commit_hash git_commit_summary firstSeenCommit")
    .lean();

  doc.findings = found.map((f) => ({
    id: String(f._id),
    title: f.message,                 // e.g. "'@services/Persistfindings' imported multiple times."
    severity: f.severity,             // MINOR / MAJOR / ... mapped to colours in the UI
    tool: f.tool,
    file: f.file,
    line: f.startLine,
    rule: f.ruleId,
    author: f.git_author,
    blameCommit: f.git_commit_hash,   // the commit that wrote this code = likely root cause
    blameSummary: f.git_commit_summary,
  }));
  res.json(doc);
}
