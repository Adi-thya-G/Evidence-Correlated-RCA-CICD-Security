import { Document, Schema, model, Types } from "mongoose";

interface ISetting extends Document {
  _id: Types.ObjectId;
  threshold: number;
  retrieval: number;
  slack: boolean;
  email: boolean;
  alertThresholds: "Critical only" | "Critical + High" | "All severities";
  
}

const SettingSchema = new Schema<ISetting>({
  threshold: {
    type: Number,
    required: true,
    default: 0.5,
  },
  retrieval: {
    type: Number,
    required: true,
    default: 3,
    max: 20,
  },
  slack: {
    type: Boolean,
    required: true,
    default: false,
  },
  email: {
    type: Boolean,
    required: true,
    default: false,
  },
  alertThresholds: {
    type: String,
    enum: ["Critical only", "Critical + High", "All severities"],
    default: "Critical only", 
  },
},{
  timestamps: true,
});


export const Setting = model<ISetting>("Setting", SettingSchema);
