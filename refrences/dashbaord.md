# Dashboard API — Data Reference

Reference spec for what the backend exposes to the frontend dashboard.
Maps to Layer 4 (Delivery) of the Evidence-Correlated RCA architecture.

---

## 1. `GET /api/auth/me`
Current logged-in user's identity/profile. Already implemented (`requireAuth` + `auth.routes.ts`).

```json
{
  "id": "string",
  "login": "string",
  "displayName": "string",
  "avatarUrl": "string",
  "role": "admin | member | viewer",
  "installationId": "number | null",
  "installedAt": "ISODate | null"
}
```

---

## 2. `GET /api/dashboard/summary`
Top-level cards/counters shown on the dashboard landing view.

```json
{
  "totalFindings": 142,
  "findingsBySeverity": { "critical": 3, "high": 12, "medium": 41, "low": 86 },
  "findingsByTool": { "sonarqube": 40, "semgrep": 35, "trivy": 30, "gitleaks": 37 },
  "correlatedClusters": 18,
  "highConfidenceRootCauses": 6,
  "unresolvedGateBlocking": 2,
  "lastScanAt": "ISODate"
}
```

---

## 3. `GET /api/dashboard/findings`
Paginated, filterable list of raw findings (filter by tool / severity / status).

```json
{
  "id": "string",
  "tool": "sonarqube | semgrep | trivy | gitleaks",
  "severity": "critical | high | medium | low",
  "title": "string",
  "file": "string",
  "line": "number",
  "cwe": "string | null",
  "status": "open | resolved | ignored",
  "correlatedClusterId": "string | null",
  "createdAt": "ISODate"
}
```

---

## 4. `GET /api/dashboard/root-causes`
Core research output — the LLM's evidence-grounded root cause explanations.

```json
{
  "clusterId": "string",
  "confidence": "number (0-1)",
  "candidateCommit": {
    "sha": "string",
    "author": "string",
    "date": "ISODate",
    "message": "string"
  },
  "explanation": "string",
  "relatedFindingIds": ["string"],
  "evidenceSignalsUsed": "number (max 9)"
}
```

---

## 5. `GET /api/dashboard/activity`
Recent pipeline runs / webhook-triggered events, for a timeline view.

```json
{
  "id": "string",
  "type": "push | pull_request | scan_completed | root_cause_generated",
  "repo": "string",
  "actor": "string",
  "summary": "string",
  "timestamp": "ISODate"
}
```

---

## Notes / open decisions
- Exact field names for findings/root-causes should be finalized against
  whatever schema the Universal Parser normalizes tool output into.
- Consider adding pagination params (`page`, `limit`) and filter query
  params (`tool`, `severity`, `status`) to `/findings`.
- All routes above should sit behind `requireAuth` middleware and scope
  results to `req.user.installationId` so users only see their own repos.


## this file structure for the repo storage
/data
  /installations
    /12345678                    ← installation_id
      /meta.json
      /repos
        /987654321                ← repo.id (immutable)
          /meta.json               ← { id, name, full_name, owner, ... }
          /source                 ← actual cloned repo
        /987654322
          /meta.json
          /source