import { Router } from "express";
import { authLimiter,} from "@middleware/rateLimiter.middleware";
import authRouter from './auth.router';
import  {verifyToken}  from "@middleware/verify";
import sonarRouter from "@routes/SonarQube.router"
import repoRouter from "@routes/repo.router"


const router=Router();

router.use('/v1/auth',authLimiter,authRouter)
router.use('/v1/sonarqube',verifyToken,sonarRouter)
router.use('/v1/repo',verifyToken,repoRouter)


export default router