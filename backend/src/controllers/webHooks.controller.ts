import { asyncHandler } from "@utils/asyncHandler";
import crypto from "crypto";
import { CreateWebHooks } from "@utils/CreateWebHooks";
import { Installation } from "@modules/Installation";
import { handlePushEvent } from "@webHooks/handlePushEvent";
import { runSonarQubeScanner, projectKey } from "@utils/SonarQube";
import { fetchSonarIssues, fetchSonarHotspots } from "@axios/sonarQube";
import {SonarQubeReport} from "@modules/SonarQubeReport";
import {SonarAnalysisHistory} from "@modules/SonarQubeHistory"
import { User } from "@modules/User";
import mongoose from "mongoose";
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
    !crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expected))
  ) {
    return res.status(401).send("Invalid signature");
  }

  const event = req.headers["x-github-event"];
  const payload = JSON.parse(req.body.toString());

  if (event === "installation") {
    const installationId = payload.installation.id;

    if (payload.action === "created") {
      await CreateWebHooks(payload.installation.id, payload); // await this — don't fire-and-forget
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
    const response = await handlePushEvent(payload);
    const key = await projectKey(
      payload.installation.id,
      payload.repository.id,
    );
    await runSonarQubeScanner(response, key);
    const ownerId = payload.organization?.id ?? payload.repository.owner.id;
    console.log(ownerId);
    const user=await User.findOne({githubId:ownerId},{_id:1});
    console.log(user)
    const up=await SonarQubeReport.findOneAndUpdate({projectKey:key},{accountId:user?._id as mongoose.Types.ObjectId},{
      upsert: true, new: true
    });
    console.log(up)
  }

  res.send("hello");
});
// here sonarQube report is add sonarQube report and 
export const sonarQubeWebHookHandler = asyncHandler(async (req, res, next) => {
  const payload = req.body;
  res.status(200).send("Ok");

  if (payload.status !== "SUCCESS") return;
  const projectKey = payload.project.key;
  const branch = payload.branch?.name ?? "main";
  const commitSha = payload.revision;              // ← Sonar sends this IF you pass sonar.scm.revision at scan time
  const analysedAt = payload.analysedAt ? new Date(payload.analysedAt) : new Date();


  const [issues, hotspots] = await Promise.all([
    fetchSonarIssues(projectKey, branch),
    fetchSonarHotspots(projectKey, branch),
  ]);
 const report=await SonarQubeReport.findOneAndUpdate({
  projectKey
 },{
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
      analysedAt: payload.analysedAt ? new Date(payload.analysedAt) : new Date(),
      rawPayload: payload,
    },{upsert:true,new:true});


 console.log(report.accountId)


    if (commitSha) {
  const accountId = report.accountId;
  if (!accountId) {
    console.error(`No accountId found on SonarQubeReport for project ${projectKey} — skipping history write`);
  } else {
    await SonarAnalysisHistory.findOneAndUpdate(
      { projectKey, branch, commitSha },
      {
        $set: {
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
      { upsert: true, new: true }
    );
  }
}
    })
   


