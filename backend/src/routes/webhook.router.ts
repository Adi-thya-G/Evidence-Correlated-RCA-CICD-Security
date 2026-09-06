
import express,{ Router } from "express";
import { webHookHandler, sonarQubeWebHookHandler } from "../controllers/webHooks.controller";
import { webhookLimiter } from "@middleware/rateLimiter.middleware";




// webhooks router we should use only post method not get method
const router =Router()
router.post("/github",webhookLimiter, express.raw({ type: 'application/json' }),webHookHandler)
router.post("/sonarqube",express.json(),webhookLimiter,sonarQubeWebHookHandler)


export default router