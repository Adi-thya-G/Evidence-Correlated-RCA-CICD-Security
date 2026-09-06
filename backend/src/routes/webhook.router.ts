
import express,{ Router } from "express";
import { webHookHandler } from "../controllers/webHooks.controller";
import { webhookLimiter } from "@middleware/rateLimiter.middleware";
import {fetchSonarIssues,fetchSonarHotspots} from "@axios/sonarQube";
import { projectKey } from "@utils/SonarQube";


// webhooks router we should use only post method not get method
const router =Router()
router.post("/github", express.raw({ type: 'application/json' }),webhookLimiter,webHookHandler)
router.post("/sonarqube",express.json(),webhookLimiter,async(req,res)=>{
  const payload = req.body;
  res.status(200).send('OK'); // ack fast, process async — remember the 10s SonarQube timeout

  if (payload.status !== 'SUCCESS') return;

  const projectKey = payload.project.key;
  const branch = payload.branch?.name ?? 'main';
  console.log(`Received SonarQube webhook for project ${projectKey} on branch ${branch}`);

 const [issues, hotspots] = await Promise.all([
    fetchSonarIssues(projectKey, branch),
    fetchSonarHotspots(projectKey, branch),
  ]);
 console.log("SonarQube issues fetched:", issues)
 console.log("SonarQube hotspots fetched:", hotspots)
  res.send("SonarQube webhook endpoint is working")
})


export default router