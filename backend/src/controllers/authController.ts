import { Response, NextFunction } from "express";
import { AuthenticatedRequest } from "../middleware/auth.js";
import { prisma } from "../config/db.js";
import { clerkClient } from "@clerk/express";

/**
 * Controller to synchronize Clerk authenticated profile into our local PostgreSQL database
 */
export const syncUser = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
) => {
  try {
    const clerkId = req.auth?.userId;

    if (!clerkId) {
      return res.status(401).json({
        status: "UNAUTHORIZED",
        message: "No active authentication session found.",
      });
    }

    console.log(`🔄 Querying Clerk API for profile of user: ${clerkId}`);
    const clerkUser = await clerkClient.users.getUser(clerkId);

    const email = clerkUser.emailAddresses[0]?.emailAddress || null;
    const name =
      `${clerkUser.firstName || ""} ${clerkUser.lastName || ""}`.trim() || null;
    const githubUsername = clerkUser.username || null;
    const avatarUrl = clerkUser.imageUrl || null;

    const syncedUser = await prisma.user.upsert({
      where: { clerkId },
      update: {
        githubUsername,
        email,
        name,
        avatarUrl,
      },
      create: {
        clerkId,
        githubUsername,
        email,
        name,
        avatarUrl,
      },
    });

    return res.status(200).json({
      status: "SUCCESS",
      message: "User profile synchronized successfully.",
      user: syncedUser,
    });
  } catch (error) {
    console.error("Error synchronizing user profile:", error);
    next(error);
  }
};
