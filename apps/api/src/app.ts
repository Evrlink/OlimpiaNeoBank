import cors from "cors";
import express from "express";
import { env } from "./config/env.js";
import { healthRouter } from "./routes/health.js";
import { v1Router } from "./routes/v1/index.js";
import { bridgeWebhookRouter } from "./routes/webhooks/bridge.js";

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

  // Bridge signature verification needs the raw body on this path.
  app.use(
    "/webhooks/bridge",
    express.json({
      verify: (req, _res, buf) => {
        (req as express.Request & { rawBody?: Buffer }).rawBody = buf;
      },
    }),
    bridgeWebhookRouter,
  );

  app.use(express.json());
  app.use(healthRouter);
  app.use("/api/v1", v1Router);

  return app;
}
