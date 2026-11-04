import { CommitRow } from "./Commitrow";
import type { ClusterDetail, RootCauseStatus } from "../src/stores/Userootcausestore";

interface RootCauseDetailProps {
  detail: ClusterDetail | null;
  loading: boolean; // pass detailLoading from the store, not the list's `loading`
  onStatusChange: (status: RootCauseStatus) => void;
}

export function RootCauseDetail({ detail, loading, onStatusChange }: RootCauseDetailProps) {
  const shell = "w-full border border-gray-300 rounded-xl shadow-2xl shadow-mauve-200 pb-3 ";

  if (!detail) {
    return (
      <div className={`${shell} p-5 text-sm text-gray-500 font-serif`}>
        {loading ? "Loading details…" : "Select a cluster to see its root cause."}
      </div>
    );
  }

  const d = detail;
  const findings = d.findings ?? [];
  const commits = d.commits ?? [];

  return (
    <div className={`${shell} ${loading ? "opacity-60" : ""}  `}>
      {/* header */}
      <div className="w-full border-b border-gray-300 p-3 relative ">
        <h2 className="font-serif">Root cause detail</h2>
        <p className="text-[12px] text-gray-400">
          Cluster #{d.clusterId} — {d.findings_count} correlated findings
        </p>
        {d.deploy_blocked && (
          <span className="absolute right-2 text-red-800 bg-red-200 top-1/2 text-[12px] font-semibold p-1 font-mono px-3 rounded-2xl -translate-y-1/2">
            Deploy blocked
          </span>
        )}
      </div>

      {/* title */}
      <div className="p-3 flex flex-col gap-1 py-2">
        <h2 className="text-[17px] font-bold font-serif">{d.title}</h2>
        <p className="text-[12px] text-gray-500">
          {d.file_path} · lines {d.line_start}–{d.line_end}
        </p>
      </div>

      {/* causal likelihood */}
      <div className="relative w-full p-3 py-2">
        <div className="flex justify-between items-center mb-1">
          <p className="text-[12px] text-gray-600 font-mono">Causal likelihood</p>
          <span className="text-sm font-semibold text-red-700">{d.confidence}%</span>
        </div>
        <div className="w-full h-1.5 bg-gray-200 rounded-full overflow-hidden">
          <div
            className="h-full bg-red-700 rounded-full"
            style={{ width: `${Math.min(100, Math.max(0, d.confidence))}%` }}
          />
        </div>
      </div>

      {/* correlated findings */}
      <div className="p-3">
        <span className="block text-[14px] font-serif text-gray-600">Correlated findings</span>
        {findings.length === 0 && (
          <p className="text-[12px] text-gray-400 p-2">No findings linked to this cluster.</p>
        )}
        {findings.map((f, i) => (
          <div
            key={`${f.tool}-${f.line}-${i}`}
            className={`p-2 ${i < findings.length - 1 ? "border-b border-gray-400" : ""}`}
          >
            <span className="text-sm font-serif flex place-items-center gap-1">
              <span className="flex w-1.5 h-1.5 rounded-full bg-gray-400" />
              {f.tool} — {f.message}
            </span>
            <span className="text-[12px] text-gray-400 px-3">
              {f.file}:{f.line}
            </span>
          </div>
        ))}
      </div>

      {/* candidate commits */}
      <div className="p-3 py-2 flex flex-col gap-3">
        <span className="text-sm text-gray-500 font-mono">Ranked candidate commits</span>
        {commits.length === 0 && (
          <p className="text-[12px] text-gray-400">No candidate commits found.</p>
        )}
        {commits.map((c, i) => (
          <CommitRow key={c.sha || i} commit={c} top={i === 0} />
        ))}
      </div>

      {/* LLM explanation */}
      <div className="p-3 py-2 flex flex-col gap-3">
        <div className="w-full p-4 bg-black text-white flex flex-col gap-2 rounded-xl">
          <h2 className="text-gray-400 text-sm font-mono">LLM root-cause explanation</h2>
          <p className="text-[14px]">{d.explanation || "No explanation available."}</p>
        </div>
      </div>

      {/* actions */}
      <div className="p-3 py-2 flex gap-3">
        <button
          onClick={() => onStatusChange("assigned")}
          disabled={d.status === "assigned"}
          className="w-full p-2 flex justify-center border border-gray-200 text-sm font-semibold font-mono rounded-sm hover:border-gray-400 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Assign to author
        </button>
        <button
          onClick={() => onStatusChange("blocked")}
          disabled={d.status === "blocked"}
          className="w-full p-2 flex justify-center border border-gray-400 text-sm font-semibold font-mono rounded-sm bg-red-500 text-white cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Block merge
        </button>
      </div>
    </div>
  );
}