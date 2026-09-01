import { Router } from "express";
import { authLimiter,} from "@middleware/rateLimiter.middleware";
import authRouter from './auth.router';

const router=Router();

router.use('/v1/auth',authLimiter,authRouter)


export default router