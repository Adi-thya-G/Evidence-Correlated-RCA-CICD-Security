import express from 'express';
import cookieParser from 'cookie-parser';
import helmet from 'helmet'
import router from './routes/index.router';
const app=express();

// .. helmet help node .js and express app setting the 13 important http security header
// content-security policy and stricty transport securtiy policy

app.use(helmet())

// Middleware to parse JSON and URL-encoded data
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
// Middleware to parse cookies that is set and get cookies
app.use(cookieParser());
app.use('/api',router)

export default app;


