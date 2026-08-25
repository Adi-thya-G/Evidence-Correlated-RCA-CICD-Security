import { env } from "@config/env";
import ApiError from "@utils/ApiError";
import { asyncHandler } from "@utils/asyncHandler";
import JWT from "jsonwebtoken";
import { Types } from "mongoose";
export const verifyToken = asyncHandler(async (req, res, next) => {
  const { session_token } = req.cookies;
  if (!session_token)
    next(new ApiError(404, "token error", "session token not found"));
  console.log(session_token);
  const decode = JWT.verify(session_token, env.JWT_SECRET) as {
    userId: Types.ObjectId;
    githubId: number;
    login: string;
  };
  if (!decode) {
    return new ApiError(404, "TOKEN NOT FOUND", "session token not found");
  }

  const { userId, githubId } = decode;
  req.user = { userId, githubId };
  next();
});
