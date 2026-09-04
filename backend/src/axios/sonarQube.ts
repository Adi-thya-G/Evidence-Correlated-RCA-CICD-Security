import { env } from "@config/env";
import axios from 'axios';

const SONARQUBE=env.SONARQUBE_HOST
const SONAR_TOKEN = process.env.SONAR_TOKEN;

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