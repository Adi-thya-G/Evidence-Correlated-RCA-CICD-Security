import path from "path";
import fs from "fs";
import { env } from "@config/env";
import simpleGit from "simple-git";
import { createAppAuth } from "@octokit/auth-app";
import { GITHUB_APP_PRIVATE_KEY } from "@utils/AppInstallationDetails";

export const getRepoPath = async (
  installationId: number,
  repoId: number,
): Promise<string> => {
  return path.join(
    env.DATABASE_NAME,
    installationId.toString(),
    "repo",
    repoId.toString(),
  );
};

export const getInstallationId = async (installationId: number) => {
  const auth = createAppAuth({
    appId: env.GITHUB_APP_ID,
    privateKey: GITHUB_APP_PRIVATE_KEY,
    installationId: installationId,
  });
  const { token } = await auth({ type: "installation" });
  return token;
};

// Applies common repo-local git config: clears any cached credential
// helper (so nothing but our embedded token is used for auth) and sets
// a consistent bot identity for commits made by the app.
const applyRepoGitConfig = async (repoPath: string) => {
  const git = simpleGit(repoPath);
  await git.addConfig("credential.helper", "", false, "local");
  await git.addConfig("user.name", "YourApp Bot");
  await git.addConfig("user.email", "bot@yourapp.com");
  return git;
};

export const getOrCreateRepoPath = async (
  installationId: number,
  repo: any,
): Promise<string> => {
  try {
    const repoPath = await getRepoPath(installationId, repo.id);
    const GITHUB_TOKEN = await getInstallationId(installationId);
    const remote = `https://x-access-token:${GITHUB_TOKEN}@github.com/${repo.full_name}.git`;

    if (fs.existsSync(repoPath)) {
      const git = await applyRepoGitConfig(repoPath);
      await git.remote(["set-url", "origin", remote]); // token rotates, refresh it

      // Use the branch name GitHub itself reports as default, instead of
      // relying on git to resolve origin/HEAD locally — that resolution
      // step is where fetch was going stale/incorrect. repo.default_branch
      // comes straight from the GitHub API, so it's always accurate.
      const branch = repo.default_branch;
      if (!branch) {
        throw new Error(
          `repo.default_branch is missing for ${repo.full_name}; cannot determine branch to sync`,
        );
      }

      // Fetch just that branch, plus tags, and prune deleted remote refs.
      await git.fetch(["origin", branch, "--prune", "--tags"]);

      const fetchLog = await git.raw(["log", "-1", `origin/${branch}`, "--oneline"]);
      console.log(`[getOrCreateRepoPath] fetched ${repo.full_name}@${branch}: ${fetchLog.trim()}`);

      await git.checkout(branch).catch(() => git.checkout(["-B", branch, `origin/${branch}`]));
      await git.reset(["--hard", `origin/${branch}`]);

      // reset --hard only affects tracked files; wipe anything untracked
      // (build artifacts, stray files from a previous run) too.
      await git.clean("f", ["-d", "-x"]);

      return repoPath;
    }

    fs.mkdirSync(repoPath, { recursive: true });
    await simpleGit(repoPath).clone(remote, repoPath);
    await applyRepoGitConfig(repoPath);

    return repoPath;
  } catch (error) {
    throw error;
  }
};