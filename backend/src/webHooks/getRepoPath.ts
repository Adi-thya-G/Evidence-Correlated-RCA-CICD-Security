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

// Asks the remote directly which branch its HEAD points to, using
// `git ls-remote --symref` — no dependency on repo.default_branch being
// present, and no dependency on local refs (origin/HEAD) going stale.
const getRemoteDefaultBranch = async (
  repoPath: string,
  remote: string,
): Promise<string> => {
  const git = simpleGit(repoPath);
  const output = await git.raw(["ls-remote", "--symref", remote, "HEAD"]);
  // Output looks like:
  //   ref: refs/heads/main\tHEAD
  //   <sha>\tHEAD
  const match = output.match(/^ref:\s+refs\/heads\/(\S+)\s+HEAD/m);
  if (!match) {
    throw new Error(`Could not determine default branch from remote ${remote}`);
  }
  return match[1];
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

      const branch = await getRemoteDefaultBranch(repoPath, remote);

      // Fetch just that branch, plus tags, and prune deleted remote refs.
      await git.fetch(["origin", branch, "--prune", "--tags"]);

      const fetchLog = await git.raw(["log", "-1", `origin/${branch}`, "--oneline"]);
      console.log(`[getOrCreateRepoPath] fetched ${repo.full_name}@${branch}: ${fetchLog.trim()}`);

      await git.checkout(branch).catch(() => git.checkout(["-B", branch, `origin/${branch}`]));
      await git.reset(["--hard", `origin/${branch}`]);

      // reset --hard only affects tracked files; wipe anything untracked
      // (build artifacts, stray files from a previous run) too.
      console.log(`[getOrCreateRepoPath] cleaning untracked files in ${repo.full_name}`)
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