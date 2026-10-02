
import { create } from 'zustand'
import {
  GetFindings,
  GetFindingsByCommit,
  GetFindingsSummary,
  GetFindingById,
  UpdateFindingStatus,
  BulkUpdateFindingStatus,
} from '@/api/findings'
import { useRepoStore } from '@/stores/repoStore'
import { apiError } from '@/feature/utils'
import type {
  Tool,
  Severity,
  Status,
  FindingListItem,
  FindingDetail,
  FindingsSummary,
  CommitGroup,
} from '@root/types/findings'

type View = 'findings' | 'commits'
type Sort = '-enrichedAt' | '-severity' | 'file'

interface FindingsState {
  // filters
  tool: Tool | 'all'
  status: Status[]
  severity: Severity[]
  commit: string
  search: string
  sort: Sort
  view: View

  // data
  items: FindingListItem[]
  commitGroups: CommitGroup[]
  summary: FindingsSummary | null
  selected: FindingDetail | null

  // pagination
  page: number
  pageSize: number
  total: number
  totalPages: number

  // request state
  loading: boolean
  summaryLoading: boolean
  detailLoading: boolean
  updating: boolean
  error: string | null

  // setters (they only change state; the page triggers the fetch)
  setTool: (tool: Tool | 'all') => void
  setStatus: (status: Status[]) => void
  setSeverity: (severity: Severity[]) => void
  setCommit: (commit: string) => void
  setSearch: (search: string) => void
  setSort: (sort: Sort) => void
  setView: (view: View) => void
  setPage: (page: number) => void
  setSelected: (finding: FindingDetail | null) => void

  // api actions
  fetchFindings: () => Promise<void>
  fetchCommitGroups: () => Promise<void>
  fetchSummary: () => Promise<void>
  fetchData: () => Promise<void>
  fetchFindingById: (id: string) => Promise<void>
  updateStatus: (id: string, status: Status, note?: string) => Promise<void>
  bulkUpdateStatus: (ids: string[], status: Status) => Promise<{ updated: number; failed: string[] }>

  clear: () => void
}

// The API layer returns the ApiResponse "data" field. Accept a raw array too.
const rows = <T,>(res: any): T[] => (Array.isArray(res?.data) ? res.data : Array.isArray(res) ? res : [])

// Pagination numbers from the server, with safe fallbacks.
const paging = (res: any, fallback: { page: number; pageSize: number }, count: number) => {
  const pageSize = typeof res?.pageSize === 'number' ? res.pageSize : fallback.pageSize
  const total = typeof res?.total === 'number' ? res.total : count
  return {
    page: typeof res?.page === 'number' ? res.page : fallback.page,
    pageSize,
    total,
    totalPages: typeof res?.totalPages === 'number' ? res.totalPages : total > 0 ? Math.ceil(total / pageSize) : 0,
  }
}

const currentRepoId = () => useRepoStore.getState().default?.repo_id as number | undefined

export const useFindings = create<FindingsState>((set, get) => {
  // Only the newest list request may write to the store (prevents slow, old responses
  // from overwriting newer filters or another repo's data).
  let listReq = 0
  let summaryReq = 0
  let detailReq = 0

  return {
    tool: 'all',
    status: [],
    severity: [],
    commit: '',
    search: '',
    sort: '-enrichedAt',
    view: 'findings',

    items: [],
    commitGroups: [],
    summary: null,
    selected: null,

    page: 1,
    pageSize: 25,
    total: 0,
    totalPages: 0,

    loading: false,
    summaryLoading: false,
    detailLoading: false,
    updating: false,
    error: null,

    setTool: (tool) => set({ tool, page: 1 }),
    setStatus: (status) => set({ status, page: 1 }),
    setSeverity: (severity) => set({ severity, page: 1 }),
    setCommit: (commit) => set({ commit, page: 1 }),
    setSearch: (search) => set({ search, page: 1 }),
    setSort: (sort) => set({ sort, page: 1 }),
    setView: (view) => set({ view, page: 1 }),
    setPage: (page) => set({ page: Math.max(1, page) }),
    setSelected: (selected) => set({ selected }),

    // ---------------------------------------------------------------- list
    fetchFindings: async () => {
      const repo_id = currentRepoId()
      if (!repo_id) {
        set({ items: [], total: 0, totalPages: 0, error: null })
        return
      }

      const req = ++listReq
      const { page, pageSize, tool, status, severity, commit, search, sort } = get()
      set({ loading: true, error: null })

      try {
        const res = await GetFindings({
          repo_id, page, pageSize, tool, status, severity,
          commit: commit || undefined,
          q: search || undefined,
          sort,
        })
        if (req !== listReq) return

        const items = rows<FindingListItem>(res)
        set({ items, ...paging(res, { page, pageSize }, items.length), loading: false })
      } catch (e) {
        if (req !== listReq) return
        set({ items: [], loading: false, error: apiError(e, 'Failed to fetch findings') })
        throw e
      }
    },

    // -------------------------------------------------------- commit groups
    fetchCommitGroups: async () => {
      const repo_id = currentRepoId()
      if (!repo_id) {
        set({ commitGroups: [], total: 0, totalPages: 0, error: null })
        return
      }

      const req = ++listReq
      const { page, pageSize, tool, status, severity, commit, search } = get()
      set({ loading: true, error: null })

      try {
        const res = await GetFindingsByCommit({
          repo_id, page, pageSize, tool, status, severity,
          commit: commit || undefined,
          q: search || undefined,
        })
        if (req !== listReq) return

        const commitGroups = rows<CommitGroup>(res)
        set({ commitGroups, ...paging(res, { page, pageSize }, commitGroups.length), loading: false })
      } catch (e) {
        if (req !== listReq) return
        set({ commitGroups: [], loading: false, error: apiError(e, 'Failed to fetch commit groups') })
        throw e
      }
    },

    // -------------------------------------------------------------- summary
    fetchSummary: async () => {
      const repo_id = currentRepoId()
      if (!repo_id) {
        set({ summary: null })
        return
      }

      const req = ++summaryReq
      const { status, severity } = get()
      set({ summaryLoading: true })

      try {
        const summary = (await GetFindingsSummary({ repo_id, status, severity })) as FindingsSummary
        if (req !== summaryReq) return
        set({ summary, summaryLoading: false })
      } catch (e) {
        if (req !== summaryReq) return
        // counts are secondary: don't replace the list with an error screen
        set({ summaryLoading: false })
        throw e
      }
    },

    // Summary + list together (used by the Retry button).
    fetchData: async () => {
      const list = get().view === 'commits' ? get().fetchCommitGroups() : get().fetchFindings()
      const results = await Promise.allSettled([get().fetchSummary(), list])
      const failed = results.find((r) => r.status === 'rejected') as PromiseRejectedResult | undefined
      if (failed) throw failed.reason
    },

    // --------------------------------------------------------------- detail
    fetchFindingById: async (id) => {
      const repo_id = currentRepoId()
      if (!repo_id) throw new Error('No repository selected')

      const req = ++detailReq
      set({ detailLoading: true })

      try {
        const finding = (await GetFindingById({ repo_id, id })) as FindingDetail
        if (req !== detailReq) return
        set({ selected: finding, detailLoading: false })
      } catch (e) {
        if (req !== detailReq) return
        set({ detailLoading: false })
        throw e
      }
    },

    // ------------------------------------------------------- status updates
    updateStatus: async (id, status, note) => {
      const repo_id = currentRepoId()
      if (!repo_id) throw new Error('No repository selected')

      set({ updating: true })
      try {
        const updated = (await UpdateFindingStatus({ repo_id, id, status, note })) as FindingDetail

        set((s) => ({
          items: s.items.map((f) => (f.id === id ? { ...f, status: updated.status } : f)),
          commitGroups: s.commitGroups.map((g) => ({
            ...g,
            findings: g.findings.map((f) => (f.id === id ? { ...f, status: updated.status } : f)),
          })),
          selected: s.selected?.id === id ? updated : s.selected,
          updating: false,
        }))

        get().fetchSummary().catch(() => {}) // refresh counts in the background
      } catch (e) {
        set({ updating: false })
        throw e // the page shows the toast with the server's message
      }
    },

    bulkUpdateStatus: async (ids, status) => {
      const repo_id = currentRepoId()
      if (!repo_id) throw new Error('No repository selected')

      set({ updating: true })
      try {
        const result = await BulkUpdateFindingStatus({ repo_id, ids, status })
        const failed = new Set(result.failed)
        const hit = (id: string) => ids.includes(id) && !failed.has(id)

        set((s) => ({
          items: s.items.map((f) => (hit(f.id) ? { ...f, status } : f)),
          commitGroups: s.commitGroups.map((g) => ({
            ...g,
            findings: g.findings.map((f) => (hit(f.id) ? { ...f, status } : f)),
          })),
          updating: false,
        }))

        get().fetchSummary().catch(() => {})
        return result
      } catch (e) {
        set({ updating: false })
        throw e
      }
    },

    // ---------------------------------------------------------------- clear
    // Called when the repo changes. Cancels in-flight requests and drops old data.
    clear: () => {
      listReq++
      summaryReq++
      detailReq++
      set({
        items: [],
        commitGroups: [],
        summary: null,
        selected: null,
        page: 1,
        total: 0,
        totalPages: 0,
        loading: false,
        summaryLoading: false,
        detailLoading: false,
        updating: false,
        error: null,
      })
    },
  }
})