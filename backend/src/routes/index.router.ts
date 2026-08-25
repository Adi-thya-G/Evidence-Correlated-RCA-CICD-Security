import { Router } from "express";
import { authLimiter } from "@middleware/rateLimiter.middleware";
import authRouter from './auth.router';
import webHookRouter from './webhook.router'
const router=Router();

router.use('/v1',authLimiter,authRouter)
router.use('/v1',webHookRouter)

export default router