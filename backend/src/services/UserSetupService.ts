import { Setting } from "@modules/Setting";
import { Mongoose,Types } from "mongoose";


// this are used in kafka for in usersetup
export const userSetupSettingService=async(user_id:Types.ObjectId)=>{
try {
   const settingsDoc=await  Setting.insertOne({userId:user_id})
   console.log(`user id:${user_id} setting profile is created successfuly setting_id:${settingsDoc._id}`)
   return settingsDoc;
} catch (error) {
  console.log(`user id:${user_id} setting profile raise error ${error}`)
  throw error;
}

}