import fs from 'fs';
import path from 'path';
import { Installation } from '@modules/Installation';

const workDir=path.join('D:','Evidence-Correlated-RCA-CICD-Security','data','installations');


export const upsertInstallation=async(payload:any)=>{
  const installation=payload.installation;
   const doc = await Installation.findOneAndUpdate(
    { installationId: installation.id },
    {
      $set: {
        appId: installation.app_id,
        appSlug: installation.app_slug,
        accountLogin: installation.account.login,
        accountId: installation.account.id,
        accountType: installation.account.type,
        repositorySelection: installation.repository_selection,
        repositories: (payload.repositories ?? []).map((r: any) => ({
          repoId: r.id,
          name: r.name,
          fullName: r.full_name,
          private: r.private,
          lastSyncedCommit: null,
        })),
        permissions: installation.permissions,
        events: installation.events,
        status: "confirmed",
        installedAt: installation.created_at,
        suspendedAt: installation.suspended_at,
      },
    },
    { upsert: true, new: true } // <-- upsert handles "create if not exists"
  )
  return doc

}


export const CreateWebHooks=async(installationId:number,payload:any)=>{

   const meta = {
    installationId,
    appId: payload.installation.app_id,
    appSlug: payload.installation.app_slug,
    accountLogin: payload.installation.account.login,
    accountId: payload.installation.account.id,
    accountType: payload.installation.account.type,
    repositorySelection: payload.installation.repository_selection,
    permissions: payload.installation.permissions,
    events: payload.installation.events,
    repositories: (payload.repositories ?? []).map((r: any) => ({
      repoId: r.id,
      name: r.name,
      fullName: r.full_name,
      private: r.private,
      lastSyncedCommit: null,
    })),
    status: 'confirmed',
    installedAt: payload.installation.created_at,
    updatedAt: payload.installation.updated_at,
    suspendedAt: payload.suspended_at,
    lastScanRunAt: null,
    schemaVersion: 1,
  };
  const installationDir = path.join(workDir, String(installationId));
  await fs.promises.mkdir(installationDir, { recursive: true });
  await fs.promises.writeFile(
    path.join(installationDir, 'meta.json'),
    JSON.stringify(meta, null, 2),
    'utf-8'
  );
  const repo=path.join(installationDir,"repo")
  await fs.promises.mkdir(repo,{recursive:true});
  const doc=await upsertInstallation(payload);
  console.log(doc,"document");
  
}

