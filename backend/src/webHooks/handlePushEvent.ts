import { getRepoPath } from "./getRepoPath";
export const handlePushEvent=async(payload:any)=>{
try{
  
  const installationId = payload.installation.id;
  const repository=payload.repository;
  const repoPath=await getRepoPath(installationId,repository.id);
  console.log('repoPath:',repoPath)
  return repoPath;



}
catch(err){
  throw new Error(`Error in handlePushEvent: ${err}`);

}
}