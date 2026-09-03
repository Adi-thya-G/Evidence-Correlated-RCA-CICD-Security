import { Schema, model, Document } from "mongoose";

/* -------------------------------------------------------------------- */
/* Types                                                                */
/* -------------------------------------------------------------------- */

export interface IInstallationRepo {
  repoId: number;
  name: string;
  fullName: string;
  private: boolean;
  lastSyncedCommit?: string | null;
  disconnected: boolean;
  correlationHistory: boolean;
}

export type InstallationStatus =
  | "pending_confirmation"
  | "confirmed"
  | "suspended"
  | "deleted";

export interface IInstallation extends Document {
  installationId: number; // GitHub's unique installation id (globally unique)

  appId: number;
  appSlug: string;

  accountLogin: string;
  accountId: number;
  accountType: "User" | "Organization";

  repositorySelection: "all" | "selected";
  repositories: IInstallationRepo[];

  permissions: Record<string, string>;
  events: string[];

  status: InstallationStatus;
  installedAt: Date;
  suspendedAt: Date | null;
  deletedAt: Date | null;

  createdAt: Date;
  updatedAt: Date;
}

/* -------------------------------------------------------------------- */
/* Sub-schema: repo                                                     */
/* -------------------------------------------------------------------- */

const repoSchema = new Schema<IInstallationRepo>(
  {
    repoId: { type: Number, required: true },
    name: { type: String, required: true, trim: true },
    fullName: { type: String, required: true, trim: true },
    private: { type: Boolean, default: false },
    lastSyncedCommit: { type: String, default: null },
    disconnected: { type: Boolean, default: false },
    correlationHistory: { type: Boolean, default: false },


  },
  { _id: false }
);

/* -------------------------------------------------------------------- */
/* Main schema                                                          */
/* -------------------------------------------------------------------- */

const installationSchema = new Schema<IInstallation>(
  {
    installationId: { type: Number, required: true, unique: true, index: true },

    appId: { type: Number, required: true },
    appSlug: { type: String, required: true, trim: true },

    accountLogin: { type: String, required: true, trim: true, index: true },
    accountId: { type: Number, required: true },
    accountType: { type: String, enum: ["User", "Organization"], required: true },

    repositorySelection: { type: String, enum: ["all", "selected"], required: true },
    repositories: { type: [repoSchema], default: [] },

    permissions: { type: Schema.Types.Mixed, default: {} },
    events: { type: [String], default: [] },

    status: {
      type: String,
      enum: ["pending_confirmation", "confirmed", "suspended", "deleted"],
      default: "pending_confirmation",
      index: true,
    },
    installedAt: { type: Date, default: Date.now },
    suspendedAt: { type: Date, default: null },
    deletedAt: { type: Date, default: null },
  },
  {
    timestamps: true,
    toJSON: {
      transform: (_doc, ret) => {
        delete (ret as { __v?: number }).__v;
        return ret;
      },
    },
  }
);

// Useful for querying repos across installations, e.g. "does any install have this repo"
installationSchema.index({ "repositories.repoId": 1 });

export const Installation = model<IInstallation>("Installation", installationSchema);