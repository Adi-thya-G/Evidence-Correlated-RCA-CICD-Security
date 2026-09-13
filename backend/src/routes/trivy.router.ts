import {Router} from 'express'
import {getLatestTrivyFindingsHandler,getSourceCode,getTrivySeverityCountsHandler} from "@controllers/trivy.controller"
const router=Router()

router.get("/data",getLatestTrivyFindingsHandler)
router.get("/sourcecode",getSourceCode)
router.get("/summary",getTrivySeverityCountsHandler)
export default router