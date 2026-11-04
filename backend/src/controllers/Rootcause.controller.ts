import { asyncHandler } from "@utils/asyncHandler";
import ApiError from "@utils/ApiError";
import ApiResponse from "@utils/ApiResponse";
import { RootCause } from "@modules/rootcause";

// "high confidence" = 85% or more (matches the card on the dashboard)
const HIGH_CONFIDENCE = 0.85;
const STATUSES = ["open", "resolved", "ignored"];

// first sentence of the explanation, used as the card title
const titleOf = (text?: string | null) => {
  const first = (text ?? "").trim().split(/(?<=[.!?])\s/)[0] ?? "";
  return first.length > 100 ? first.slice(0, 97) + "…" : first;
};

// GET /repos/:repoId/root-causes
export const listRootCauses = asyncHandler(async (req, res, next) => {
  const { userId } = req.user ?? {};
  if (!userId) throw new ApiError(404, "token not found", "session_token not found");

  const repoId = Number(req.params.repoId);
  if (!Number.isInteger(repoId)) throw new ApiError(400, "repo_id", "repoId must be a number");

  const filter: Record<string, unknown> = { accountId: userId, repo_id: repoId };
  if (req.query.status) filter.status = req.query.status;

  const items = await RootCause.find(filter)
    .sort({ confidence: -1, createdAt: -1 })
    .select("clusterId commitSha culprit_commit root_cause confidence status hallucinatedCommit createdAt")
    .lean();

  const response = items.map((d) => ({
    clusterId: d.clusterId,
    title: titleOf(d.root_cause),
    confidence: d.confidence,
    culprit_commit: d.culprit_commit,
    commitSha: d.commitSha,
    status: d.status,
    hallucinatedCommit: d.hallucinatedCommit,
    createdAt: d.createdAt,
  }));

  return new ApiResponse(200, "root causes fetched successfully", response).send(res);
});

// GET /root-causes/:clusterId   (clusterId has ":" in it, so encodeURIComponent it on the client)
export const getRootCause = asyncHandler(async (req, res, next) => {
  const { userId } = req.user ?? {};
  if (!userId) throw new ApiError(404, "token not found", "session_token not found");

  const doc = await RootCause.findOne({ accountId: userId, clusterId: req.params.clusterId }).lean();
  if (!doc) throw new ApiError(404, "root cause", "root cause not found");

  const response = {
    ...doc,
    title: titleOf(doc.root_cause),
    blocked: (doc.confidence ?? 0) >= HIGH_CONFIDENCE && doc.status === "open" && !doc.hallucinatedCommit,
  };

  return new ApiResponse(200, "root cause fetched successfully", response).send(res);
});

// GET /repos/:repoId/root-causes/summary   (the four cards at the top)
export const getSummary = asyncHandler(async (req, res, next) => {
  const { userId } = req.user ?? {};
  if (!userId) throw new ApiError(404, "token not found", "session_token not found");

  const repoId = Number(req.params.repoId);
  if (!Number.isInteger(repoId)) throw new ApiError(400, "repo_id", "repoId must be a number");

  const base = { accountId: userId, repo_id: repoId };
  const high = { ...base, confidence: { $gte: HIGH_CONFIDENCE } };

  const clusters = await RootCause.countDocuments(base);
  const highConfidence = await RootCause.countDocuments(high);
  const blocked = await RootCause.countDocuments({
    ...high,
    status: "open",
    hallucinatedCommit: { $ne: true },
  });

  const response = { clusters, highConfidence, blocked, deployBlocked: blocked > 0 };

  return new ApiResponse(200, "summary fetched successfully", response).send(res);
});

// PATCH /root-causes/:clusterId/status   body: { status: "open" | "resolved" | "ignored" }
export const updateStatus = asyncHandler(async (req, res, next) => {
  const { userId } = req.user ?? {};
  if (!userId) throw new ApiError(404, "token not found", "session_token not found");

  const { status } = req.body ?? {};
  if (!STATUSES.includes(status)) {
    throw new ApiError(400, "status", "status must be open, resolved or ignored");
  }

  const doc = await RootCause.findOneAndUpdate(
    { accountId: userId, clusterId: req.params.clusterId },
    { $set: { status } },
    { new: true }
  ).lean();
  if (!doc) throw new ApiError(404, "root cause", "root cause not found");

  return new ApiResponse(200, "status updated successfully", {
    clusterId: doc.clusterId,
    status: doc.status,
  }).send(res);
});