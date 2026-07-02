import { Router } from "express";
import { checkDatabaseConnection } from "../db/pool.js";
import { env } from "../config/env.js";

export const healthRouter = Router();

healthRouter.get("/health", async (_req, res) => {
  const database = await checkDatabaseConnection();

  res.status(200).json({
    status: "ok",
    service: "olimpia-api",
    environment: env.nodeEnv,
    database,
    timestamp: new Date().toISOString(),
  });
});
