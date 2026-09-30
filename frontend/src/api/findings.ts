// frontend/src/api/findings.ts
import api from "./axiosInstance";
import type { Tool, Severity, Status, FindingListItem, FindingDetail, FindingsSummary, CommitGroup, Paginated }
 from "@root/types/findings";

export interface FindingsQuery {
  repo_id: number;
  page: number;
  pageSize: number;
  tool?: Tool | "all";
  status?: Status[];
  severity?: Severity[];
  commit?: string;
  q?: string;
  sort?: "-enrichedAt" | "-severity" | "file";
}

// axios sends arrays as severity[]=a&severity[]=b by default; the backend expects "a,b"
const clean = (p: Record<string, unknown>) =>
  Object.fromEntries(
    Object.entries(p)
      .filter(([, v]) => v != null && v !== "" && v !== "all" && !(Array.isArray(v) && v.length === 0))
      .map(([k, v]) => [k, Array.isArray(v) ? v.join(",") : v])
  );

// ---- 1. Paginated findings list (table view, no git_diff) ----
export async function GetFindings(params: FindingsQuery): Promise<Paginated<FindingListItem>> {
  const res = await api.get("/findings/data", { params: clean(params) });
  return res.data;
}

// ---- 2. Counts for the tool chips. Ignores `tool` on purpose so every chip keeps its number ----
export async function GetFindingsSummary(params: {
  repo_id: number;
  status?: Status[];
  severity?: Severity[];
}): Promise<FindingsSummary> {
  const res = await api.get("/findings/summary", { params: clean(params) });
  return res.data;
}

// ---- 3. Grouped by commit (pagination is over commits, not findings) ----
export async function GetFindingsByCommit(
  params: Omit<FindingsQuery, "sort">
): Promise<Paginated<CommitGroup>> {
  const res = await api.get("/findings/by-commit", { params: clean(params) });
  return res.data;
}

// ---- 4. Single finding for the drawer (includes the file's diff hunk) ----
export async function GetFindingById(params: { repo_id: number; id: string }): Promise<FindingDetail> {
  const { id, ...rest } = params;
  const res = await api.get(`/findings/${id}`, { params: rest });
  return res.data;
}

// ---- 5. Triage / false positive ----
export async function UpdateFindingStatus(params: {
  repo_id: number;
  id: string;
  status: Status;
  note?: string;
}): Promise<FindingDetail> {
  const { id, repo_id, ...body } = params;
  const res = await api.patch(`/findings/${id}`, body, { params: { repo_id } });
  return res.data;
}

// ---- 6. Bulk (e.g. "triage all in this commit") ----
export async function BulkUpdateFindingStatus(params: {
  repo_id: number;
  ids: string[];
  status: Status;
}): Promise<{ updated: number; failed: string[] }> {
  const { repo_id, ...body } = params;
  const res = await api.post("/findings/bulk-status", body, { params: { repo_id } });
  return res.data;
}