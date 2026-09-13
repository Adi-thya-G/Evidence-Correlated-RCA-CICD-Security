import mongoose, { Schema, Types, Document } from "mongoose";

export interface ITrivyFinding extends Document {
  accountId: Types.ObjectId;
  repo_id: number;
  projectKey: string;
  branch: string;
  repo: string;
  scanId: string;
  scannedAt: Date;
  tool: string;
  category: string;
  ruleId: string;
  severity: string;
  message: string;
  file: string;
  pkgName: string;
  installedVersion: string;
  fixedVersion?: string;
  raw: any;
}

const TrivyFindingSchema = new Schema<ITrivyFinding>({
  accountId: { type: Schema.Types.ObjectId, ref: "User", required: true },
  repo_id: { type: Number, required: [true, "repo id required"] },
  projectKey: { type: String, required: true, index: true },
  branch: { type: String, default: "main" },
  repo: { type: String, required: true },
  scanId: { type: String, required: true, index: true },
  scannedAt: { type: Date, required: true },
  tool: { type: String, default: "trivy" },
  category: { type: String, default: "sca" },
  ruleId: { type: String, required: true, index: true }, // CVE id
  severity: { type: String, required: true, index: true },
  message: { type: String, default: "" },
  file: { type: String, required: true },
  pkgName: { type: String, required: true, index: true },
  installedVersion: String,
  fixedVersion: String, // absent when no fix is published yet
  raw: Schema.Types.Mixed,
});

TrivyFindingSchema.index({ projectKey: 1, severity: 1 });
TrivyFindingSchema.index({ projectKey: 1, pkgName: 1 });

export const TrivyFinding = mongoose.model<ITrivyFinding>(
  "TrivyFinding",
  TrivyFindingSchema
);