import api from "./axiosInstance";
import type { RootCauseStatus } from "@/stores/Userootcausestore";

// GET /repos/:repoId/root-causes/summary
export const GetRootCauseSummary = async (repo_id: number) => {
  try {
    const { data } = await api.get(`/dashboard/repos/${repo_id}/root-causes/summary`);
    return data.data;
  } catch (error) {
    throw error;
  }
};

// GET /repos/:repoId/root-causes
export const ListRootCauses = async (repo_id: number) => {
  try {
    const { data } = await api.get(`/dashboard/repos/${repo_id}/root-causes`);
    return data.data;
  } catch (error) {
    throw error;
  }
};

// GET /root-causes/:clusterId
export const GetRootCause = async (cluster_id: number | string) => {
  try {
    const { data } = await api.get(`/dashboard/root-causes/${cluster_id}`);
    return data.data;
  } catch (error) {
    throw error;
  }
};

// PATCH /root-causes/:clusterId/status
export const UpdateRootCauseStatus = async (
  cluster_id: number | string,
  status: RootCauseStatus
) => {
  try {
    const { data } = await api.patch(`/dashboard/root-causes/${cluster_id}/status`, { status });
    return data.data;
  } catch (error) {
    throw error;
  }
};