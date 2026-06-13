import { Response, NextFunction } from "express";
import { AuthenticatedRequest } from "../middleware/auth.js";
import { getDashboardData, getDashboardCommitsForDate } from "../services/dashboard/dashboardService.js";

/**
 * GET /api/dashboard/stats
 * All business logic is delegated to `dashboardService` — this handler
 */
export const getDashboardStats = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const dbUserId = req.auth?.dbUser?.id;
    const clerkId = req.auth?.userId;

    if (!dbUserId || !clerkId) {
      res.status(401).json({
        status: "UNAUTHORIZED",
        message: "User not authenticated.",
      });
      return;
    }

    const stats = await getDashboardData(dbUserId, clerkId);

    res.status(200).json({ status: "SUCCESS", stats });
  } catch (error) {
    console.error("❌ Dashboard stats error:", error);
    next(error);
  }
};

/**
 * GET /api/dashboard/commits
 * Returns commits across all user repositories on a given date (format YYYY-MM-DD).
 */
export const getDashboardCommits = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const dbUserId = req.auth?.dbUser?.id;
    const clerkId = req.auth?.userId;
    const { date } = req.query;

    if (!dbUserId || !clerkId) {
      res.status(401).json({
        status: "UNAUTHORIZED",
        message: "User not authenticated.",
      });
      return;
    }

    if (!date || typeof date !== "string") {
      res.status(400).json({
        status: "BAD_REQUEST",
        message: "Missing or invalid query parameter: date is required (format: YYYY-MM-DD).",
      });
      return;
    }

    const commits = await getDashboardCommitsForDate(dbUserId, clerkId, date);

    res.status(200).json({ status: "SUCCESS", commits });
  } catch (error) {
    console.error("❌ Dashboard commits error:", error);
    next(error);
  }
};
