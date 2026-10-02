import {Schema,model,Types} from "mongoose"

interface Notification{
  _id: Types.ObjectId;
  userId: Types.ObjectId;
  type: string;
  title: string;
  message: string;
  createdAt: Date;
  unread: boolean;

}

const notificationSchema=new Schema<Notification>({
  
  type:{type:String,required:true},
  userId:{type:Schema.Types.ObjectId,ref:"User",required:true},
  title:{type:String,required:true},
  message:{type:String,required:true},
  createdAt:{type:Date,default:Date.now},
  unread:{type:Boolean,default:false}
},{timestamps:true})

export const NotificationModel = model<Notification>("Notification",notificationSchema)
