import { Response } from "simple-git";
class ApiError extends Error {
  status: number;
  code: string;
  traceId?: string;
  retryAfterSeconds?: number;
  success: false;

  constructor(
    status: number,
    code: string,
    message: string,
    options?: { traceId?: string; retryAfterSeconds?: number }
  ) {
    super(message); // sets this.message, populates stack trace
    this.name = "ApiError";
    this.status = status;
    this.code = code;
    this.success = false;
    this.traceId = options?.traceId;
    this.retryAfterSeconds = options?.retryAfterSeconds;

    // Keeps stack trace clean (excludes constructor frame) — V8 only, safe to guard
    Error.captureStackTrace?.(this, this.constructor);
  }
   
}

export default ApiError ;