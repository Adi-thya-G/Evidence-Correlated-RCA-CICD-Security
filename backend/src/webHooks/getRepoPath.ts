import path from 'path';
import fs from 'fs';
export const getRepoPath=async(installationId:number,repoId:number):Promise<string>=>{
  return path.join('D:','Evidence-Correlated-RCA-CICD-Security','data',installationId.toString(),repoId.toString(),)

}

export const getOrCreateRepoPath=async(installationId:number,repoId:number):Promise<string>=>{

  const repoPath=await getRepoPath(installationId,repoId);
  if(fs.existsSync(repoPath)){
    return repoPath;
  }
  fs.mkdirSync(repoPath,{recursive:true});
  return repoPath;
}