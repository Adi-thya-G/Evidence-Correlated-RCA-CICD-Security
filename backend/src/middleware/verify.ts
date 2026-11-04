import { env } from "@config/env";
import { User } from "@modules/User";
import ApiError from "@utils/ApiError";
import { asyncHandler } from "@utils/asyncHandler";
import JWT ,{ TokenExpiredError}from "jsonwebtoken";
import { Types } from "mongoose";


export const verifyToken = asyncHandler(async (req, res, next) => {
  try{
    const { session_token } = req.cookies;
  console.log(session_token,req.cookies)
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
  }
  catch (err) {
    const expired = err instanceof TokenExpiredError;
    return res.status(401).json({
      success: false,
      error: expired ? "token_expired" : "invalid_token",
      message: expired ? "Token expired" : "Invalid token",
    });
  }

});
