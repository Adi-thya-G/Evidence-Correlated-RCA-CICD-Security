import api from "./axiosInstance";

export async function GetSonarQubeReport({
  projectKey,
  page,
  page_size,
}: {
  projectKey: string;
  page: number;
  page_size: number;
}) {
  try {
    const { data } = await api.get("/sonarqube/data", {
      params: {
        projectKey: projectKey,
        page: page,
        page_size: page_size,
      },
    });

    return data.data;
  } catch (err) {
    throw new Error(`new api error ${err}`);
  }
}

interface queryProps {
  key: string;
  line: number;
  context?: number;
}

export async function getSourceCode(query: queryProps) {
  try {
    const { data } = await api.get("/sonarqube/sourcecode", {
      params: query,
    });
    return data.data;
  } catch (error) {
    throw error;
  }
}

// src/api/sonarQubeApi.ts (add alongside GetSonarQubeReport)

export async function GetSonarQubeSummary(params: { projectKey: string }) {
  const res = await api.get("/sonarqube/summary", {
    params: { projectKey: params.projectKey },
  });
  return res.data.data; // matches your response shape: { success, message, data: { data: {...} } }
}


//