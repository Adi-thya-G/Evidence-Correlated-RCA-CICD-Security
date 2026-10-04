import { asyncHandler } from "@utils/asyncHandler";
import crypto from "crypto";
import { CreateWebHooks } from "@utils/CreateWebHooks";
import { Installation } from "@modules/Installation";
import { handlePushEvent } from "@webHooks/handlePushEvent";
import { runSonarQubeScanner, projectKey } from "@utils/SonarQube";
import { fetchSonarIssues, fetchSonarHotspots } from "@axios/sonarQube";
import { SonarQubeReport } from "@modules/SonarQubeReport";
import { SonarAnalysisHistory } from "@modules/SonarQubeHistory";
import { User } from "@modules/User";
import mongoose from "mongoose";
import { runSecurityScan } from "@utils/RunSecurityScan";
import { producer } from "@kafka/producer";
import { SecurityScanReport } from "@modules/SecurityScannerReport";
import { notify } from "@utils/notify";

export const webHookHandler = asyncHandler(async (req, res) => {
  const signature = req.headers["x-hub-signature-256"] as string;
  const expected =
    "sha256=" +
    crypto
      .createHmac("sha256", process.env.GITHUB_WEBHOOK_SECRET as string)
      .update(req.body)
      .digest("hex");

  if (
    !signature ||
    signature.length !== expected.length ||
    !crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expected))
  ) {
    return res.status(401).send("Invalid signature");
  }

  const event = req.headers["x-github-event"];
  const payload = JSON.parse(req.body.toString());

  // some GitHub events carry no installation object
  const installationId = payload.installation?.id;

  if (event === "installation") {
    if (payload.action === "created") {
      await CreateWebHooks(installationId, payload);

      await notify(installationId, {
        type: "github",
        title: "GitHub Connected",
        message: "Your GitHub account was successfully connected.",
      });

      for (const repo of payload.repositories ?? []) {
        await notify(installationId, {
          type: "repository",
          title: "Repository Added",
          message: `${repo.name} was added successfully.`,
        });
      }
    } else if (payload.action === "deleted") {
      await Installation.updateOne(
        { installationId },
        { $set: { status: "deleted", deletedAt: new Date() } },
      );
    } else if (payload.action === "suspend") {
      await Installation.updateOne(
        { installationId },
        { $set: { status: "suspended", suspendedAt: new Date() } },
      );
    } else if (payload.action === "unsuspend") {
      await Installation.updateOne(
        { installationId },
        { $set: { status: "confirmed", suspendedAt: null } },
      );
    } else {
      console.log("unhandled installation action:", payload.action);
    }
  } else if (event === "push") {
    const branch = payload.ref?.replace("refs/heads/", "") ?? "main";

    await notify(installationId, {
      type: "pipeline",
      title: "Pipeline Started",
      message: `Analysis has started for the ${branch} branch.`,
    });

    const response = await handlePushEvent(payload);
    const key = await projectKey(installationId, payload.repository.id);

    await notify(installationId, {
      type: "sonarqube",
      title: "SonarQube Analysis Started",
      message: "SonarQube is analyzing your latest commit.",
    });

    await runSonarQubeScanner(response, key);

    const ownerId = payload.organization?.id ?? payload.repository.owner.id;
    const user = await User.findOne({ githubId: ownerId }, { _id: 1 });

    await SonarQubeReport.findOneAndUpdate(
      { projectKey: key },
      {
        accountId: user?._id as mongoose.Types.ObjectId,
        repo_id: payload?.repository?.id,
        installationId, // needed so the SonarQube webhook can notify the right user
      },
      {
        upsert: true,
        new: true,
      },
    );

    const userId = user?._id;
    const repoId = payload.repository.id;

    await notify(installationId, {
      type: "security",
      title: "Security Scan Started",
      message: "Semgrep, Trivy, and Gitleaks scans are now running.",
    });

    runSecurityScan(response, {
      accountId: String(userId),
      repo_id: repoId,
      projectKey: key,
      branch: payload.repository.branch ?? branch,
      scriptPath:
        "D:/Evidence-Correlated-RCA-CICD-Security/backend/scripts/scan-and-store.js",
    });
  } else if (event === "installation_repositories") {
    const githubId = payload.installation.account.id;

    if (payload.action === "removed") {
      const repositoryId = payload.repositories_removed[0].id;

      await Installation.findOneAndUpdate(
        {
          accountId: githubId,
          "repositories.repoId": repositoryId,
        },
        {
          $set: {
            "repositories.$.disconnected": true,
          },
        },
      );
    } else if (payload.action === "added") {
      const repo = payload.repositories_added[0];

      const repositoryData = {
        repoId: repo.id,
        name: repo.name,
        fullName: repo.full_name,
        private: repo.private,
        lastSyncedCommit: null,
        disconnected: false,
        correlationHistory: false,
      };

      const updated = await Installation.findOneAndUpdate(
        {
          accountId: githubId,
          "repositories.repoId": repo.id,
        },
        {
          $set: {
            "repositories.$.disconnected": false,
            "repositories.$.name": repo.name,
            "repositories.$.fullName": repo.full_name,
            "repositories.$.private": repo.private,
          },
        },
        { new: true },
      );

      if (!updated) {
        await Installation.findOneAndUpdate(
          { accountId: githubId },
          {
            $push: {
              repositories: repositoryData,
            },
          },
        );
      }

      await notify(installationId, {
        type: "repository",
        title: "Repository Added",
        message: `${repo.name} was added successfully.`,
      });
    }
  } else {
    console.log(event, payload.repository?.owner?.id);
  }

  res.send("0k");
});

// SonarQube calls this when an analysis finishes.
export const sonarQubeWebHookHandler = asyncHandler(async (req, res, next) => {
  const payload = req.body;
  res.status(200).send("Ok");

  if (payload.status !== "SUCCESS") return;
  const projectKey = payload.project.key;
  const branch = payload.branch?.name ?? "main";
  const commitSha = payload.revision; // Sonar sends this IF you pass sonar.scm.revision at scan time
  const analysedAt = payload.analysedAt
    ? new Date(payload.analysedAt)
    : new Date();

  const [issues, hotspots] = await Promise.all([
    fetchSonarIssues(projectKey, branch),
    fetchSonarHotspots(projectKey, branch),
  ]);

  const report = await SonarQubeReport.findOneAndUpdate(
    {
      projectKey,
    },
    {
      projectKey: String(projectKey),
      projectName: payload.project.name,
      branch,
      taskId: payload.taskId,
      status: payload.status,
      qualityGateStatus: payload.qualityGate?.status,
      qualityGateConditions: payload.qualityGate?.conditions ?? [],
      issues,
      hotspots,
      totalIssues: issues.length,
      totalHotspots: hotspots.length,
      analysedAt,
      rawPayload: payload,
    },
    { upsert: true, new: true },
  );

  const installationId = report.installationId;

  await notify(installationId, {
    type: "sonarqube",
    title: "SonarQube Analysis Completed",
    message: `Analysis completed with ${issues.length} issues detected.`,
  });

  console.log(payload.qualityGate?.status === "ERROR","error")

  if (payload.qualityGate?.status === "ERROR") {
    await notify(installationId, {
      type: "deployment",
      title: "Deployment Blocked",
      message:
        "Deployment was blocked because critical findings were detected.",
    });
  }

  if (commitSha) {
    const accountId = report.accountId;
    if (!accountId) {
      console.error(
        `No accountId found on SonarQubeReport for project ${projectKey} — skipping history write`,
      );
    } else {
      await SonarAnalysisHistory.findOneAndUpdate(
        { projectKey, branch, commitSha },
        {
          $set: {
            repo_id: report.repo_id,
            analysisId: payload.taskId,
            issueKeys: issues.map((i: any) => i.key),
            analysedAt,
            qualityGateStatus: payload.qualityGate?.status,
            totalIssues: issues.length,
            totalHotspots: hotspots.length,
          },
          $setOnInsert: {
            accountId,
            projectKey,
            branch,
            commitSha,
          },
        },
        { upsert: true, new: true },
      );

      const security = await SecurityScanReport.findOne({
        accountId,
        repo_id: report.repo_id,
      });

      producer.send({
        topic: "raw-findings",
        messages: [
          {
            key: `${report.repo_id}:${report.accountId}`,
            value: JSON.stringify({
              accountId: report.accountId,
              repo_id: report.repo_id,
              commitSha,
              cloneUrl: security?.repoPath,
              installationId: security?.repoPath?.split("\\")[4],
            }),
          },
        ],
      });

     
    }
  }
});

/*
 * Add to the SonarQubeReport schema:
 *   installationId: { type: Number, index: true },
 *
 * Call these from runSecurityScan / your Kafka consumer when each stage ends:
 *
 *   await notify(installationId, {
 *     type: "security",
 *     title: "Security Issues Found",
 *     message: "The security scan detected vulnerabilities that require attention.",
 *   });
 *
 *   await notify(installationId, {
 *     type: "correlation",
 *     title: "Root Cause Analysis Completed",
 *     message: "Findings have been correlated with commits to identify possible root causes.",
 *   });
 *
 *   await notify(installationId, {
 *     type: "pipeline",
 *     title: "Pipeline Completed",
 *     message: "All analysis stages completed successfully.",
 *   });
 */

//
