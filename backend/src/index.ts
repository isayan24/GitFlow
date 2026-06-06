import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { prisma } from "./config/db.js";
import apiRouter from "./routes/index.js";
import { errorHandler } from "./middleware/errorHandler.js";
import { clerkMiddleware } from "@clerk/express";

dotenv.config();

const app = express();
const port = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

// Mount Clerk middleware globally only if configured
const isClerkConfigured =
  process.env.CLERK_PUBLISHABLE_KEY &&
  process.env.CLERK_PUBLISHABLE_KEY !== "pk_test_placeholder_key" &&
  process.env.CLERK_SECRET_KEY &&
  process.env.CLERK_SECRET_KEY !== "sk_test_placeholder_key";

if (isClerkConfigured) {
  app.use(clerkMiddleware());
} else {
  console.warn(
    "⚠️ Clerk keys are not configured. clerkMiddleware is bypassed for public routes.",
  );
}

// API Routes
app.use("/api", apiRouter);

// Root path / health check
app.get("/health", async (req, res) => {
  try {
    // Run a basic raw query to test database connectivity
    await prisma.$queryRaw`SELECT 1`;
    res.json({
      status: "OK",
      message: "GitFlow API is running and database connection is healthy.",
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Database connection test failed:", error);
    res.status(500).json({
      status: "ERROR",
      message: "Database connection failed.",
      error: error instanceof Error ? error.message : String(error),
    });
  }
});

// Register error handling middleware
app.use(errorHandler);

// Start the server
app.listen(port, () => {
  console.log(`🚀 GitFlow backend server running on http://localhost:${port}`);
});
