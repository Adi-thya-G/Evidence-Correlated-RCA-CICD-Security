// src/types/express.d.ts
import "express";
import { Mongoose,Types } from "mongoose";

declare global {
  namespace Express {
    interface Request {
      rateLimit?: {
        limit: number;
        current: number;
        remaining: number;
        resetTime?: Date;
      };
      user?:{
        userId:Types.ObjectId,
        githubId:number
      }
    }
  }
}