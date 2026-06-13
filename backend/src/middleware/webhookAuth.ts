import { Request, Response, NextFunction } from "express";
import crypto from "crypto";

/**
 * Middleware to verify that the incoming request is a valid GitHub Webhook.
 * It checks the `x-hub-signature-256` header against the payload signed
 * with our local `GITHUB_WEBHOOK_SECRET`.
 */
export function verifyGitHubSignature(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  const signature = req.headers["x-hub-signature-256"] as string;
  const secret = process.env.GITHUB_WEBHOOK_SECRET;

  // If secret is not defined in local environment, warn but bypass verification (for dev simplicity)
  if (!secret) {
    console.warn(
      "⚠️ GITHUB_WEBHOOK_SECRET is not configured in .env. Webhook signature checks are bypassed.",
    );
    return next();
  }

  if (!signature) {
    res.status(401).json({
      status: "UNAUTHORIZED",
      message: "Missing webhook signature header (x-hub-signature-256).",
    });
    return;
  }

  const hmac = crypto.createHmac("sha256", secret);
  const rawBody = (req as any).rawBody || Buffer.from("");
  hmac.update(rawBody);
  const digest = `sha256=${hmac.digest("hex")}`;

  try {
    const hasValidSignature = crypto.timingSafeEqual(
      Buffer.from(signature),
      Buffer.from(digest),
    );

    if (!hasValidSignature) {
      res.status(401).json({
        status: "UNAUTHORIZED",
        message: "Invalid webhook signature.",
      });
      return;
    }
  } catch (err) {
    res.status(401).json({
      status: "UNAUTHORIZED",
      message: "Webhook signature validation failed.",
    });
    return;
  }

  next();
}
