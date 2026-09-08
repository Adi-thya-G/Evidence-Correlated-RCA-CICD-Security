import { Router } from "express";
import { app_callback, authMe, callBackUrl, loginWithGithub, logout } from "../controllers/auth.controller";
import  {verifyToken} from "@middleware/verify"

const router=Router();

router.get('/github',loginWithGithub)
router.get('/github/callback',callBackUrl)
router.get("/github/app-callback",app_callback)
router.get("/logout",verifyToken,logout)

// get data for dashboard
router.get("/me",verifyToken,authMe)

export default router
