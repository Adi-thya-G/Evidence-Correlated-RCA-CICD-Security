import {SonarQubeReport} from "@modules/SonarQubeReport"
import { asyncHandler } from "@utils/asyncHandler"
import ApiResponse from "@utils/ApiResponse"
import {fetchSonarSnippet} from "@axios/sonarSource"
import ApiError from "@utils/ApiError";

export const getSonarQubeReport = asyncHandler(async (req, res) => {
  const userId=req.user?.userId;
  const reports=await SonarQubeReport.find({accountId:userId}).lean();
  reports[0]?.issues?.sort((a, b) => {
    if(a?.severity < b?.severity) return -1;
    if(a?.severity > b?.severity) return 1;
    return 0;
  });
  console.log(reports);
  new ApiResponse(200, "SonarQube reports fetched successfully", reports).send(res);
});



interface queryProps {
   key:string,
  line:number,
  context?:number
 
}

export const getSonarQubeCode=asyncHandler(async (req: any, res) => {
  const {key,line,context}=req?.query as queryProps;
  if(!key)
     throw new ApiError(404,"query key not found","please provide query paramter")
  if(!line){
    throw new ApiError(404,"line not found","please provide line number")
  }
  if(!context){
    throw new ApiError(404,"context length not defined","please provide context length");
  }
  const snippet=await fetchSonarSnippet(key,line,context)
  new ApiResponse(200, "SonarQube code snippet fetched successfully", snippet).send(res)
})