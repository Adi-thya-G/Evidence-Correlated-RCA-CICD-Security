// src/modules/RootCause.ts
// Merge with your existing model if you already have one. The important additions
// are `status` (for resolve/ignore) and the unique index on (accountId, clusterId).
import { Schema, model, InferSchemaType } from 'mongoose';

const RootCauseSchema = new Schema(
  {
    clusterId: { type: String, required: true },
    accountId: { type: Schema.Types.ObjectId, required: true },
    repo_id: { type: Number, required: true },
    commitSha: { type: String },
    culprit_commit: { type: String },
    root_cause: { type: String },
    fix_suggestion: { type: String },
    confidence: { type: Number, min: 0, max: 1 },
    evidence_used: { type: [String], default: [] },
    hallucinatedCommit: { type: Boolean, default: false },
    model: { type: String },
    status: { type: String, enum: ['open', 'resolved', 'ignored'], default: 'open' },
  },
  { timestamps: true }
);

// One explanation per cluster per account. Reprocessed Kafka messages overwrite instead of duplicating.
// NOTE: delete existing duplicates before this index is built, or index creation will fail.
RootCauseSchema.index({ accountId: 1, clusterId: 1 }, { unique: true });
RootCauseSchema.index({ accountId: 1, repo_id: 1, confidence: -1 });
RootCauseSchema.index({ accountId: 1, repo_id: 1, commitSha: 1 });

export type RootCauseDoc = InferSchemaType<typeof RootCauseSchema>;
export const RootCause = model('RootCauseResults', RootCauseSchema);