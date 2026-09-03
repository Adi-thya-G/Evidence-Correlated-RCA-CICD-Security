import {spawn} from "child_process";

export const runSonarQubeScanner =async(reportPath: string, projectKey: string )=>{
  return new Promise((resolve,reject)=>{
    const sonarQubeScanner = spawn('sonar-scanner', [
      `-Dsonar.projectKey=${projectKey}`,
      `-Dsonar.sources=.`,
      `-Dsonar.host.url=${process.env.SONARQUBE_HOST}`,
      `-Dsonar.login=${process.env.SONARQUBE_TOKEN}`,
    ],{cwd: reportPath,shell:true})

    sonarQubeScanner.stdout.on('data', (data) => {
      console.log(`SonarQube Scanner Output: ${data}`);
    })

    sonarQubeScanner.stderr.on('data', (data) => {
      console.error(`SonarQube Scanner Error: ${data}`);
      throw new Error(`SonarQube Scanner Error: ${data}`);
    })
    sonarQubeScanner.on('close', (code) => {
      if (code === 0) {
        console.log('SonarQube Scanner completed successfully.');
        resolve(true);
      }
      else{
        console.error(`SonarQube Scanner exited with code ${code}`);
        reject(new Error(`SonarQube Scanner failed with code ${code}`));
      }


    })
  })
}

export const projectKey=async (instanceId:number,repoId:number):Promise<string>=>
{
  return  String(instanceId)+"_"+String(repoId)as string
}