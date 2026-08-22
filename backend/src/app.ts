import express from 'express';
import cookieParser from 'cookie-parser';
const app=express();

// Middleware to parse JSON and URL-encoded data
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
// Middleware to parse cookies that is set and get cookies
app.use(cookieParser());
