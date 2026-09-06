// models/SonarQubeReport.model.ts
import mongoose, { Schema, Document,Types } from "mongoose";
import { number } from "zod";

// ---- Sub-schemas ----

const QualityGateConditionSchema = new Schema(
  {
    metricKey: String,
    operator: String,
    status: String,
    errorThreshold: String,
    actualValue: String,
  },
  { _id: false }
);

const IssueSchema = new Schema(
  {
    key: { type: String, required: true },
    rule: String,
    severity: {
      type: String,
      enum: ["INFO", "MINOR", "MAJOR", "CRITICAL", "BLOCKER"],
    },
    component: String,
    line: Number,
    status: String,
    message: String,
    effort: String,
    debt: String,
    author: String,
    tags: [String],
    type: {
      type: String,
      enum: ["CODE_SMELL", "BUG", "VULNERABILITY"],
    },
    cleanCodeAttribute: String,
    cleanCodeAttributeCategory: String,
    issueStatus: String,
    creationDate: Date,
    updateDate: Date,
  },
  { _id: false }
);

const HotspotSchema = new Schema(
  {
    key: { type: String, required: true },
    component: String,
    line: Number,
    message: String,
    status: String,
    vulnerabilityProbability: String,
    securityCategory: String,
    ruleKey: String,
    creationDate: Date,
    updateDate: Date,
  },
  { _id: false }
);

// ---- Main schema ----

export interface ISonarQubeReport extends Document {
  accountId: Types.ObjectId;
  projectKey: string;
  projectName?: string;
  branch: string;
  taskId?: string;
  analysisId?: string;
  status: string; // SUCCESS | FAILED etc. from webhook payload
  qualityGateStatus?: string;
  qualityGateConditions?: typeof QualityGateConditionSchema[];
  metrics?: Record<string, string | number>;
  issues: (typeof IssueSchema)[];
  hotspots: (typeof HotspotSchema)[];
  totalIssues: number;
  totalHotspots: number;
  analysedAt?: Date;
  rawPayload?: Record<string, any>; // keep original webhook payload for debugging
  createdAt: Date;
  updatedAt: Date;
}

const SonarQubeReportSchema = new Schema<ISonarQubeReport>(
  {
    accountId: { type: Schema.Types.ObjectId ,ref:"User",required:true},
    projectKey: { type: String, required: true, unique: true },
    projectName: String,
    branch: { type: String, default: "main", index: true },
    taskId: String,
    analysisId: String,
    status: { type: String, required: true },
    qualityGateStatus: String,
    qualityGateConditions: [QualityGateConditionSchema],
    metrics: { type: Schema.Types.Mixed },
    issues: [IssueSchema],
    hotspots: [HotspotSchema],
    totalIssues: { type: Number, default: 0 },
    totalHotspots: { type: Number, default: 0 },
    analysedAt: Date,
    rawPayload: { type: Schema.Types.Mixed },
  },
  { timestamps: true }
);

// Useful compound index for querying latest report per project+branch
SonarQubeReportSchema.index({ projectKey: 1, branch: 1, createdAt: -1 });

export const SonarQubeReport = mongoose.model<ISonarQubeReport>(
  "SonarQubeReport",
  SonarQubeReportSchema
);