import { Router } from "express";

import {
  listRootCauses,
  getRootCause,
  getSummary,
  updateStatus,
} from "@controllers/Rootcause.controller";

const router = Router();

router.get("/repos/:repoId/root-causes/summary", getSummary);
router.get("/repos/:repoId/root-causes", listRootCauses);
router.get("/root-causes/:clusterId", getRootCause);
router.patch("/root-causes/:clusterId/status", updateStatus);

export default router;
