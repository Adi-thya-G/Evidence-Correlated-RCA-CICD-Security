import { useEffect, useState } from "react";
import { Team_access } from "@/api/setting";
export interface TeamMember {
  git_auth: string;
  git_email: string;
  findings: number;
  last_commit: {
    hash: string | null;
    shortHash: string | null;
    date: string | null;
    summary: string | null;
  };
}

const ago = (iso: string | null) => {
  if (!iso) return "never";
  const mins = Math.floor((Date.now() - new Date(iso).getTime()) / 60000);
  if (mins < 60) return `${Math.max(mins, 1)} min ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs} hr ago`;
  const d = Math.floor(hrs / 24);
  return d === 1 ? "yesterday" : `${d} days ago`;
};

const initials = (n: string) =>
  n.split(/\s+/).map((p) => p[0]).slice(0, 2).join("").toUpperCase();

export default function TeamList({ repoId }: { repoId: number | string }) {
  const [members, setMembers] = useState<TeamMember[] | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
      // adjust to your route
      Team_access(repoId).then((res)=>setMembers(res));
  }, [repoId]);

  if (error) return <p className="text-sm text-red-700">{error}</p>;
  if (!members) return <p className="text-sm text-neutral-400">Loading team…</p>;
  if (!members.length)
    return <p className="text-sm text-neutral-400">No contributors yet. They appear after the first scan.</p>;

  return (
    <ul className="max-w-[860px] divide-y divide-neutral-200">
      {members.map((m) => (
        <li key={m.git_email} className="flex items-center gap-4 py-5">
          {/* avatar */}
          <div className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-neutral-900 text-[13px] font-semibold text-white">
            {initials(m.git_auth)}
          </div>

          {/* name + email */}
          <div className="min-w-0 flex-1">
            <p className="truncate text-[15px] font-semibold text-neutral-900">{m.git_auth}</p>
            <p className="truncate text-sm text-neutral-400">{m.git_email}</p>
          </div>

          {/* last push (replaces the role pill) */}
          <div
            className="flex shrink-0 flex-col items-end gap-1"
            title={m.last_commit.summary ?? undefined}
          >
            <span className="rounded-full border border-neutral-200 bg-neutral-50 px-3 py-0.5 font-mono text-xs text-neutral-600">
              {m.last_commit.shortHash ?? "no push"}
            </span>
            <span className="text-xs text-neutral-400">
              Last push {ago(m.last_commit.date)}
            </span>
          </div>
        </li>
      ))}
    </ul>
  );
}