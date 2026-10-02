import crypto from "crypto";
import { sendEventToUser } from "@controllers/event.controller";

export type NotificationType =
  | "github"
  | "repository"
  | "pipeline"
  | "sonarqube"
  | "security"
  | "correlation"
  | "deployment";

export const notify = async (
  installationId: number | string | undefined,
  data: { type: NotificationType; title: string; message: string },
) => {
  if (!installationId) return;
  try {
    await sendEventToUser(undefined, installationId, "notification", {
      id: crypto.randomUUID(),
      ...data,
      createdAt: new Date().toISOString(),
      unread: true,
    });
  } catch (err) {
    // a failed notification must never break the webhook
    console.error("notify failed:", err);
  }
};