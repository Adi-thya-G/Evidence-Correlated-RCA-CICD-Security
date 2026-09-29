import { SonarAnalysisHistory } from './SonarQubeHistory';
import { SonarQubeReport } from './SonarQubeReport';
import { NormalizedFinding } from '../types/gitEvidence.types';

interface SonarDataFetchArgs {
  accountId: string;
  repo_id: string | number;
  commitSha: string;
}

/**
 * Returns the SonarQube issues from the latest report for this project
 * that are actually referenced by the analysis run for this commit.
 */
export async function SonarDataFetch({ accountId, repo_id, commitSha }: SonarDataFetchArgs): Promise<NormalizedFinding[]> {
  const analysis = await SonarAnalysisHistory.findOne({ commitSha });
  if (!analysis) {
    console.warn(`No SonarQube analysis found for commit=${commitSha}, repo=${repo_id}`);
    return [];
  }

  if (!analysis.issueKeys?.length) {
    return [];
  }

  const report = await SonarQubeReport.findOne({
    accountId,
    repo_id,
    projectKey: analysis.projectKey,
  });

  if (!report?.issues?.length) {
    return [];
  }

  const keySet = new Set(analysis.issueKeys);

  const matchedIssues = report.issues
    .filter((issue) => keySet.has(issue.key))
    .map((issue) => (issue.toObject ? issue.toObject() : issue)); // strip Mongoose doc wrapper

  // map Sonar's field names onto your NormalizedFinding shape
  return matchedIssues.map((issue: any) => ({
    findingHash: issue.key,
    accountId: String(accountId),
    repo_id,
    tool: 'sonarqube',
    category: 'sast',
    ruleId: issue.rule ?? issue.key,
    severity: issue.severity ?? 'UNKNOWN',
    message: issue.message ?? '',
    file: issue.component ?? '',
    startLine: issue.line,
    endLine: issue.line,
    raw: issue,
  }));
}