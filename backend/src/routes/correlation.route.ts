import { Router } from "express";
import { listRepos, listCommits, listClusters, getCluster } from "@controllers/correlation.controller";

// app.use("/api/v1/correlation", requireAuth, correlationRoutes);
const router = Router();

router.get("/repos", listRepos);                              // keep before "/:repoId"
router.get("/:repoId", listCommits);                          // all commits, paged + sorted
router.get("/:repoId/commits/:sha", listClusters);            // clusters of one commit
router.get("/:repoId/clusters/:clusterId", getCluster);       // one cluster in detail

export default router;
