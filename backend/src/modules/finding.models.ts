// src/models/finding.model.ts
import { Schema, model, type Types } from 'mongoose';

export interface FindingDoc {
  accountId: Types.ObjectId | string;
  repo_id: number;
  commitSha: string;
  fingerprint: string;

  tool?: string;
  category?: string;
  ruleId?: string;
  severity?: string;
  message?: string;
  file?: string;
  startLine?: number;
  endLine?: number;
  pkgName?: string;

  git_commit_hash?: string;
  git_author?: string;
  git_commit_date?: Date | string;
  git_commit_summary?: string;
  git_diff?: string;

  embeddingStatus: 'pending' | 'done' | 'failed';
  enrichedAt: Date;
}

const findingSchema = new Schema<FindingDoc>(
  {
    accountId: { type: Schema.Types.ObjectId, required: true, index: true },
    repo_id: { type: Number, required: true },
    commitSha: { type: String, required: true },
    fingerprint: { type: String, required: true },

    tool: String,
    category: String,
    ruleId: String,
    severity: String,
    message: String,
    file: String,
    startLine: Number,
    endLine: Number,
    pkgName: String,

    git_commit_hash: String,
    git_author: String,
    git_commit_date: Schema.Types.Mixed,
    git_commit_summary: String,
    git_diff: String,

    embeddingStatus: { type: String, enum: ['pending', 'done', 'failed'], default: 'pending' },
    enrichedAt: { type: Date, default: Date.now },
  },
  // strict:false keeps any extra fields your NormalizedFinding has
  { timestamps: true, strict: false }
);

// One document per finding per commit. This is what makes Kafka redelivery safe.
findingSchema.index(
  { accountId: 1, repo_id: 1, commitSha: 1, fingerprint: 1 },
  { unique: true }
);
// Used later for correlation (group findings by introducing commit / author).
findingSchema.index({ repo_id: 1, git_commit_hash: 1 });
findingSchema.index({ repo_id: 1, git_author: 1 });

export const Finding = model<FindingDoc>('Finding', findingSchema);