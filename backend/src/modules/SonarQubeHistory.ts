import mongoose,{Schema,Types,Document} from "mongoose";

export interface ISonarAnalysisHistory extends Document{
  accountId:Types.ObjectId,
  projectKey:string,
  branch:string,
  analysisId:string,
  commitSha:string,
  qualityGateStatus:string,
  totalIssues:number,
  totalHotspots:number,
  issueKeys:string[],
  analysedAt:Date
}

const SonarAnalysisHistorySchema = new Schema<ISonarAnalysisHistory>({
  accountId: { type: Schema.Types.ObjectId, ref: "User", required: true },
  projectKey: { type: String, required: true, index: true },
  branch: { type: String, default: "main" },
  analysisId: { type: String, required: true },
  commitSha: { type: String, required: true, index: true },
  qualityGateStatus: String,
  totalIssues: Number,
  totalHotspots: Number,
  issueKeys: [String],
  analysedAt: { type: Date, required: true },
});

SonarAnalysisHistorySchema.index({ projectKey: 1, analysisId: 1 }, { unique: true });
SonarAnalysisHistorySchema.index({ projectKey: 1, branch: 1, analysedAt: -1 }); // fast "latest N" queries

export const SonarAnalysisHistory = mongoose.model<ISonarAnalysisHistory>(
  "SonarAnalysisHistory",
  SonarAnalysisHistorySchema
);