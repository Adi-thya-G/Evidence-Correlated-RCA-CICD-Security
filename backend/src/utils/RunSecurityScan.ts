import { spawn } from "child_process";
import fs from "fs";
import path from "path";

export interface RunSecurityScanOptions {
  /** Mongo ObjectId string — matches SonarQubeReport.accountId */
  accountId: string;
  /** GitHub repo id — matches SonarQubeReport.repo_id */
  repo_id: number | string;
  /** matches SonarQubeReport.projectKey */
  projectKey: string;
  /** defaults to "main" */
  branch?: string;
  /** override path to scan-and-store.js */
  scriptPath?: string;
}

export interface RunSecurityScanResult {
  pid: number | undefined;
  logFile: string;
}

/**
 * Runs scan-and-store.js (Semgrep + Gitleaks + Trivy) against a repo,
 * as a detached background process, so the caller (e.g. your webhook
 * handler) doesn't block waiting for the scan to finish.
 */
export function runSecurityScan(
  repoPath: string,
  opts: RunSecurityScanOptions,
): RunSecurityScanResult {
  const { accountId, repo_id, projectKey, branch = "main", scriptPath } = opts;

  if (!repoPath || !accountId || !repo_id || !projectKey) {
    throw new Error(
      "runSecurityScan requires repoPath, accountId, repo_id, and projectKey",
    );
  }

  const script = scriptPath || path.join(__dirname, "..", "scripts", "scan-and-store.js");

  if (!fs.existsSync(script)) {
    throw new Error(`scan-and-store.js not found at ${script}`);
  }

  // Log output somewhere durable instead of losing it — this process runs
  // detached, so stdout/stderr must go to a file, not the parent's console.
  const logDir = path.join(path.dirname(script), "scan-logs");
  fs.mkdirSync(logDir, { recursive: true });
  const logFile = path.join(logDir, `${projectKey}_${Date.now()}.log`);
  const logFd = fs.openSync(logFile, "a");

  const child = spawn(
    "node",
    [script, repoPath, String(accountId), String(repo_id), projectKey, branch],
    {
      cwd: path.dirname(script),
      detached: true,
      stdio: ["ignore", logFd, logFd],
    },
  );

  // Let the webhook handler's response return immediately without waiting
  // on this — the scan can take minutes on larger repos.
  child.unref();

  child.on("error", (err: Error) => {
    console.error(`Failed to start security scan for projectKey=${projectKey}:`, err);
  });

  console.log(
    `Started security scan — projectKey=${projectKey}, pid=${child.pid}, log=${logFile}`,
  );

  return { pid: child.pid, logFile };
}