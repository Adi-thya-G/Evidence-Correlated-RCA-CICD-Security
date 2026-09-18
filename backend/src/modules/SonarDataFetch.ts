import { SonarAnalysisHistory } from './SonarQubeHistory';
import { SonarQubeReport } from './SonarQubeReport';

interface SonarDataFetchArgs {
  accountId: string;
  repo_id: string | number;
  commitSha: string;
}

/**
 * Returns the SonarQube issues from the latest report for this project
 * that are actually referenced by the analysis run for this commit.
 */
export async function SonarDataFetch({ accountId, repo_id, commitSha }: SonarDataFetchArgs) {
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

  // NOTE: this was previously inverted (`!keySet.has(...)`), which kept every
  // issue EXCEPT the ones tied to this analysis. Fixed to keep only the
  // issues that are actually referenced by this commit's analysis.
  const matchedIssues = report.issues.filter((issue: { key: string }) => keySet.has(issue.key));

  return matchedIssues;
}