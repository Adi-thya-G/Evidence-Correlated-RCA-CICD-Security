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

})

const parsedData=envSchema.safeParse(process.env)
if(!parsedData){
  console.log("env configuration failed")
  process.exit(1);
}

export const env=parsedData.data

export type ENV=typeof env
