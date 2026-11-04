import { Request, Response, NextFunction, RequestHandler } from "express";
import { TokenExpiredError, JsonWebTokenError } from "jsonwebtoken";

type AsyncRequestHandler = (
  req: Request,
  res: Response,
  next: NextFunction
) => Promise<any>;

const send = (res: Response, status: number, message: string) =>
  res.status(status).json({ status, success: false, message });

export const asyncHandler = (fn: AsyncRequestHandler): RequestHandler => {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch((err: any) => {
      if (res.headersSent) return next(err);

      // JWT errors: check TokenExpiredError first, it extends JsonWebTokenError
      if (err instanceof TokenExpiredError) {
        res.clearCookie("token");
        return send(res, 401, "Token expired, please login again");
      }
      if (err instanceof JsonWebTokenError) {
        res.clearCookie("token");
        return send(res, 401, "Invalid token");
      }

      // your own ApiError or any other error
      const status = err?.statusCode ?? err?.status ?? 500;
      return send(res, status, status === 500 ? "Internal server error" : err.message);
    });
  };
};