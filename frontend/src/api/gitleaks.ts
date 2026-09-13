import api from "./axiosInstance";

// ---- 1. Paginated findings list ----
export async function GetGitleaksReport({
  repo_id,
  page,
  pageSize,
}: {
  repo_id: number;
  page: number;
  pageSize: number;
}) {
  const res = await api.get("/gitleaks/data", {
    params: { repo_id, page, pageSize },
  });
  return res.data;
}

// ---- 2. Severity summary counts (for the top cards) ----
export async function GetGitleaksSummary({ repo_id }: { repo_id: number }) {
  const res = await api.get("/gitleaks/summary", {
    params: { repo_id },
  });
  return res.data;
}

// ---- 3. Source code viewer (line-based, since gitleaks findings always have startLine) ----
export async function getGitleaksSourceCode(params: {
  component: string;
  scanId: string;
  line: number;
  context?: number;
}) {
  const res = await api.get("/gitleaks/source", { params });
  return res.data;
}