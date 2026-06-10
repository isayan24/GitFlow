import { Response, NextFunction } from "express";
import { AuthenticatedRequest } from "../middleware/auth.js";
import { getDashboardData } from "../services/dashboard/dashboardService.js";

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
