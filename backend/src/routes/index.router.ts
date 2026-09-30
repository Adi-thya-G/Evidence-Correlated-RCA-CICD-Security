import { Router } from "express";
import { authLimiter,} from "@middleware/rateLimiter.middleware";
import authRouter from './auth.router';
import  {verifyToken}  from "@middleware/verify";
import sonarRouter from "@routes/SonarQube.router"
import repoRouter from "@routes/repo.router"
import trivyRouter from "@routes/trivy.router"

import gitleakRouter from "@routes/gitleaks.router"

import settingRouter from "@routes/setting.route"

const router=Router();

router.use('/v1/auth',authLimiter,authRouter)
router.use('/v1/sonarqube',verifyToken,sonarRouter)
router.use('/v1/trivy',verifyToken,trivyRouter)
router.use('/v1/repo',verifyToken,repoRouter)
router.use('/v1/gitleaks',verifyToken,gitleakRouter)
router.use('/v1/settings',verifyToken,settingRouter)


export default router