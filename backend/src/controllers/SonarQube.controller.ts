import {SonarQubeReport} from "@modules/SonarQubeReport"
import { asyncHandler } from "@utils/asyncHandler"
import ApiResponse from "@utils/ApiResponse"
import {fetchSonarSnippet} from "@axios/sonarSource"
import ApiError from "@utils/ApiError";

import mongoose from "mongoose";

interface QueryParmsReport extends Request{
  projectKey:string,
  page:number,
  page_size:number
}

export const getSonarQubeReport = asyncHandler(async (req,res) => {
  const userId=req.user?.userId;
  const {projectKey,page,page_size}=req?.query as QueryParmsReport??{}
  if(!projectKey){
       throw new ApiError(404,"project key not found","please provide project key")
  }
  if(!page){
    throw new ApiError(404,"page ","page is refred to start of page not found")
  }
  if(!page_size){
    throw new ApiError(404,"page size not defined","page size required ")
  }

  const skip=(page-1)*page_size;


  const [reports] = await SonarQubeReport.aggregate([
  { $match: { accountId: new mongoose.Types.ObjectId(userId), projectKey } },
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
          { $sortArray: { input: "$issues", sortBy: { sortRank: -1 } } }, // -1 = highest severity first
          skip,
          Number(page_size),
        ],
      },
    },
  },
]);
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