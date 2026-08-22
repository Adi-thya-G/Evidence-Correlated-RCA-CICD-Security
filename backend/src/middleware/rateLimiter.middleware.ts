import {rateLimit} from "express-rate-limit"
import { env } from "@config/env"
const limiter=rateLimit({
  windowMs:Number(process.env.RATE_LIMIT_WINDOW_MS),
  limit: env.RATE_LIMIT_MAX, 
})