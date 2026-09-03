import express from 'express';
import cookieParser from 'cookie-parser';
import helmet from 'helmet'
import router from './routes/index.router';
import webHookRouter from './routes/webhook.router'
import { webhookLimiter } from "@middleware/rateLimiter.middleware";
const app=express();

app.set("trust proxy", 1);
// .. helmet help node .js and express app setting the 13 important http security header
// content-security policy and stricty transport securtiy policy

app.use(helmet())
// we define web router before the express.json middleware because webhooks give data stream form so when use middleware express.json then middleware store value and read value but data only read once so that we have keep app.use()
app.use('/api/v1/webhooks',webhookLimiter,webHookRouter)

// Middleware to parse JSON and URL-encoded data
app.use(express.json());
app.use(express.urlencoded({ extended: true }))
// Middleware to parse cookies that is set and get cookies
app.use(cookieParser());
app.use('/api',router)

export default app;


