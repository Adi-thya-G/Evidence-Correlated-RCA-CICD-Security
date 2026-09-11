import { env } from "@config/env";
import { User } from "@modules/User";
import ApiError from "@utils/ApiError";
import { asyncHandler } from "@utils/asyncHandler";
import JWT from "jsonwebtoken";
import { Types } from "mongoose";


export const verifyToken = asyncHandler(async (req, res, next) => {
  const { session_token } = req.cookies;
  if (!session_token)
    next(new ApiError(404, "token error", "session token not found"));
  const decode = JWT.verify(session_token, env.JWT_SECRET) as {
    userId: Types.ObjectId;
    githubId: number;
    login: string;
  };
  if (!decode) {
    return new ApiError(404, "TOKEN NOT FOUND", "session token not found");
  }

  const { userId, githubId } = decode;
  const userFind=await User.findById(userId); 
  if(!userFind)
     throw new ApiError(404,"user not found error","user not found error")
  req.user = { userId, githubId };
  next();
});
