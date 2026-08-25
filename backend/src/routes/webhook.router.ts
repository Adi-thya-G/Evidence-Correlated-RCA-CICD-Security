
import { Router } from "express";

const router =Router()
router.post("/github",async(req,res)=>{
  console.log("weebhook")
  res.send("web hook")
})

export default router