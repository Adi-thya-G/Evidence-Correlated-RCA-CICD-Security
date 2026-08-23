import ApiResponse from "@utils/ApiResponse"
import { asyncHandler } from "@utils/asyncHandler";
import { tokenGenerator } from "@utils/tokenGenerator";

export const loginWithGithub=asyncHandler(async(req,res,next)=>{

const token=await tokenGenerator()  
console.log(token)
console.log("hello")
new ApiResponse(200,"this data",{username:"adithya",password:"adithyakg31@"}).send(res)

})



