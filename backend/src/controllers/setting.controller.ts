import { Installation } from "@modules/Installation";
import { Setting } from "@modules/Setting";
import { User } from "@modules/User";
import ApiError from "@utils/ApiError";
import ApiResponse from "@utils/ApiResponse";
import { asyncHandler } from "@utils/asyncHandler";
import { userSetupSettingService } from "@services/UserSetupService";

import { Finding } from "@modules/finding.models";
import { Types } from "mongoose";

interface DangerZoneBody {
  Disconnect_repository?: boolean;
  correlation_history?: boolean;
}


export const getSetting=asyncHandler(async(req,res)=>{

  const userId=req.user?.userId??null;
  if(userId==null){
    throw new ApiError(404,"user id not found","user id not found please provide")

  }
  const setting=await Setting.findOne({userId:userId})
  if(!setting){
   const newSettingDoc= await userSetupSettingService(userId);
    return new ApiResponse(200,"successfuly setting data fetched",newSettingDoc).send(res);
  }

  return new ApiResponse(200,"successfuly setting data fetched",setting).send(res);

})


export const getDangerZone=asyncHandler(async(req,res)=>{
  const {repo_id}=req.params;
  console.log(repo_id)
  if(!repo_id)
     throw new ApiError(401,"repo id not found","please give repo id")

  const accountId=req.user?.userId;

  const installationDoc=await User.findById(accountId);
  if(!installationDoc)
     throw new ApiError(401,"user with repo id not found","user with repo id not found");
  
const [repo] = await Installation.aggregate([
  { $match: { installationId: Number(installationDoc.installationId) } },
  { $unwind: "$repositories" },
  { $match: { "repositories.repoId": Number(repo_id) } },
  { $replaceRoot: { newRoot: "$repositories" } },
]);
// repo is the object, or undefined if nothing matched

if(repo==undefined)
   throw new ApiError(404,"repo not found","give repo id is not found")
  const response:DangerZoneBody={
    correlation_history:repo?.correlationHistory,
    Disconnect_repository:repo?.disconnected
  }
  console.log(response)
  return new ApiResponse(200,"repository DanzerZone data fetched successfuly",response).send(res);
})


// update setting individual

// correlation update

interface correlationType{
   threshold ?:number
   retrieval ?:number 
}

export const correlationUpdate=asyncHandler(async(req,res)=>{
  const user_id=req.user?.userId;
  const {threshold,retrieval}=req.body as correlationType;
  if(threshold!=undefined || retrieval!=undefined)
  {
   await Setting.findOneAndUpdate({userId:user_id},{$set:req.body})
  }

  const setting=await Setting.findOne({userId:user_id})
  return new ApiResponse(200,"resource is updated successfully",setting).send(res);


})

//notification update

interface notificationType{
  email ?:boolean,
  slack ?:boolean,
  alertThresholds ?: "Critical only" | "Critical + High" | "All severities";

}

export const notificationUpdate=asyncHandler(async(req,res,)=>{
  const user_id=req.user?.userId
  console.log(req.body)
  const {email,slack,alertThresholds}=req.body as notificationType;
  if(email!=undefined||slack!=undefined||alertThresholds!=undefined){
    await Setting.findOneAndUpdate({userId:user_id},{$set:req.body})
  }

  const setting=await Setting.findOne({userId:user_id})
  return new ApiResponse(200,"settings is updated",setting).send(res);
})




export const danger_zone_update = asyncHandler(async (req, res) => {
  const userId = req.user?.userId;
  const githubId = req.user?.githubId;
  const repo_id = Number(req.params.repo_id);
  const {correlation_history,Disconnect_repository } = (req.body ?? {}) as DangerZoneBody;

  if (Number.isNaN(repo_id)) {
    throw new ApiError(400, "invalid repo id", "repo_id must be a number");
  }

  // Whitelist: only these two fields can ever be changed (never $set: req.body).
  const updates: Record<string, boolean> = {};
  if (typeof Disconnect_repository === "boolean") {
    updates["repositories.$.disconnected"] = Disconnect_repository;
  }
  if (typeof correlation_history === "boolean") {
    updates["repositories.$.correlationHistory"] = correlation_history;
  }
  if (Object.keys(updates).length === 0) {
    throw new ApiError(400, "nothing to update", "send disconnected and/or correlationHistory as booleans");
  }

  const user = await User.findOne({ githubId, _id: userId });
  if (!user) {
    throw new ApiError(404, "user not found", "user id not found");
  }

  // The user's own installation + the repo inside it. This is also the
  // ownership check: a user can only touch repos of their installation.
  const filter = {
    installationId: Number(user.installationId),
    "repositories.repoId": repo_id,
  };

  // aggregate() only READS. updateOne() with the positional operator ($)
  // is what actually writes to the matched array element.
  const result = await Installation.updateOne(filter, { $set: updates });

  if (result.matchedCount === 0) {
    throw new ApiError(404, "repo not found", "repo not found for this installation");
  }

  // Return the updated repo as a single object.
  const doc = await Installation.findOne(filter, { "repositories.$": 1, _id: 0 }).lean();
  const repo = doc?.repositories?.[0];
  const response:DangerZoneBody={
    correlation_history:repo?.correlationHistory,
    Disconnect_repository:repo?.disconnected
  }

  return new ApiResponse(200,"danger-zone  is updated",response).send(res);
});


// get team information

interface LastCommit {
  hash: string | null;
  shortHash: string | null;
  date: Date | null;
  summary: string | null;
}

interface ResponseInterface {
  git_auth: string;
  git_email: string;
  findings: number;
  last_commit: LastCommit;
}

export const teamAccess = asyncHandler(async (req, res) => {
  const userId = req.user?.userId;
  const repo_id = Number(req.params.id);

  if (!req.params.id || !Number.isInteger(repo_id))
    throw new ApiError(400, "invalid repo id", "please provide a numeric repo id");

  const authors = await Finding.aggregate([
    {
      $match: {
        accountId: new Types.ObjectId(userId),
        repo_id,
        git_author: { $nin: [null, ""] },
      },
    },
    { $sort: { git_commit_date: -1 } },          // newest first, so $first = last commit
    {
      $group: {
        _id: "$git_author",                       // email
        header: { $first: { $substrCP: ["$git_diff", 0, 300] } },
        lastCommitHash: { $first: "$git_commit_hash" },
        lastCommitDate: { $first: "$git_commit_date" },
        lastCommitSummary: { $first: "$git_commit_summary" },
        findings: { $sum: 1 },
      },
    },
    { $sort: { lastCommitDate: -1 } },            // most recently active author first
  ]);

  const response: ResponseInterface[] = authors.map((a) => {
    const m = a.header?.match(/^Author:\s*(.+?)\s*<([^>]+)>/m);
    return {
      git_auth: m?.[1] ?? String(a._id).split("@")[0],
      git_email: m?.[2] ?? a._id,
      findings: a.findings,
      last_commit: {
        hash: a.lastCommitHash ?? null,
        shortHash: a.lastCommitHash?.slice(0, 7) ?? null,
        date: a.lastCommitDate ?? null,
        summary: a.lastCommitSummary ?? null,
      },
    };
  });

  return new ApiResponse(200, "team info is fetched", response).send(res);
});


