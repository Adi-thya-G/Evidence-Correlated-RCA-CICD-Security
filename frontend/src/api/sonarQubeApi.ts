import api from "./axiosInstance";

async function GetSonarQubeReport({
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

async function getSourceCode(query: queryProps) {
  try {
    const { data } = await api.get("/sonarqube/sourcecode", {
      params: query,
    });
    return data.data;
  } catch (error) {
    throw error;
  }
}


//