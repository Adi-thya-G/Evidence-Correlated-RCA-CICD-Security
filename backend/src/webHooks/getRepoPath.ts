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
    const repoPath = await getRepoPath(installationId, repo);
    if (fs.existsSync(repoPath)) {
      return repoPath;
    }
    fs.mkdirSync(repoPath, { recursive: true });
    const GITHUB_TOKEN = await getInstallationId(installationId);
    console.log(GITHUB_TOKEN);
    await simpleGit(repoPath).clone(`https://x-access-token:${GITHUB_TOKEN}@github.com/${repo.name}.git`);
    return repoPath;
  } catch (error) {
    throw error;
  }
};
