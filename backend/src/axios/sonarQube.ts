import { env } from "@config/env";
import axios from 'axios';

const SONARQUBE=env.SONARQUBE_HOST
const SONAR_TOKEN = process.env.SONARQUBE_TOKEN;

export async function fetchSonarIssues(projectKey: string, branch: string) {
  const response = await axios.get(`${SONARQUBE}/api/issues/search`, {
    params: {
      componentKeys: projectKey,
      branch: branch,
      // createdAfter: lastSyncTimestamp, // once you track incremental syncs
      ps: 500, // page size, max 500
    },
    auth: {
      username: SONAR_TOKEN as string,
      password: '',
    },
  });
  return response.data.issues; // array of finding objects
}

export async function fetchSonarHotspots(projectKey: string, branch: string) {
  try{
  const response = await axios.get(`${SONARQUBE}/api/hotspots/search`, {
    params: { projectKey, branch, ps: 500 },
  });
  return response.data.hotspots;
}
catch(err){
  console.error(`Error fetching SonarQube hotspots for project ${projectKey} on branch ${branch}:`, err);
  throw new Error(`Error fetching SonarQube hotspots: ${err}`);
}
}