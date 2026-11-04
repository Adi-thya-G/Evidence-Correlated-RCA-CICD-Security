import { ClusterRow } from "./Clusterrow";
import type { ClusterItem } from "../src/stores/Userootcausestore";

interface ClusterListProps {
  clusters: ClusterItem[];
  selectedId: number | null;
  loading: boolean;
  onSelect: (id: number) => void;
}

export function ClusterList({ clusters, selectedId, loading, onSelect }: ClusterListProps) {
  return (
    <div className="max-h-min pb-4 w-150 border border-gray-200 rounded-xl shadow-2xl shadow-mauve-200">
      <div className="w-full p-3 border-b border-gray-300 flex flex-col gap-1 relative">
        <h2 className="text-sm font-mono">Correlated clusters</h2>
        <p className="text-[12px] text-gray-500">Ranked by causal likelihood</p>
        <div className="absolute right-2 top-1/2 -translate-y-1/2 bg-gray-100 py-1 px-4 text-gray-600 font-serif border border-gray-300 rounded-2xl text-[12px]">
          high confidence first
        </div>
      </div>

      {loading && clusters.length === 0 && (
        <p className="p-5 text-sm text-gray-500 font-serif">Loading clusters…</p>
      )}
      {!loading && clusters.length === 0 && (
        <p className="p-5 text-sm text-gray-500 font-serif">No root causes found for this repo.</p>
      )}

      {clusters.map((c, i) => (
        <ClusterRow
          key={c.cluster_id}
          cluster={c}
          active={c.cluster_id === selectedId}
          last={i === clusters.length - 1}
          onSelect={onSelect}
        />
      ))}
    </div>
  );
}