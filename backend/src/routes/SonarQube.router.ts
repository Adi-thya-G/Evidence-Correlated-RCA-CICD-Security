import {Router} from "express";
import {getSonarQubeReport,getSonarQubeCode} from "@controllers/SonarQube.controller"
const router=Router()

router.get("/data",getSonarQubeReport)
router.get("/sourcecode",getSonarQubeCode)

export default router