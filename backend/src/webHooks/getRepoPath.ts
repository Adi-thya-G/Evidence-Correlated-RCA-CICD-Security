import path from "path";
import fs from "fs";
import { env } from "@config/env";
import simpleGit from "simple-git";
import { createAppAuth, } from "@octokit/auth-app";
import {GITHUB_APP_PRIVATE_KEY} from "@utils/AppInstallationDetails"
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

export const getInstallationId=async(installationId:number)=>{
  const auth = createAppAuth(
    {
    appId: env.GITHUB_APP_ID,
    privateKey: GITHUB_APP_PRIVATE_KEY,
    installationId: installationId,

  })
 const { token } = await auth({ type: 'installation' })
 return token
} 

export const getOrCreateRepoPath = async (
  installationId: number,
  repo:any,
): Promise<string> => {
  try {
    const repoPath = await getRepoPath(installationId, repo.id);
    const GITHUB_TOKEN = await getInstallationId(installationId);
     const remote = `https://x-access-token:${GITHUB_TOKEN}@github.com/${repo.full_name}.git`;
    if (fs.existsSync(repoPath)) {
       const git = simpleGit(repoPath);
    await git.remote(['set-url', 'origin', remote]); // token rotates, refresh it
    await git.fetch('origin');
    await git.reset(['--hard', 'origin/HEAD']);
    return repoPath;
      return repoPath;
    }
    fs.mkdirSync(repoPath, { recursive: true });
    
    console.log(GITHUB_TOKEN);
    await simpleGit(repoPath).clone(remote, repoPath);
    return repoPath;
  } catch (error) {
    throw error;
  }
};
