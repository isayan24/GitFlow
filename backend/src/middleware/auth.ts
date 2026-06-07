import { Request, Response, NextFunction } from "express";
import { requireAuth as clerkRequireAuth, getAuth } from "@clerk/express";
import { prisma } from "../config/db.js";

// Extend Express Request interface to include Clerk and DB User info
export interface AuthenticatedRequest extends Request {
  auth?: {
    userId: string;
    dbUser?: any; // Mapped DB user object
  };
}

// Built-in Clerk middleware that rejects unauthenticated requests
export const requireAuth = clerkRequireAuth();

/**
 * Middleware that ensures the authenticated Clerk user exists in our local PostgreSQL database
 */
export const requireDbUser = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
) => {
  try {
    const authState = getAuth(req);

    if (!authState.userId) {
      return res.status(401).json({
        status: "UNAUTHORIZED",
        message: "User is not authenticated via Clerk.",
      });
    }

    const userId = authState.userId;

    // Find user in database
    const dbUser = await prisma.user.findUnique({
      where: { clerkId: userId },
    });

    if (!dbUser) {
      return res.status(404).json({
        status: "NOT_FOUND",
        message:
          "User record not found in local database. Please sync user first.",
      });
    }

    // Attach to request
    req.auth = {
      userId,
      dbUser,
    };

    next();
  } catch (error) {
    console.error("Error in requireDbUser middleware:", error);
    next(error);
  }
};
