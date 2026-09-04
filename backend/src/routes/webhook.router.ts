
import express,{ Router } from "express";
import { webHookHandler } from "../controllers/webHooks.controller";


const router =Router()
router.post("/github", express.raw({ type: 'application/json' }),webHookHandler)
router.get("/sonarqube",async(req,res)=>{
  console.log("SonarQube webhook endpoint is working",req.body)
  res.send("SonarQube webhook endpoint is working")
})


export default router