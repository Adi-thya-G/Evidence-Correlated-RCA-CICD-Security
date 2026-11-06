// src/models/finding.model.ts
import { Schema, model, type Types } from 'mongoose';

export type FindingStatus = 'open' | 'resolved' | 'reopened';
export type ResolvedReason =
  | 'code_changed' | 'file_deleted' | 'dependency_upgraded' | 'suppressed' | 'unknown';

export interface FindingDoc {
  accountId: Types.ObjectId | string;
  repo_id: number;
  projectKey?: string;
  branch: string;
  fingerprint: string; // stable identity: survives line shifts, same across commits

  tool: string; // semgrep | gitleaks | trivy | sonarqube
  category?: string;
  ruleId?: string;
  severity?: string;
  message?: string;
  file?: string;
  startLine?: number;
  endLine?: number;
  pkgName?: string;

  // Lifecycle (written by scan-and-store.js)
  status: FindingStatus;
  reopenCount: number;
  firstSeenScanId?: string;
  firstSeenCommitSha?: string;
  firstSeenAt?: Date;
  lastSeenScanId?: string;
  lastSeenCommitSha?: string;
  lastSeenAt?: Date;
  resolvedScanId?: string | null;
  resolvedAt?: Date | null;
  resolvedAtCommitSha?: string | null;
  fixingCommitSha?: string | null;
  resolvedReason?: ResolvedReason | null;
  manualStatus?: 'false_positive' | 'accepted_risk' | null; // human decision, never overwritten by scans

  // Introducing commit (root-cause candidate)
  git_commit_hash?: string | null;
  git_author?: string;
  git_commit_date?: Date | string;
  git_commit_summary?: string;
  git_commit_hashes_all?: string[];
  blameConfidence?: 'high' | 'medium' | 'low' | 'none';
  git_diff?: string; // filled later by the enrichment step

  // Source link (raw scanner output lives in the per-tool collection)
  sourceCollection?: string;
  sourceId?: Types.ObjectId;

  // Embedding / correlation (filled by later layers)
  embeddingStatus: 'pending' | 'done' | 'failed';
  enrichedAt?: Date;
}

const findingSchema = new Schema<FindingDoc>(
  {
    accountId: { type: Schema.Types.ObjectId, required: true, index: true },
    repo_id: { type: Number, required: true },
    projectKey: String,
    branch: { type: String, required: true },
    fingerprint: { type: String, required: true },

    tool: { type: String, required: true },
    category: String,
    ruleId: String,
    severity: String,
    message: String,
    file: String,
    startLine: Number,
    endLine: Number,
    pkgName: String,

    status: { type: String, enum: ['open', 'resolved', 'reopened'], default: 'open' },
    reopenCount: { type: Number, default: 0 },
    firstSeenScanId: String,
    firstSeenCommitSha: String,
    firstSeenAt: Date,
    lastSeenScanId: String,
    lastSeenCommitSha: String,
    lastSeenAt: Date,
    resolvedScanId: String,
    resolvedAt: Date,
    resolvedAtCommitSha: String,
    fixingCommitSha: String,
    resolvedReason: String,
    manualStatus: String,

    git_commit_hash: String,
    git_author: String,
    git_commit_date: Schema.Types.Mixed,
    git_commit_summary: String,
    git_commit_hashes_all: [String],
    blameConfidence: String,
    git_diff: String,

    sourceCollection: String,
    sourceId: Schema.Types.ObjectId,

    embeddingStatus: { type: String, enum: ['pending', 'done', 'failed'], default: 'pending' },
    enrichedAt: Date,
  },
  { timestamps: true, strict: false } // strict:false keeps extra fields (e.g. correlation results)
);

// One document per finding for its whole life. Rescans and Kafka redelivery update it, never duplicate it.
findingSchema.index({ accountId: 1, repo_id: 1, branch: 1, tool: 1, fingerprint: 1 }, { unique: true });
findingSchema.index({ repo_id: 1, status: 1 });
findingSchema.index({ repo_id: 1, git_commit_hash: 1 }); // correlation: group by introducing commit
findingSchema.index({ repo_id: 1, git_author: 1 });
findingSchema.index({ embeddingStatus: 1 });

export const Finding = model<FindingDoc>('Finding', findingSchema);