
import express,{ Router } from "express";
import { webHookHandler } from "../controllers/webHooks.controller";
import { webhookLimiter } from "@middleware/rateLimiter.middleware";
import {fetchSonarIssues} from "@axios/sonarQube";


// webhooks router we should use only post method not get method
const router =Router()
router.post("/github", express.raw({ type: 'application/json' }),webhookLimiter,webHookHandler)
router.post("/sonarqube",express.json(),webhookLimiter,async(req,res)=>{
 const response= await fetchSonarIssues(req.body.project.key, req.body.branch.name)
 console.log("SonarQube issues fetched:", response)
  res.send("SonarQube webhook endpoint is working")
})


export default router