import type { FindingItem } from './types'

export const DATA: FindingItem[] = [
  
  { _id: '1', tool: 'sonarqube', ruleId: 'typescript:S1128', severity: 'MINOR',
    message: "Remove this unused import of 'mongoose'.", file: 'backend/src/controllers/setting.controller.ts',
    startLine: 8, git_author_name: 'Adithya karmarkar', git_commit_hash: '1bbcca0158d3e48b',
    git_commit_date: '2026-09-30T15:34:44Z', git_commit_summary: 'added ui setting also handle usestate setting',
    git_diff: '@@ -1,11 +1,167 @@\n import { Installation } from "@modules/Installation";\n+import { User } from "@modules/User";\n+import mongoose from "mongoose";\n-const getGeneralSetting=asyncHandler(async(req,res,next)=>{',
    status: 'pending', enrichedAt: '2026-09-30T15:40:52Z' },
  { _id: '2', tool: 'sonarqube', ruleId: 'typescript:S4325', severity: 'MAJOR',
    message: 'This assertion is unnecessary since it does not change the type of the expression.',
    file: 'backend/src/utils/gitEvidence/blameParser.ts', startLine: 43, git_author_name: 'Adithya karmarkar',
    git_commit_hash: 'e1834323c371dec5', git_commit_date: '2026-09-18T06:37:42Z',
    git_commit_summary: 'here all git data is layer 2 is handled', status: 'triaged', enrichedAt: '2026-09-30T09:10:09Z' },
  { _id: '3', tool: 'gitleaks', ruleId: 'generic-api-key', severity: 'CRITICAL', message: 'Hardcoded API key detected.',
    file: 'backend/src/config/env.ts', startLine: 12, git_author_name: 'Adithya karmarkar',
    git_commit_hash: '1bbcca0158d3e48b', git_commit_date: '2026-09-30T15:34:44Z',
    git_commit_summary: 'added ui setting also handle usestate setting', status: 'pending', enrichedAt: '2026-09-30T15:40:52Z' },
]
 

  // ...your sample items
