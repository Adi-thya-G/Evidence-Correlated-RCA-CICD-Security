import { rateLimit } from "express-rate-limit";

import ApiError from "@utils/ApiError";



export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res, next) => {
    const resetMs = req?.rateLimit?.resetTime
      ? req.rateLimit.resetTime.getTime() - Date.now()
      : 15 * 60 * 1000;
    const retryAfterSeconds = Math.max(1, Math.ceil(resetMs / 1000));
    res.setHeader("Retry-After", retryAfterSeconds);
    next(
      new ApiError(
        429,
        `Too many auth attempts. Try again in ${retryAfterSeconds} seconds.`,
        "AUTH_RATE_LIMITED",
        {
          retryAfterSeconds,
          traceId: req.headers["x-trace-id"] as string,
        },
      ),
    );
  },
});


export const userRateLimiter=rateLimit({
  windowMs:15*60*1000,
  max:200,
  standardHeaders:true,
  legacyHeaders:false,
  handler: (req,res,next)=>{
    const resetMs=req.rateLimit?.resetTime?req.rateLimit.resetTime.getTime()-Date.now(): 15 * 60 * 1000;
    const retryAfterSeconds = Math.max(1, Math.ceil(resetMs / 1000));
    res.setHeader("Retry-After", retryAfterSeconds);

    next(
      new ApiError(
        429,
        `Too many auth attempts. Try again in ${retryAfterSeconds} seconds.`,
        "AUTH_RATE_LIMITED",
        {
          retryAfterSeconds,
          traceId: req.headers["x-trace-id"] as string,
        },
      ),
    );
  }
})


