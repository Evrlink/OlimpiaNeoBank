import cors from "cors";
import express from "express";
import { env } from "./config/env.js";
import { healthRouter } from "./routes/health.js";
import { coinbaseWebhookRouter } from "./routes/webhooks/coinbase.js";
import { v1Router } from "./routes/v1/index.js";

export function createApp() {
  const app = express();

  if (env.corsOrigins.length > 0) {
    app.use(
      cors({
        origin: env.corsOrigins,
        credentials: true,
      }),
    );
  }

  app.use(
    "/webhooks/coinbase",
    express.raw({ type: "application/json" }),
    coinbaseWebhookRouter,
  );

  app.use(express.json());
  app.use(healthRouter);
  app.use("/api/v1", v1Router);

  return app;
}
