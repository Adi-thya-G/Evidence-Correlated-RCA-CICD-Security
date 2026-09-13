import api from "./axiosInstance";
export async function GetTrivyReport({ repo_id, page, pageSize }: { repo_id: number; page: number; pageSize: number }) {
  const res = await api.get("/trivy/data", {
    params: { repo_id, page, pageSize },
  });
  return res.data;
}

export async function getTrivySourceCode(params: {
  component: string;
  scanId: string;
  context?: number;
  line?: number;
  pkgName?: string;
}) {
  const res = await api.get("/trivy/sourcecode", { params });
  return res.data;
}

export async function GetTrivySummary({ repo_id }: { repo_id: number }) {
  const res = await api.get("/trivy/summary", { params: { repo_id } });
  return res.data;
}