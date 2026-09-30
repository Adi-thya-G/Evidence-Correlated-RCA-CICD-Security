import { Types, PipelineStage } from "mongoose";
import { Finding } from "@modules/finding.models";
import ApiError from "@utils/ApiError";
import ApiResponse from "@utils/ApiResponse";

import { asyncHandler } from "@utils/asyncHandler";
import {
  STATUSES, TOOLS, SEVERITIES, RANK_TO_SEV, TRANSITIONS, sevRankExpr,
  buildMatch, getPaging, getScope, parseSort, toSev,
  toCommit, toListItem, sliceFileDiff,
  type Status,
} from "@utils/findingsHelper";

const HEAVY = { git_diff: 0, raw: 0 } as const; // never send these in list responses

// GET /findings/data
export const getFindings = asyncHandler(async (req, res) => {
  const match = buildMatch(req, { includeTool: true });
  const { page, pageSize, skip } = getPaging(req);

  const pipeline: PipelineStage[] = [
    { $match: match },
    { $addFields: { sevRank: sevRankExpr } },
    { $sort: parseSort(req.query.sort) },
    { $skip: skip },
    { $limit: pageSize },
    { $project: HEAVY },
  ];

  const [docs, total] = await Promise.all([
    Finding.aggregate(pipeline),
    Finding.countDocuments(match),
  ]);

  return new ApiResponse(200, "findings fetched successfully", {
    data: docs.map(toListItem),
    page,
    pageSize,
    total,
    totalPages: Math.ceil(total / pageSize),
  }).send(res);
});

// GET /findings/summary  (deliberately ignores `tool` so every chip keeps its count)
export const getFindingsSummary = asyncHandler(async (req, res) => {
  const match = buildMatch(req, { includeTool: false });

  const [r] = await Finding.aggregate([
    { $match: match },
    {
      $facet: {
        byTool: [{ $group: { _id: "$tool", n: { $sum: 1 } } }],
        byStatus: [{ $group: { _id: { $ifNull: ["$status", "pending"] }, n: { $sum: 1 } } }],
        bySeverity: [{ $group: { _id: { $toUpper: "$severity" }, n: { $sum: 1 } } }],
      },
    },
  ]);

  const byTool = Object.fromEntries(TOOLS.map((t) => [t, 0])) as Record<string, number>;
  const byStatus = Object.fromEntries(STATUSES.map((s) => [s, 0])) as Record<string, number>;
  const bySeverity = Object.fromEntries(SEVERITIES.map((s) => [s, 0])) as Record<string, number>;

  r?.byTool.forEach((x: any) => { if (x._id in byTool) byTool[x._id] += x.n; });
  r?.byStatus.forEach((x: any) => { if (x._id in byStatus) byStatus[x._id] += x.n; });
  r?.bySeverity.forEach((x: any) => { bySeverity[toSev(x._id)] += x.n; });

  const total = Object.values(byTool).reduce((a, b) => a + b, 0);
  return new ApiResponse(200, "summary fetched successfully", { total, byTool, byStatus, bySeverity }).send(res);
});

// GET /findings/by-commit  (pagination is over commits, not findings)
export const getFindingsByCommit = asyncHandler(async (req, res) => {
  const match = buildMatch(req, { includeTool: true });
  const { page, pageSize, skip } = getPaging(req);

  const [r] = await Finding.aggregate([
    { $match: match },
    { $project: HEAVY },
    { $addFields: { sevRank: sevRankExpr } },
    { $sort: { enrichedAt: -1, _id: -1 } },
    {
      $group: {
        _id: "$git_commit_hash",
        count: { $sum: 1 },
        topRank: { $max: "$sevRank" },
        latest: { $max: "$enrichedAt" },
        findings: { $push: "$$ROOT" },
      },
    },
    { $sort: { count: -1, topRank: -1, latest: -1, _id: 1 } },
    {
      $facet: {
        data: [{ $skip: skip }, { $limit: pageSize }],
        total: [{ $count: "n" }],
      },
    },
  ]).allowDiskUse(true);

  const total = r?.total[0]?.n ?? 0;
  const data = (r?.data ?? []).map((g: any) => ({
    commit: toCommit(g.findings[0]),
    count: g.count,
    topSeverity: RANK_TO_SEV[g.topRank],
    findings: g.findings.map(toListItem),
  }));

  return new ApiResponse(200, "commit groups fetched successfully", {
    data, page, pageSize, total, totalPages: Math.ceil(total / pageSize),
  }).send(res);
});

// GET /findings/:id
export const getFindingById = asyncHandler(async (req, res) => {
  const { id } = req.params;
  if (!Types.ObjectId.isValid(id)) throw new ApiError(404, "finding not found", "invalid finding id");

  const doc: any = await Finding.findOne({ _id: id, ...getScope(req) }).select("-raw").lean();
  if (!doc) throw new ApiError(404, "finding not found", "finding not found for this repository");

  return new ApiResponse(200, "finding fetched successfully", {
    ...toListItem(doc),
    commit: toCommit(doc, doc.git_diff),
    gitDiff: sliceFileDiff(doc.git_diff, doc.file),
    fingerprint: doc.fingerprint,
    triage: doc.triage ?? null,
  }).send(res);
});

// PATCH /findings/:id   body: { status, note? }
export const updateFindingStatus = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { status, note } = (req.body ?? {}) as { status?: Status; note?: string };

  if (!Types.ObjectId.isValid(id)) throw new ApiError(404, "finding not found", "invalid finding id");
  if (!status || !STATUSES.includes(status)) {
    throw new ApiError(422, "invalid status", `status must be one of ${STATUSES.join(", ")}`);
  }

  const scope = getScope(req);
  const current: any = await Finding.findOne({ _id: id, ...scope }).select("status").lean();
  if (!current) throw new ApiError(404, "finding not found", "finding not found for this repository");

  const from: Status = current.status ?? "pending";
  if (!TRANSITIONS[from].includes(status)) {
    throw new ApiError(409, "invalid transition", `cannot move ${from} -> ${status}`);
  }

  // filter includes the old status so two concurrent edits can't both win
  const updated: any = await Finding.findOneAndUpdate(
    { _id: id, ...scope, status: from === "pending" ? { $in: ["pending", null] } : from },
    { $set: { status, triage: { by: scope.accountId, at: new Date(), note: note?.trim() || null } } },
    { new: true },
  ).select("-raw").lean();

  if (!updated) throw new ApiError(409, "conflict", "finding was changed by someone else, refresh and retry");

  return new ApiResponse(200, "finding status updated", {
    ...toListItem(updated),
    commit: toCommit(updated, updated.git_diff),
    gitDiff: sliceFileDiff(updated.git_diff, updated.file),
    fingerprint: updated.fingerprint,
    triage: updated.triage ?? null,
  }).send(res);
});

// POST /findings/bulk-status   body: { ids: string[], status }
export const bulkUpdateStatus = asyncHandler(async (req, res) => {
  const { ids, status } = (req.body ?? {}) as { ids?: string[]; status?: Status };

  if (!Array.isArray(ids) || ids.length === 0 || ids.length > 200) {
    throw new ApiError(400, "invalid ids", "send between 1 and 200 ids");
  }
  if (!status || !STATUSES.includes(status)) {
    throw new ApiError(422, "invalid status", `status must be one of ${STATUSES.join(", ")}`);
  }

  const scope = getScope(req);
  const valid = ids.filter((i) => Types.ObjectId.isValid(i));

  // only ids that belong to this user + repo are touched; the rest are reported back as failed
  const owned: Types.ObjectId[] = await Finding.find({ _id: { $in: valid }, ...scope }).distinct("_id");
  await Finding.updateMany(
    { _id: { $in: owned }, ...scope },
    { $set: { status, triage: { by: scope.accountId, at: new Date(), note: null } } },
  );

  const ownedSet = new Set(owned.map(String));
  const failed = ids.filter((i) => !ownedSet.has(i));
  return new ApiResponse(200, "findings updated", { updated: owned.length, failed }).send(res);
});