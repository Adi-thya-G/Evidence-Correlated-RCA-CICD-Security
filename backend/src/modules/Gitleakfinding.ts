import mongoose, { Schema, Types, Document } from "mongoose";

export interface IGitleaksFinding extends Document {
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
  commit: string;
  author: string;
  raw: any;
}

const GitleaksFindingSchema = new Schema<IGitleaksFinding>({
  accountId: { type: Schema.Types.ObjectId, ref: "User", required: true },
  findingHash:{type:String,required:true},
  repo_id: { type: Number, required: [true, "repo id required"] },
  projectKey: { type: String, required: true, index: true },
  branch: { type: String, default: "main" },
  repo: { type: String, required: true },
  scanId: { type: String, required: true, index: true },
  scannedAt: { type: Date, required: true },
  tool: { type: String, default: "gitleaks" },
  category: { type: String, default: "secret" },
  ruleId: { type: String, required: true },
  severity: { type: String, default: "HIGH", index: true },
  message: { type: String, default: "" },
  file: { type: String, required: true },
  startLine: Number,
  endLine: Number,
  commit: { type: String, index: true },
  author: String,
  raw: Schema.Types.Mixed,
});

GitleaksFindingSchema.index({ projectKey: 1, severity: 1 });
GitleaksFindingSchema.index({ projectKey: 1, ruleId: 1, file: 1, startLine: 1 }); // dedupe same finding across scans

export const GitleaksFinding = mongoose.model<IGitleaksFinding>(
  "GitleaksFinding",
  GitleaksFindingSchema
);