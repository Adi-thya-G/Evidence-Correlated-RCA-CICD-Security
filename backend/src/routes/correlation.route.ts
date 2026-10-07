import { listCommits } from "@controllers/correlation.controller";
import {Router } from "express"

const router=Router()


router.get('/:repoId',listCommits)

export default router;