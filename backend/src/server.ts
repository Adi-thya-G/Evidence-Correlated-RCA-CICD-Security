import express from 'express';
import { connectDB } from '@config/db';
import app from './app';


app.get('/',(req: express.Request,res: express.Response)=>{
res.send('Hello World! how do do')
})

connectDB().then((res)=>{app.listen(3000,()=>{
console.log('Server is running on port 3000')
})})