import express from "express";
import { healthRouter } from "./routes/health.js";
import { v1Router } from "./routes/v1/index.js";

export function createApp() {
  const app = express();

  app.use(express.json());
  app.use(healthRouter);
  app.use("/api/v1", v1Router);

  return app;
}
