// frontend/src/api/findings.ts  (matches the calls made in the useFindings store)
import api from './axiosInstance'
import type { Status, Tool, Severity } from '@root/types/findings'

interface ListParams {
  repo_id: number
  page?: number
  pageSize?: number
  tool?: Tool | 'all'
  status?: Status[]
  severity?: Severity[]
  commit?: string
  q?: string
  sort?: string
}

// Arrays are sent comma-separated; "all" and empty values are dropped.
// Check that buildMatch on the backend splits these on ",".
const params = (p: Record<string, any>) => {
  const out: Record<string, any> = {}
  for (const [k, v] of Object.entries(p)) {
    if (v === undefined || v === null || v === '' || v === 'all') continue
    if (Array.isArray(v)) {
      if (v.length) out[k] = v.join(',')
    } else out[k] = v
  }
  return out
}

export const GetFindings = async (p: ListParams) =>
  (await api.get('/findings/data', { params: params(p) })).data.data

export const GetFindingsByCommit = async (p: ListParams) =>
  (await api.get('/findings/by-commit', { params: params(p) })).data.data

export const GetFindingsSummary = async (p: Pick<ListParams, 'repo_id' | 'status' | 'severity'>) =>
  (await api.get('/findings/summary', { params: params(p) })).data.data

export const GetFindingById = async ({ repo_id, id }: { repo_id: number; id: string }) =>
  (await api.get(`/findings/${id}`, { params: { repo_id } })).data.data

export const UpdateFindingStatus = async ({ repo_id, id, status, note }: { repo_id: number; id: string; status: Status; note?: string }) =>
  (await api.patch(`/findings/${id}`, { status, note }, { params: { repo_id } })).data.data

export const BulkUpdateFindingStatus = async ({ repo_id, ids, status }: { repo_id: number; ids: string[]; status: Status }) =>
  (await api.post('/findings/bulk-status', { ids, status }, { params: { repo_id } })).data.data as { updated: number; failed: string[] }