import { Router } from "express";
import {
  getLatestGitleaksFindingsHandler,
  getGitleaksSeverityCountsHandler,// shared with trivy — works as-is since gitleaks findings have a real line
} from "@controllers/gitleaks.controller";
import { getSourceCode } from "@controllers/trivy.controller";

const router = Router();

router.get("/data", getLatestGitleaksFindingsHandler);
router.get("/summary", getGitleaksSeverityCountsHandler);
router.get("/source", getSourceCode);

export default router;