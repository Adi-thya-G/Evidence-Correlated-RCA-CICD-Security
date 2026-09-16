import {Router} from "express";
import {getSonarQubeReport,getSonarQubeCode,getSonarQubeSummary} from "@controllers/SonarQube.controller"
const router=Router()

router.get("/data",getSonarQubeReport)
router.get("/sourcecode",getSonarQubeCode)
router.get("/summary",getSonarQubeSummary)

export default router