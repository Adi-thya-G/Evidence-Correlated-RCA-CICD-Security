import { Types, Schema, model } from "mongoose";

export type EventState = "pending" | "in-progress" | "completed" | "failed";

interface EventKind {
  name: string; // "commit", "deploy", ...
  properties: {
    maxTime: number;
    maximumTries: number;
  };
}

export interface IEvent {
  _id: Types.ObjectId;
  accountId: Types.ObjectId;
  deliveryId: string; // X-GitHub-Delivery, for dedupe
  commitSha?: string;
  repoId: number;
  eventType: EventKind;
  state: EventState;
  tries: number;
  title: string;
  message: string;
  completedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const eventSchema = new Schema<IEvent>(
  {
    accountId: { type: Schema.Types.ObjectId, required: true, ref: "User", index: true },
    deliveryId: { type: String, required: true, unique: true },
    commitSha: { type: String },
    repoId: { type: Number, required: true },
    eventType: {
      name: { type: String, required: true },
      properties: {
        maxTime: { type: Number, required: true },
        maximumTries: { type: Number, required: true },
      },
    },
    state: {
      type: String,
      enum: ["pending", "in-progress", "completed", "failed"],
      default: "pending",
      required: true,
    },
    tries: { type: Number, default: 0 },
    title: { type: String, required: true },
    message: { type: String, required: true },
    completedAt: { type: Date },
  },
  { timestamps: true, collection: "events" }
);

eventSchema.index({ accountId: 1, createdAt: -1 });

export const EventModel = model<IEvent>("Event", eventSchema);