import axios from 'axios'
import {env} from "@config/env";
import { decode } from 'he';

const SONARQUBEHOST=env.SONARQUBE_HOST
const SONARQUBETOKEN=env.SONARQUBE_TOKEN

export interface snippetLine{
  line: number;
  code:string;
  isFlagged:boolean;
}

export const fetchSonarSnippet=async(key:string, line:number,context=3)=>{
 try{
   console.log(`Fetching SonarQube snippet for component ${key} at line ${line} with context ${context}`);
  const from=Math.max(1,line-context)
  const to=Number(line)+Number(context) as number
  const response = await axios.get(`${SONARQUBEHOST}/api/sources/lines`,
    {
    params:{
      key,
      from,to
    },auth:{
      username:SONARQUBETOKEN as string,
      password:''
  }})
  return response.data.sources.map((s: any) => ({
      line: s.line,
      code: decode(s.code ?? ""),   // <-- decode HTML entities here
      isFlagged: s.line ===  Number(line),
    }));
 }
 catch(err){
console.error(`Error fetching SonarQube snippet for component ${key} at line ${line}:`, err);
throw new Error(`Error fetching SonarQube snippet: ${err}`);
 }
}