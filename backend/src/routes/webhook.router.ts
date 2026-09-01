
import express,{ Router } from "express";
import { webHookHandler } from "../controllers/webHooks.controller";


const router =Router()
router.post("/github", express.raw({ type: 'application/json' }),webHookHandler)


export default router