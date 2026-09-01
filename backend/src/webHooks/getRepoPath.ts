import path from 'path';
export const getRepoPath=async(installationId:number,repoId:number):Promise<string>=>{
  return path.join('D:','Evidence-Correlated-RCA-CICD-Security','data',installationId.toString(),repoId.toString())

}