import type { CandidateCommit } from "../src/stores/Userootcausestore";

export function CommitRow({ commit, top }: { commit: CandidateCommit; top: boolean }) {
  return (
    <div
      className={`w-full border rounded-xl flex justify-between gap-2 p-2 ${
        top ? "border-red-800 bg-red-100" : "border-gray-400 bg-gray-100"
      }`}
    >
      <span className="text-[14px] font-medium font-mono">{commit.sha.slice(0, 7)}</span>
      <span className="text-[14px] font-serif truncate">{commit.message}</span>
      <span className={`text-[14px] font-mono ${top ? "text-red-800" : "text-black"}`}>
        {commit.likelihood}%
      </span>
    </div>
  );
}