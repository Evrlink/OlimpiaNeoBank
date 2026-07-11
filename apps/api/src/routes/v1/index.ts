import { Router } from "express";
import { activityRouter } from "./activity.js";
import { authRouter } from "./auth.js";
import { balanceRouter } from "./balance.js";
import { meRouter } from "./me.js";

export const v1Router = Router();

v1Router.get("/", (_req, res) => {
  res.json({
    api: "olimpia",
    version: "v1",
    status: "ready",
  });
});

v1Router.use("/auth", authRouter);
v1Router.use("/activity", activityRouter);
v1Router.use("/balance", balanceRouter);
v1Router.use("/me", meRouter);
