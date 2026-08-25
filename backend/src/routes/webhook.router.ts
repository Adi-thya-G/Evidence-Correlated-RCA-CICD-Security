import { webhookLimiter } from "@middleware/rateLimiter.middleware";
import { Router } from "express";

const router =Router()
router.post("/webhook/github",webhookLimiter,async(req,res)=>{
  console.log("weebhook")
  res.send("web hook")
})

export default router