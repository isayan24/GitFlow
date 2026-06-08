import { Response, NextFunction } from "express";
import { AuthenticatedRequest } from "../middleware/auth.js";
import { clerkClient } from "@clerk/express";
import { githubService } from "../services/githubService.js";

/**
 * Controller to fetch the authenticated user's GitHub repositories.
 * Supports Clerk social connection token fetching.
 */
export const listUserRepos = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
) => {
  try {
    const clerkId = req.auth?.userId;

    if (!clerkId) {
      return res.status(401).json({
        status: "UNAUTHORIZED",
        message: "No active session found.",
      });
    }

    // Fetch GitHub Access Token from Clerk
    const tokenResponse = await clerkClient.users.getUserOauthAccessToken(
      clerkId,
      "github",
    );
    const githubToken = tokenResponse.data[0]?.token;

    if (!githubToken) {
      return res.status(400).json({
        status: "ERROR",
        message:
          "GitHub social connection token not found. Please log in with GitHub.",
      });
    }

    const page = parseInt(req.query.page as string) || 1;
    const perPage = parseInt(req.query.per_page as string) || 20;
    const search = (req.query.search as string) || "";

    // Query GitHub API
    const repos = await githubService.fetchUserRepos(
      githubToken,
      page,
      perPage,
      search,
    );

    const mappedRepos = repos.map((repo) => ({
      id: repo.id,
      name: repo.name,
      fullName: repo.full_name,
      description: repo.description,
      url: repo.html_url,
      isPrivate: repo.private,
      owner: repo.owner.login,
      ownerAvatarUrl: repo.owner.avatar_url,
      language: repo.language,
    }));

    return res.status(200).json({
      status: "SUCCESS",
      repositories: mappedRepos,
    });
  } catch (error) {
    console.error("Error listing user repositories:", error);
    next(error);
  }
};
