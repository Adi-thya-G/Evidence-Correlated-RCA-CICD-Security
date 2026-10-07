import { Router } from "express";
import { authLimiter,} from "@middleware/rateLimiter.middleware";
import authRouter from './auth.router';
import  {verifyToken}  from "@middleware/verify";
import sonarRouter from "@routes/SonarQube.router"
import repoRouter from "@routes/repo.router"
import trivyRouter from "@routes/trivy.router"
import findingsRouter from "@routes/findings.router"
import gitleakRouter from "@routes/gitleaks.router"
import eventRouter from "@routes/event.route"
import settingRouter from "@routes/setting.route"
import NotificationRouter from "@routes/notification.route"
import CorrelationRouter from "@routes/correlation.route"
const router=Router();

router.use('/v1/auth',authLimiter,authRouter)
router.use('/v1/sonarqube',verifyToken,sonarRouter)
router.use('/v1/trivy',verifyToken,trivyRouter)
router.use('/v1/repo',verifyToken,repoRouter)
router.use('/v1/gitleaks',verifyToken,gitleakRouter)
router.use('/v1/settings',verifyToken,settingRouter)
router.use('/v1/findings', verifyToken, findingsRouter)
router.use('/v1/event', verifyToken, eventRouter)
router.use('/v1/notifications',verifyToken,NotificationRouter)
router.use('/v1/correlation',verifyToken,CorrelationRouter)

export default router