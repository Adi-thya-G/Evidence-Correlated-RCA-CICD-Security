import mongoose, { Schema, Types, Document } from "mongoose";

interface IToolDiff {
  previousTotal: number;
  currentTotal: number;
  resolvedCount: number;
  newCount: number;
  unchangedCount: number;
}

export interface ISecurityScanReport extends Document {
  projectKey: string;
  accountId: Types.ObjectId;
  repo_id: number;
  branch: string;
  repo: string;
  repoPath: string;
  scanId: string;
  previousScanId: string | null;
  totalFindings: number;
  previousTotalFindings: number;
  findingsByTool: {
    semgrep: number;
    gitleaks: number;
    trivy: number;
  };
  diffVsPreviousScan: {
    resolved: number;
    new: number;
    byTool: {
      semgrep: IToolDiff;
      gitleaks: IToolDiff;
      trivy: IToolDiff;
    };
  };
  status: "SUCCESS" | "FAILED";
  error?: string;
  scannedAt: Date;
}

const ToolDiffSchema = new Schema<IToolDiff>(
  {
    previousTotal: { type: Number, default: 0 },
    currentTotal: { type: Number, default: 0 },
    resolvedCount: { type: Number, default: 0 },
    newCount: { type: Number, default: 0 },
    unchangedCount: { type: Number, default: 0 },
  },
  { _id: false }
);

const SecurityScanReportSchema = new Schema<ISecurityScanReport>({
  projectKey: { type: String, required: true, unique: true, index: true },
  accountId: { type: Schema.Types.ObjectId, ref: "User", required: true },
  repo_id: { type: Number, required: [true, "repo id required"] },
  branch: { type: String, default: "main" },
  repo: { type: String, required: true },
  repoPath: String,
  scanId: { type: String, required: true, index: true },
  previousScanId: { type: String, default: null },
  totalFindings: { type: Number, default: 0 },
  previousTotalFindings: { type: Number, default: 0 },
  findingsByTool: {
    semgrep: { type: Number, default: 0 },
    gitleaks: { type: Number, default: 0 },
    trivy: { type: Number, default: 0 },
  },
  diffVsPreviousScan: {
    resolved: { type: Number, default: 0 },
    new: { type: Number, default: 0 },
    byTool: {
      semgrep: { type: ToolDiffSchema, default: () => ({}) },
      gitleaks: { type: ToolDiffSchema, default: () => ({}) },
      trivy: { type: ToolDiffSchema, default: () => ({}) },
    },
  },
  status: { type: String, enum: ["SUCCESS", "FAILED"], default: "SUCCESS" },
  error: String,
  scannedAt: { type: Date, required: true },
});

SecurityScanReportSchema.index({ accountId: 1 });
SecurityScanReportSchema.index({ repo_id: 1 });

export const SecurityScanReport = mongoose.model<ISecurityScanReport>(
  "SecurityScanReport",
  SecurityScanReportSchema
);