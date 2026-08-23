import { Router } from "express";
import { loginWithGithub } from "../controllers/auth.controller";

const router=Router();

router.get('/login',loginWithGithub)

export default router
