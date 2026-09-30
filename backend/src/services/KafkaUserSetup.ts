import {kafka} from "@kafka/client"


const consumer=kafka.consumer({groupId:"userSetUpService"})

const userSetUpService=async()=>{
await consumer.connect();
  await consumer.subscribe({ topic: 'user_setup_service', fromBeginning: false });

  consumer.run({
    
    eachMessage:async({message})=>{
      if(message.)

  }})
}


