import { IoIosArrowRoundDown } from "react-icons/io";
import { StatCard } from "./Statcard";
import type { RootCauseSummary } from "../src/stores/Userootcausestore";

export function SummaryCards({ summary }: { summary: RootCauseSummary | null }) {
  const s = summary;
  const dash = "—";
  console.log(summary,"inside summar")
  return (
    <div className="flex-1 grid grid-cols-4 gap-4 max-md:grid-cols-2 max-sm:grid-cols-1">
      <StatCard
        label="Raw findings"
        value={s?.raw_findings ?? dash}
        footer={`across ${s?.scanner_count ?? 0} scanners this run`}
      />
      <StatCard
        label="Correlated clusters"
        value={s?.clusters ?? dash}
        footerClass="text-green-700 font-mono"
        footer={
          <>
            <IoIosArrowRoundDown size={20} /> from {s?.pre_correlation ?? 0} pre-correlation
          </>
        }
      />
      <StatCard
        label="High-confidence causes"
        value={s?.high_confidence ?? dash}
        footerClass="text-red-700 font-mono"
        footer="≥ 85% causal likelihood"
      />
      <StatCard
        label="Deployment gate"
        value={s ? `${s.blocked_count} blocked` : dash}
        valueClass={s && s.blocked_count > 0 ? "text-red-700" : ""}
        footerClass="text-gray-500 font-serif"
        footer="unresolved high-confidence cause"
      />
    </div>
  );
}