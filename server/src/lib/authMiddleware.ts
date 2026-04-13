import { Request, Response, NextFunction } from "express";
import { auth } from "./auth";
import { fromNodeHeaders } from "better-auth/node";

export const authMiddleware = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  auth.api.getSession({
    headers: fromNodeHeaders(req.headers),
  }).then((session) => {
    if (!session) {
      res.status(401).json({ message: "Unauthorized" });
      return;
    }

    req.userId = session.user.id;
    next();
  }).catch((err) => {
    console.error("Auth error:", err);
    res.status(500).json({ message: "Internal server error" });
  });
};