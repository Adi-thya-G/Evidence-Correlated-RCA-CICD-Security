/**
 * src/models/User.ts
 *
 * User schema for GitHub OAuth login + GitHub App installation tracking.
 *
 * One App installation per user — installation fields are flat on the
 * document rather than an embedded array/sub-schema, since this project
 * doesn't need to support a user with multiple installations.
 *
 * Design principles applied:
 *  - Strongly typed via a TS interface (IUser) alongside the Mongoose schema
 *  - No GitHub OAuth token stored — session auth is via your own signed JWT;
 *    repo/file access uses the GitHub App installation token (installationId),
 *    not the user's personal token, so nothing sensitive needs to persist here
 *  - Indexes on every field used for lookups (githubId, email, installationId)
 *  - Timestamps (createdAt/updatedAt) via schema option, not manual fields
 *  - Enum-constrained fields instead of free-text strings where possible
 *  - toJSON transform strips internal fields (__v) from API responses
 */

import { Schema, model, Document, Types } from "mongoose";

/* -------------------------------------------------------------------- */
/* Main User schema                                                     */
/* -------------------------------------------------------------------- */

export type UserRole = "admin" | "member" | "viewer";
export type AuthProvider = "github";

export interface IUser extends Document {
  _id: Types.ObjectId;

  // Identity
  githubId: number;
  login: string;
  displayName?: string;
  email?: string;
  avatarUrl?: string;
  authProvider: AuthProvider;

  // Auth / session
  lastLoginAt?: Date;
  loginCount: number;

  // Authorization
  role: UserRole;
  isActive: boolean;

  // GitHub App installation (one per user — set when they install the App)
  installationId?: number | null;
  installationAccountLogin?: string; // org or user the App was installed on
  installationAccountType?: "User" | "Organization";
  repositorySelection?: "all" | "selected";
  installationPermissions?: Record<string, string>; // e.g. { contents: "read", pull_requests: "write" }
  installedAt?: Date | null;
  installationSuspendedAt?: Date | null;
  
  createdAt: Date;
  updatedAt: Date;
}

const userSchema = new Schema<IUser>(
  {
    githubId: {
      type: Number,
      required: true,
      unique: true,
      index: true,
    },
    login: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },
    displayName: { type: String,
       trim: true },
    email: {
      type: String,
      trim: true,
      lowercase: true,
      index: true,
      sparse: true, // GitHub email can be null if user keeps it private
      match: [/^[^\s@]+@[^\s@]+\.[^\s@]+$/, "Invalid email format"],
    },
    avatarUrl: { type: String, trim: true },
    authProvider: {
      type: String,
      enum: ["github"],
      required: true,
      default: "github",
    },

    lastLoginAt: { type: Date },
    loginCount: { type: Number, default: 0, min: 0 },

    role: {
      type: String,
      enum: ["admin", "member", "viewer"],
      default: "member",
    },
    isActive: { type: Boolean, default: true },

    installationId: { type: Number, default: null, index: true, sparse: true, unique: true },
    installationAccountLogin: { type: String, trim: true },
    installationAccountType: { type: String, enum: ["User", "Organization"] },
    repositorySelection: { type: String, enum: ["all", "selected"] },
    installationPermissions: { type: Schema.Types.Mixed, default: {} },
    installedAt: { type: Date, default: null },
    installationSuspendedAt: { type: Date, default: null },
  },
  {
    timestamps: true, // adds createdAt / updatedAt automatically
    toJSON: {
      transform: (_doc, ret) => {
        delete ret.__v;
        return ret;
      },
    },
  },
);

/* -------------------------------------------------------------------- */
/* Indexes (compound / secondary)                                       */
/* -------------------------------------------------------------------- */

userSchema.index({ role: 1, isActive: 1 });

export const User = model<IUser>("User", userSchema);