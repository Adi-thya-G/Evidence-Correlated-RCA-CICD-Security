import { Router } from "express"
import {getFindingById,getFindings,getFindingsSummary,getFindingsByCommit,
  bulkUpdateStatus,updateFindingStatus} from "@controllers/findings.controller"


  
const router=Router()


// findings.router.ts
router.get('/data', getFindings)
router.get('/summary', getFindingsSummary)
router.get('/by-commit', getFindingsByCommit)
router.post('/bulk-status', bulkUpdateStatus)
router.get('/:id', getFindingById)      // keep last, or "summary" matches :id
router.patch('/:id', updateFindingStatus)

export default router