
import dotevn from "dotenv"

import {z} from "zod"

dotevn.config({path:".env.local"})

// defining type of env
const envSchema = z.object({
  NODE_ENV:z.enum(['development','staging','production','test']).default('development'),
  PORT:z.coerce.number().default(3000),
  //database set up
  MONGODB_URI:z.string().min(1,'MONGODB URL REQUIRED'),
  DATABASE_NAME:z.string().min(1,'DATABASE NAME REQUIRED'),
  JWT_SECRET:z.string().min(16,'JWT SECRET MUST BE 16 CHARCTER'),
  JWT_EXPIRES_IN:z.string().default('7d'),
  GITHUB_CLIENT_ID:z.string(),
  GITHUB_CLIENT_SECRET:z.string(),
  GITHUB_CALLBACK_URL:z.string(),
  GITHUB_WEBHOOK_SECRET:z.string(),
  GITHUB_APP_PRIVATE_KEY:z.string(),
  GITHUB_APP_ID:z.coerce.number(),
  FRONTEND_URL:z.string(),
  GITHUB_APP_NAME:z.string(),
  PINECONE_API_KEY:z.string().optional(),
  PINECONE_INDEX:z.string().optional(),

  LLM_API_KEY:z.string().optional(),
  LLM_API_URL:z.string().optional(),

  // slack
  SLACK_BOT_TOKEN:z.string().optional(),

  // smtp simple mail transfer protocol
  SMTP_HOST:z.string().optional(),
  SMTP_PORT:z.coerce.number().optional(),
  SMTP_USER:z.string().optional(),
  SMTP_PASS:z.string().optional(),


  // rate limiter env variable
  RATE_LIMIT_WINDOW_MS:z.coerce.number().default(900000),
  RATE_LIMIT_MAX:z.coerce.number().default(100),

  // sonar qube env variable
  SONARQUBE_HOST:z.string(),
  SONARQUBE_TOKEN:z.string(),

}).readonly()

const parsedData=envSchema.safeParse(process.env)
console.log(parsedData.error)
// parseData check value exist in env.local file
if(!parsedData.success){
  console.log("env configuration failed")
  process.exit(1)
}

export const env=parsedData.data

export type ENV=typeof env
