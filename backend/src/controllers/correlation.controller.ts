import { Request, Response } from "express";
import { Types } from "mongoose";
import {Finding} from "@modules/finding.models";

// whitelist: user input never goes straight into $sort
const SORTS = {
  smart:  { day: -1, findings: -1, high: -1, lastCommit: -1 }, // newest day, then most errors
  newest: { lastCommit: -1 },
  errors: { findings: -1, high: -1, lastCommit: -1 },
} as const;

export async function listCommits(req: Request, res: Response) {
  const userId = req.user?.userId;                    // from your auth middleware
  const repoId = Number(req.params.repoId);      // must be the same type as repo_id in the DB
  const q = String(req.query.sort);
  const sortKey = Object.hasOwn(SORTS, q) ? (q as keyof typeof SORTS) : "smart";



const commits = await Finding.aggregate([
  { $match: {
      accountId: new Types.ObjectId(userId),
      repo_id: Number(repoId),                 // Int32 in DB: a string "1341658140" would not match
      commitSha: { $type: "string" },          // was commit_sha
      status: { $ne: "RESOLVED" },             // don't count fixed findings
  }},
  { $group: {
      _id: "$commitSha",
      findings: { $sum: 1 },
      high: { $sum: { $cond: [{ $in: [{ $toUpper: "$severity" }, ["BLOCKER", "CRITICAL", "HIGH"]] }, 1, 0] } },
      tools: { $addToSet: "$tool" },
      lastScan: { $max: "$createdAt" },
      lastCommitDate: { $max: "$git_commit_date" },
  }},
  { $addFields: { day: { $dateToString: { format: "%Y-%m-%d", date: "$lastScan" } } } },
  { $sort: SORTS[sortKey] },
  { $limit: 100 },
  { $project: { _id: 0, commitSha: "$_id", findings: 1, high: 1, tools: 1, lastScan: 1, lastCommitDate: 1 } },
]);
  console.log(commits)

  res.json(commits);
}