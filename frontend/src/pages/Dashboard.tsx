import { useEffect } from "react";
import { useRepoStore } from "@/stores/repoStore";
import { useRootCauseStore } from "@/stores/Userootcausestore";
import { SummaryCards } from "@root/components/SummaryCards";
import { ClusterList } from "@root/components/ClusterList";
import { RootCauseDetail } from "@root/components/RootCauseDetail";

function Dashboard() {
  const repoId = useRepoStore((s) => s.default?.repo_id);

  const summary = useRootCauseStore((s) => s.summary);
  const clusters = useRootCauseStore((s) => s.clusters);
  const selectedId = useRootCauseStore((s) => s.selectedId);
  const detail = useRootCauseStore((s) => s.detail);
  const loading = useRootCauseStore((s) => s.loading);
  const detailLoading = useRootCauseStore((s) => s.detailLoading);
  const error = useRootCauseStore((s) => s.error);

  const setSelectedId = useRootCauseStore((s) => s.setSelectedId);
  const fetchSummary = useRootCauseStore((s) => s.fetchSummary);
  const fetchClusters = useRootCauseStore((s) => s.fetchClusters);
  const fetchDetail = useRootCauseStore((s) => s.fetchDetail);
  const updateStatus = useRootCauseStore((s) => s.updateStatus);
  const clear = useRootCauseStore((s) => s.clear);

  // 1) repo changed: drop old data, then load summary and list (two separate calls)
  useEffect(() => {
    clear();
    if (repoId == null) return;
    fetchSummary().catch(() => {});
    fetchClusters().catch(() => {});
  }, [repoId, clear, fetchSummary, fetchClusters]);

  // 2) selection changed: load that cluster's detail
  useEffect(() => {
    if (selectedId == null) return;
    fetchDetail(selectedId).catch(() => {});
  }, [selectedId, fetchDetail]);

  const handleStatus = async (status: Parameters<typeof updateStatus>[0]) => {
    try {
      await updateStatus(status);
    } catch {
      /* error is already in the store and shown below */
    }
  };

  return (
    <div className="p-5 flex flex-col gap-4 py-6">
      {error && (
        <p className="text-sm text-red-700 font-mono border border-red-200 bg-red-50 rounded-xl p-3">
          {error}
        </p>
      )}

      <SummaryCards summary={summary} />

      <div className="grid grid-cols-[700px_500px] gap-4 ">
        <ClusterList
          clusters={clusters}
          selectedId={selectedId}
          loading={loading}
          onSelect={setSelectedId}
        />
        <RootCauseDetail
          detail={detail}
          loading={detailLoading}
          onStatusChange={handleStatus}
        />
      </div>
    </div>
  );
}

export default Dashboard;