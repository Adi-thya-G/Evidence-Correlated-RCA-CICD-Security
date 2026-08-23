
import dotevn from "dotenv"

import {z} from "zod"

dotevn.config()

// defining type of env
const envSchema = z.object({
  NODE_ENV:z.enum(['development','staging','production','test']).default('development'),
  PORT:z.coerce.number().default(3000),
  //database set up
  MONGODB_URI:z.string().min(1,'MONGODB URL REQUIRED'),

  JWT_SECRET:z.string().min(16,'JWT SECRET MUST BE 16 CHARCTER'),
  JWT_EXPIRES_IN:z.string().default('7d'),
  GITHUB_CLIENT_ID:z.string(),
  GITHUB_CLIENT_SECRET:z.string(),
  GITHUB_CALLBACK_URL:z.string(),
  GITHUB_WEBHOOK_SECRET:z.string(),

  PINECONE_API_KEY:z.string(),
  PINECONE_INDEX:z.string(),

  LLM_API_KEY:z.string(),
  LLM_API_URL:z.string(),

  // slack
  SLACK_BOT_TOKEN:z.string(),

  // smtp simple mail transfer protocol
  SMTP_HOST:z.string(),
  SMTP_PORT:z.coerce.number(),
  SMTP_USER:z.string(),
  SMTP_PASS:z.string(),


  // rate limiter env variable
  RATE_LIMIT_WINDOW_MS:z.coerce.number().default(900000),
  RATE_LIMIT_MAX:z.coerce.number().default(100)


}).readonly()

const parsedData=envSchema.safeParse(process.env)

// parseData check value exist in env.local file
if(!parsedData.success){
  console.log("env configuration failed")
  process.exit(1)
}

export const env=parsedData.data

export type ENV=typeof env
