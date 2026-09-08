import { asyncHandler } from "@utils/asyncHandler";
import { Installation } from "@modules/Installation";
import ApiError from "@utils/ApiError";
import { SonarQubeReport } from "@modules/SonarQubeReport";
import ApiResponse from "@utils/ApiResponse";


interface repoList{
  repo_id:number,
  default:boolean,
  name:string,
  full_name:string,
  createAt:Date | null,
  private:boolean


}

export const getRepo=asyncHandler(async(req,res,next)=>{
  const {userId ,githubId}=req.user ??{};
  if(!userId)
     throw new ApiError(404,"token not found","session_token not found");
  if(!githubId){
    throw new ApiError(404,"github id","github id not found")
  }

  const repo=await Installation.findOne({accountId:githubId})


  const sonarReport=await SonarQubeReport.findOne({accountId:userId}).sort({ createdAt: -1 });
   
 const response: repoList[] = repo?.repositories.map((element) => {

    const isDefault = element.repoId === sonarReport?.repo_id;

    return {
      repo_id: element.repoId,
      default: isDefault,
      name:element.name,
      full_name: element.fullName,
      createAt: isDefault ? sonarReport!.createdAt : null,
      private: element.private
    };
  }) ?? [];

  return new ApiResponse(200,"repo list is successfuly fetched",response).send(res)

})