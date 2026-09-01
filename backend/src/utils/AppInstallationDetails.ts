import { env } from "@config/env";
import  Jwt  from "jsonwebtoken";
import fs from "fs"
import path from "path";

export const GITHUB_APP_PRIVATE_KEY= fs.readFileSync(
  path.resolve(process.cwd(), "verdict-technology.2026-08-24.private-key.pem"),
  "utf8"
)

export const AppInstallationId=async(installationId:number|string)=>{
  const appJwt = Jwt.sign(
    {
      iss: env.GITHUB_APP_ID,
    },
    GITHUB_APP_PRIVATE_KEY,
    {
      algorithm: "RS256",
      expiresIn: "9m",
    }
  );
  const response = await fetch(
    `https://api.github.com/app/installations/${installationId}`,
    {
      headers: {
        Authorization: `Bearer ${appJwt}`,
        Accept: "application/vnd.github+json",
        "X-GitHub-Api-Version": "2026-03-10",
      },
    }
  );

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`GitHub installation fetch failed: ${error}`);
  }
  console.log(response)

  return response.json();

}