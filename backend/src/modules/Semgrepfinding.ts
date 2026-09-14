import mongoose, { Schema, Types, Document } from "mongoose";
import { string } from "zod";

export interface ISemgrepFinding extends Document {
  accountId: Types.ObjectId;
  findingHash:string,
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
  startLine?: number;
  endLine?: number;
  raw: any;
}

const SemgrepFindingSchema = new Schema<ISemgrepFinding>({
  accountId: { type: Schema.Types.ObjectId, ref: "User", required: true },
  findingHash:{type:String,required:true},
  repo_id: { type: Number, required: [true, "repo id required"] },
  projectKey: { type: String, required: true, index: true },
  branch: { type: String, default: "main" },
  repo: { type: String, required: true },
  scanId: { type: String, required: true, index: true },
  scannedAt: { type: Date, required: true },
  tool: { type: String, default: "semgrep" },
  category: { type: String, default: "sast" },
  ruleId: { type: String, required: true },
  severity: { type: String, required: true, index: true },
  message: { type: String, default: "" },
  file: { type: String, required: true },
  startLine: Number,
  endLine: Number,
  raw: Schema.Types.Mixed,
});

SemgrepFindingSchema.index({ projectKey: 1, severity: 1 });
SemgrepFindingSchema.index({ projectKey: 1, ruleId: 1, file: 1, startLine: 1 }); // dedupe same finding across scans

export const SemgrepFinding = mongoose.model<ISemgrepFinding>(
  "SemgrepFinding",
  SemgrepFindingSchema
);