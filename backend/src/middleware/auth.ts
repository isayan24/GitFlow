import { Request, Response, NextFunction } from "express";
import { requireAuth as clerkRequireAuth, getAuth } from "@clerk/express";
import { prisma } from "../config/db.js";

// Extend Express Request interface to include Clerk and DB User info
export interface AuthenticatedRequest extends Request {
  auth?: {
    userId: string;
    dbUser?: any;
  };
}

// Helper to check if Clerk is configured with real keys
const isClerkConfigured = (): boolean => {
  const pubKey = process.env.CLERK_PUBLISHABLE_KEY;
  const secKey = process.env.CLERK_SECRET_KEY;
  return (
    !!pubKey &&
    pubKey !== "pk_test_placeholder_key" &&
    !!secKey &&
    secKey !== "sk_test_placeholder_key"
  );
};

// Route-level middleware that verifies the Clerk session
export const requireAuth = (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
) => {
  if (!isClerkConfigured()) {
    // In development mode, mock a user if Clerk keys are not set
    if (process.env.NODE_ENV !== "production") {
      req.auth = {
        userId: "user_clerk_dev_mock",
      };
      return next();
    }
    return res.status(500).json({
      status: "ERROR",
      message: "Clerk authentication is not configured on this server.",
    });
  }

  // Otherwise, use Clerk's official Express middleware
  return clerkRequireAuth()(req, res, next);
};

// Middleware that ensures the authenticated Clerk user exists in our local PostgreSQL database
export const requireDbUser = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
) => {
  try {
    let userId: string;

    if (!isClerkConfigured()) {
      if (process.env.NODE_ENV !== "production") {
        userId = "user_clerk_dev_mock";

        // Auto-create/upsert mock user in local DB to prevent foreign key issues during testing
        let mockUser = await prisma.user.findUnique({
          where: { clerkId: userId },
        });

        if (!mockUser) {
          mockUser = await prisma.user.create({
            data: {
              clerkId: userId,
              githubUsername: "gitflow_mock_developer",
              email: "developer@gitflow.local",
              name: "Mock Developer",
              avatarUrl:
                "https://avatars.githubusercontent.com/u/131574568?v=4",
            },
          });
        }

        req.auth = {
          userId,
          dbUser: mockUser,
        };
        return next();
      }
      return res.status(500).json({
        status: "ERROR",
        message: "Clerk authentication is not configured on this server.",
      });
    }

    // Clerk is configured, extract real auth state
    const authState = getAuth(req);
    if (!authState.userId) {
      return res.status(401).json({
        status: "UNAUTHORIZED",
        message: "User is not authenticated via Clerk.",
      });
    }

    userId = authState.userId;

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
