import { Router } from "express";
import { app_callback, authMe, callBackUrl, loginWithGithub, logout } from "../controllers/auth.controller";
import  {verifyToken} from "@middleware/verify"

const router=Router();

router.get('/auth/github',loginWithGithub)
router.get('/auth/github/callback',callBackUrl)
router.get("/auth/github/app-callback",app_callback)
router.get("/auth/logout",verifyToken,logout)

// get data for dashboard
router.get("/auth/me",verifyToken,authMe)

export default router
