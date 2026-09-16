import { spawn } from "child_process";
import { env } from "@config/env";

const SONAR_SCANNER_BAT = env.SONARQUBE_PATH;

export const runSonarQubeScanner = async (reportPath: string, projectKey: string) => {
  return new Promise((resolve, reject) => {
    const sonarQubeScanner = spawn(SONAR_SCANNER_BAT, [
      `-Dsonar.projectKey=${projectKey}`,
      `-Dsonar.sources=.`,
      `-Dsonar.host.url=${process.env.SONARQUBE_HOST}`,
      `-Dsonar.login=${process.env.SONARQUBE_TOKEN}`,
    ], { cwd: reportPath, shell: true });

    let stderrBuffer = "";

    sonarQubeScanner.stdout.on('data', (data) => {
      console.log(`SonarQube Scanner Output: ${data}`);
    });

    sonarQubeScanner.stderr.on('data', (data) => {
      // Just log/collect — do NOT throw here. sonar-scanner writes
      // normal progress/warning output to stderr even on success.
      stderrBuffer += data.toString();
      console.error(`SonarQube Scanner Error: ${data}`);
    });

    sonarQubeScanner.on('error', (err) => {
      // fires if the .bat itself can't be spawned (bad path, missing file, etc.)
      reject(new Error(`Failed to start sonar-scanner: ${err.message}`));
    });

    sonarQubeScanner.on('close', (code) => {
      if (code === 0) {
        console.log('SonarQube Scanner completed successfully.');
        resolve(true);
      } else {
        reject(new Error(`SonarQube Scanner failed with code ${code}. Stderr: ${stderrBuffer}`));
      }
    });
  });
};

export const projectKey = async (instanceId: number, repoId: number): Promise<string> => {
  return String(instanceId) + "_" + String(repoId);
};

export function parseEffortToMinutes(effort?: string): number {
  if (!effort) return 0;
  const hoursMatch = effort.match(/(\d+)h/);
  const minsMatch = effort.match(/(\d+)min/);
  const hours = hoursMatch ? parseInt(hoursMatch[1], 10) : 0;
  const mins = minsMatch ? parseInt(minsMatch[1], 10) : 0;
  return hours * 60 + mins;
}

export function formatMinutesAsEffortLabel(totalMinutes: number): string {
  const hours = Math.floor(totalMinutes / 60);
  const mins = totalMinutes % 60;
  if (hours === 0) return `${mins}m`;
  return `${hours}h ${mins}m`;
}