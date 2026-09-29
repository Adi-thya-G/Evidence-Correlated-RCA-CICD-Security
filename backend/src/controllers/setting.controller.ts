import { Installation } from "@modules/Installation";
import { Setting } from "@modules/Setting";
import ApiError from "@utils/ApiError";
import ApiResponse from "@utils/ApiResponse";
import { asyncHandler } from "@utils/asyncHandler";

const getSetting=asyncHandler(async(req,res,next)=>{
  const repo_id=req.params;
  if(!repo_id){
    throw  new ApiError(404,"repo id not found","please provid repo id")
  }
  const user=req.user
const installation = await Installation.findOne(
    {
        accountId: user?.githubId,
        "repositories.repoId": repo_id
    },
    {
        "repositories.$": 1
    }
);

const repositorySetting = installation?.repositories?.[0];
  if(!repositorySetting){
    throw new ApiError(404,"repository not found","give repo id repository is not found")
  }
  const setting=await Setting.findOne({userId:user?.userId});
  
  


  new ApiResponse(200,"setting data fetched",{...setting,...repositorySetting})
})