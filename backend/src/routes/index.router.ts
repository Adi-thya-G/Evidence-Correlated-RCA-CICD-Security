import { Router } from "express";
import { authLimiter, webhookLimiter } from "@middleware/rateLimiter.middleware";
import authRouter from './auth.router';
import webHookRouter from './webhook.router'
const router=Router();

router.use('/v1/auth',authLimiter,authRouter)
router.use('/v1/webhooks',webhookLimiter,webHookRouter)

export default router