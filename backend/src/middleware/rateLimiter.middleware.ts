import { rateLimit } from "express-rate-limit";
import { Request } from "express";

import ApiError from "@utils/ApiError";
function stripPort(ip: string): string {
  // Only strip if it looks like IPv4:port (exactly one colon, digits after it)
  const ipv4WithPort = /^(\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}):\d+$/;
  const match = ip.match(ipv4WithPort);
  return match ? match[1] : ip;
}
 
function keyGenerator(req: Request): string {
  const raw = req.ip ?? "unknown";
  return stripPort(raw);
}


export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100,
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

export const webhookLimiter = rateLimit({
  windowMs: 5 * 60 * 1000, // 5 minutes
  max: 300,
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator,
});
 

