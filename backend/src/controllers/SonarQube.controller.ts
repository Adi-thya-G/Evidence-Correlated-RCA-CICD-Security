import { SonarQubeReport } from "@modules/SonarQubeReport";
import { asyncHandler } from "@utils/asyncHandler";
import ApiResponse from "@utils/ApiResponse";
import { fetchSonarSnippet } from "@axios/sonarSource";
import ApiError from "@utils/ApiError";
import {parseEffortToMinutes,formatMinutesAsEffortLabel}from "@utils/SonarQube"
import mongoose from "mongoose";
import e from "express";

interface QueryParmsReport extends Request {
  projectKey: string;
  page: number;
  page_size: number;
}

export const getSonarQubeReport = asyncHandler(async (req, res) => {
  const userId = req.user?.userId;
  const { projectKey, page, page_size } =
    (req?.query as QueryParmsReport) ?? {};
  if (!projectKey) {
    throw new ApiError(
      404,
      "project key not found",
      "please provide project key",
    );
  }
  if (!page) {
    throw new ApiError(
      404,
      "page ",
      "page is refred to start of page not found",
    );
  }
  if (!page_size) {
    throw new ApiError(404, "page size not defined", "page size required ");
  }

  const skip = (page - 1) * page_size;
  console.log(projectKey, page, page_size, "hello");

  const [reports] = await SonarQubeReport.aggregate([
    {
      $match: {
        accountId: new mongoose.Types.ObjectId(userId),
        repo_id: Number(projectKey),
      },
    },
    { $sort: { analysedAt: -1 } },
    { $limit: 1 },
    {
      $addFields: {
        issues: {
          $filter: {
            input: "$issues",
            as: "i",
            cond: { $in: ["$$i.status", ["OPEN", "CONFIRMED", "REOPENED"]] },
          },
        },
      },
    },
    {
      $addFields: {
        issues: {
          $map: {
            input: "$issues",
            as: "i",
            in: {
              $mergeObjects: [
                "$$i",
                {
                  sortRank: {
                    $switch: {
                      branches: [
                        { case: { $eq: ["$$i.severity", "BLOCKER"] }, then: 5 },
                        { case: { $eq: ["$$i.severity", "CRITICAL"] }, then: 4 },
                        { case: { $eq: ["$$i.severity", "MAJOR"] }, then: 3 },
                        { case: { $eq: ["$$i.severity", "MINOR"] }, then: 2 },
                        { case: { $eq: ["$$i.severity", "INFO"] }, then: 1 },
                      ],
                      default: 0,
                    },
                  },
                },
              ],
            },
          },
        },
      },
    },
    {
      $project: {
        projectKey: 1,
        totalIssues: { $size: "$issues" },
        issues: {
          $slice: [
            { $sortArray: { input: "$issues", sortBy: { sortRank: -1 } } },
            skip,
            Number(page_size),
          ],
        },
      },
    },
  ]);

  // NEW: fail loudly instead of sending 200 with undefined data
  if (!reports) {
    throw new ApiError(404, "report", "SonarQube report not found");
  }

  console.log(reports);
  new ApiResponse(200, "SonarQube reports fetched successfully", reports).send(
    res,
  );
});

interface queryProps {
  key: string;
  line: number;
  context?: number;
}

export const getSonarQubeCode = asyncHandler(async (req: any, res) => {
  const { key, line, context } = req?.query as queryProps;

  if (!key)
    throw new ApiError(
      404,
      "query key not found",
      "please provide query paramter",
    );
  if (!line) {
    throw new ApiError(404, "line not found", "please provide line number");
  }
  if (!context) {
    throw new ApiError(
      404,
      "context length not defined",
      "please provide context length",
    );
  }
  const snippet = await fetchSonarSnippet(key, line, context);
  new ApiResponse(
    200,
    "SonarQube code snippet fetched successfully",
    snippet,
  ).send(res);
});

// sumary of repo
export const getSonarQubeSummary = asyncHandler(async (req, res, next) => {
  const { projectKey } = req.query;
  if (!projectKey)
    throw new ApiError(404, "project key", "project key not founded");

  const report = await SonarQubeReport.findOne({
    repo_id: projectKey,
    accountId: req.user?.userId,
  });

  if (!report) {
    throw new ApiError(404, "report", "SonarQube report not found");
  }

  const counts = {
    Security_hotspots: 0,
    Security_hotspots_to_review: 0,
    Vulnerabilities: 0,
    Vulnerabilities_blocker: 0,
    Bugs: 0,
    Code_smells: 0,
    Code_smells_effort_minutes: 0,
  };

  const openStatuses = ["OPEN", "CONFIRMED", "REOPENED"];

  report.issues?.forEach((ele) => {
    if (!openStatuses.includes(ele?.status)) return; // skip resolved/closed issues

    if (ele?.type  === "CODE_SMELL") {
      counts.Code_smells += 1;
      counts.Code_smells_effort_minutes += parseEffortToMinutes(ele?.effort);
    } else if (ele?.type === "VULNERABILITY") {
      counts.Vulnerabilities += 1;
      if (ele?.severity === "BLOCKER") {
        counts.Vulnerabilities_blocker += 1;
      }
    } else if (ele?.type === "BUG") {
      counts.Bugs += 1;
    }
  });

 const openHotspotStatuses = ["TO_REVIEW"]; // or include others like "IN_REVIEW" if your Sonar setup uses that

report.hotspots?.forEach((ele) => {
  if (openHotspotStatuses.includes(ele?.status)) {
    counts.Security_hotspots += 1;
    if (ele?.status === "TO_REVIEW") {
      counts.Security_hotspots_to_review += 1;
    }
  }
});

  const qualityGateStatus = report.qualityGateStatus === "ERROR" ? "Failed" : "Passed";

 new ApiResponse(200,"ok",   {
      ...counts,
      Code_smells_effort_label: formatMinutesAsEffortLabel(counts.Code_smells_effort_minutes),
      Quality_gate: qualityGateStatus,
    }).send(res)
});

// helper functions — put these in @utils if not already there

