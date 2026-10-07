import  api from "./axiosInstance"


export const GetCorrelation = async (
  repoId: number | string,
  params: { page?: number; limit?: number; commitSha?: string } = {}
) => {
  const { data } = await api.get(`/correlation/${repoId}`, { params });
  return data.data;   // { items, total, page, limit, commitSha }
};