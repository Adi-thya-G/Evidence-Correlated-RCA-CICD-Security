import express from 'express';
import { connectDB } from '@config/db';
import app from './app';
import {connectProducer} from "@kafka/producer"


app.get('/',(req: express.Request,res: express.Response)=>{
res.send('Hello World! how do do')
})

connectDB().then((res)=>{app.listen(3000,async()=>{
await connectProducer().then((res)=>console.log(res))
console.log('Server is running on port 3000')
})})