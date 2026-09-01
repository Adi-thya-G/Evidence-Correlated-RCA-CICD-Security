import { getOrCreateRepoPath } from "./getRepoPath";
export const handlePushEvent=async(payload:any)=>{
try{
  const installationId = payload.installation.id;
  const repository=payload.repository;
  const repoPath=await getOrCreateRepoPath(installationId,repository);
  console.log('repoPath:',repoPath)
  return repoPath;



}
catch(err){
  throw new Error(`Error in handlePushEvent: ${err}`);

}
}