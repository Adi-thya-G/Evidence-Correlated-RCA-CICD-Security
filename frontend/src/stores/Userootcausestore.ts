import { create } from "zustand";
import {
  GetRootCauseSummary,
  ListRootCauses,
  GetRootCause,
  UpdateRootCauseStatus,
} from "@/api/rootCauseApi";
import { useRepoStore } from "@/stores/repoStore";
import { apiError } from "@/feature/utils";

export type RootCauseStatus = "open" | "assigned" | "blocked" | "resolved";

export interface RootCauseSummary {
  raw_findings: number;
  scanner_count: number;
  clusters: number;
  pre_correlation: number;
  high_confidence: number;
  blocked_count: number;
}

export interface ClusterItem {
  clusterId: number;
  title: string;
  confidence: number; // 0-100
  findings_count: number;
  file_path: string;
  tools: string[];
  status: RootCauseStatus;
}

export interface ClusterFinding {
  tool: string;
  message: string;
  line: number;
  file: string;
}

export interface CandidateCommit {
  sha: string;
  message: string;
  likelihood: number; // 0-100
}

export interface ClusterDetail extends ClusterItem {
  line_start: number;
  line_end: number;
  deploy_blocked: boolean;
  findings: ClusterFinding[];
  commits: CandidateCommit[];
  explanation: string;
}

/* ------------------------------------------------------------------ */
/* Normalizers: accept camelCase / snake_case / wrapped responses and  */
/* always return the shape the UI expects.                             */
/* ------------------------------------------------------------------ */

// axios response or { data: ... } wrapper -> the inner payload
const unwrap = (res: any) => (res && typeof res === "object" && "data" in res ? res.data : res);

const num = (v: unknown, fallback = 0) => {
  const n = Number(v);
  return Number.isFinite(n) ? n : fallback;
};

// UI expects 0-100. If the API sends 0-1 (e.g. 0.85) convert it.
const percent = (v: unknown) => {
  const n = num(v);
  return n > 0 && n <= 1 ? Math.round(n * 100) : Math.round(n);
};

const toSummary = (r: any): RootCauseSummary => ({
  raw_findings: num(r?.raw_findings ?? r?.rawFindings ?? r?.total_findings ?? r?.totalFindings),
  scanner_count: num(r?.scanner_count ?? r?.scannerCount ?? r?.scanners),
  clusters: num(r?.clusters ?? r?.cluster_count ?? r?.clusterCount),
  pre_correlation: num(r?.pre_correlation ?? r?.preCorrelation ?? r?.raw_findings ?? r?.rawFindings),
  high_confidence: num(r?.high_confidence ?? r?.highConfidence ?? r?.high_confidence_count),
  blocked_count: num(r?.blocked_count ?? r?.blockedCount ?? r?.blocked),
});

const toItem = (r: any): ClusterItem => ({
  clusterId: r?.clusterId ?? r?.cluster_id ?? r?.id,
  title: r?.title ?? "",
  confidence: percent(r?.confidence ?? r?.causal_likelihood ?? r?.causalLikelihood),
  findings_count: num(
    r?.findings_count ?? r?.findingsCount ?? r?.finding_count ?? r?.findings?.length
  ),
  file_path: r?.file_path ?? r?.filePath ?? r?.file ?? "",
  tools: Array.isArray(r?.tools) ? r.tools : [],
  status: (r?.status ?? "open") as RootCauseStatus,
});

const toFinding = (f: any): ClusterFinding => ({
  tool: f?.tool ?? f?.scanner ?? "",
  message: f?.message ?? "",
  line: num(f?.line ?? f?.line_start),
  file: f?.file ?? f?.file_path ?? f?.filePath ?? "",
});

const toCommit = (c: any): CandidateCommit => ({
  sha: c?.sha ?? c?.commit ?? c?.hash ?? "",
  message: c?.message ?? "",
  likelihood: percent(c?.likelihood ?? c?.confidence),
});

const toDetail = (raw: any): ClusterDetail => {
  const r = unwrap(raw) ?? {};
  const findings = Array.isArray(r.findings) ? r.findings.map(toFinding) : [];
  const commits = Array.isArray(r.commits) ? r.commits.map(toCommit) : [];
  const base = toItem(r);
  return {
    ...base,
    findings_count: base.findings_count || findings.length,
    line_start: num(r.line_start ?? r.lineStart),
    line_end: num(r.line_end ?? r.lineEnd),
    deploy_blocked: Boolean(r.deploy_blocked ?? r.deployBlocked ?? base.status === "blocked"),
    findings,
    commits,
    explanation: r.explanation ?? r.root_cause ?? r.rootCause ?? "",
  };
};

interface RootCauseState {
  // data
  summary: RootCauseSummary | null;
  clusters: ClusterItem[];
  selectedId: number | null;
  detail: ClusterDetail | null;

  // request state
  loading: boolean;
  summaryLoading: boolean;
  detailLoading: boolean;
  updating: boolean;
  error: string | null;

  // setter (only changes state; the page triggers the fetch)
  setSelectedId: (id: number | null) => void;

  // api actions (independent, no Promise.all)
  fetchSummary: () => Promise<void>;
  fetchClusters: () => Promise<void>;
  fetchDetail: (id: number) => Promise<void>;
  updateStatus: (status: RootCauseStatus) => Promise<void>;

  clear: () => void;
}

const currentRepoId = () => useRepoStore.getState().default?.repo_id as number | undefined;

export const useRootCauseStore = create<RootCauseState>((set, get) => {
  // Only the newest request of each kind may write to the store.
  let summaryReq = 0;
  let listReq = 0;
  let detailReq = 0;

  return {
    summary: null,
    clusters: [],
    selectedId: null,
    detail: null,

    loading: false,
    summaryLoading: false,
    detailLoading: false,
    updating: false,
    error: null,

    setSelectedId: (selectedId) => set({ selectedId }),

    // -------------------------------------------------------------- summary
    fetchSummary: async () => {
      const repo_id = currentRepoId();
      if (!repo_id) {
        set({ summary: null });
        return;
      }

      const req = ++summaryReq;
      set({ summaryLoading: true });
      try {
        const res = await GetRootCauseSummary(repo_id);
        if (req !== summaryReq) return;
        console.log("[rootcause] raw summary", res);
        set({ summary: toSummary(unwrap(res)), summaryLoading: false });
      } catch (e) {
        if (req !== summaryReq) return;
        // counts are secondary: don't replace the list with an error screen
        set({ summaryLoading: false });
        throw e;
      }
    },

    // ----------------------------------------------------------------- list
    fetchClusters: async () => {
      const repo_id = currentRepoId();
      if (!repo_id) {
        set({ clusters: [], selectedId: null, detail: null, error: null });
        return;
      }

      const req = ++listReq;
      set({ loading: true, error: null });
      try {
        const res = await ListRootCauses(repo_id);
        if (req !== listReq) return;
        console.log("[rootcause] raw list (first item)", unwrap(res)?.[0] ?? unwrap(res));

        const payload = unwrap(res);
        const list = Array.isArray(payload) ? payload : payload?.clusters ?? payload?.items ?? [];
        const clusters: ClusterItem[] = list.map(toItem);

        // keep the current selection if it still exists, otherwise pick the first one.
        // The page sees selectedId change and calls fetchDetail itself.
        const { selectedId } = get();
        const stillThere = clusters.some((c) => c.clusterId === selectedId);
        set({
          clusters,
          selectedId: stillThere ? selectedId : clusters[0]?.clusterId ?? null,
          detail: stillThere ? get().detail : null,
          loading: false,
        });
      } catch (e) {
        if (req !== listReq) return;
        set({ clusters: [], loading: false, error: apiError(e, "Failed to fetch root causes") });
        throw e;
      }
    },

    // --------------------------------------------------------------- detail
    fetchDetail: async (id) => {
      const req = ++detailReq;
      set({ detailLoading: true });
      try {
        const res = await GetRootCause(id);
        if (req !== detailReq) return;
        console.log("[rootcause] raw detail", res);
        set({ detail: toDetail(res), detailLoading: false });
      } catch (e) {
        if (req !== detailReq) return;
        set({ detailLoading: false, error: apiError(e, "Failed to fetch cluster detail") });
        throw e;
      }
    },

    // ------------------------------------------------------- status update
    updateStatus: async (status) => {
      const { selectedId } = get();
      if (selectedId == null) throw new Error("No cluster selected");

      set({ updating: true });
      try {
        await UpdateRootCauseStatus(selectedId, status);

        // update the row right away, then refresh the rest in the background
        set((s) => ({
          clusters: s.clusters.map((c) => (c.clusterId === selectedId ? { ...c, status } : c)),
          detail: s.detail?.clusterId === selectedId ? { ...s.detail, status } : s.detail,
          updating: false,
        }));

        get().fetchSummary().catch(() => {});
        get().fetchDetail(selectedId).catch(() => {});
      } catch (e) {
        set({ updating: false, error: apiError(e, "Failed to update status") });
        throw e;
      }
    },

    // ---------------------------------------------------------------- clear
    // Called when the repo changes. Cancels in-flight requests and drops old data.
    clear: () => {
      summaryReq++;
      listReq++;
      detailReq++;
      set({
        summary: null,
        clusters: [],
        selectedId: null,
        detail: null,
        loading: false,
        summaryLoading: false,
        detailLoading: false,
        updating: false,
        error: null,
      });
    },
  };
});