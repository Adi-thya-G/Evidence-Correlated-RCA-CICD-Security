
import express,{ Router } from "express";
import { webHookHandler } from "../controllers/webHooks.controller";
import { webhookLimiter } from "@middleware/rateLimiter.middleware";


const router =Router()
router.post("/github", express.raw({ type: 'application/json' }),webhookLimiter,webHookHandler)
router.get("/sonarqube",express.raw({type: 'application/json'}),async(req,res)=>{
  console.log("SonarQube webhook endpoint is working",req.body)
  res.send("SonarQube webhook endpoint is working")
})


export default router