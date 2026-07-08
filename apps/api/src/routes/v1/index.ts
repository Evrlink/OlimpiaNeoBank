import { Router } from "express";
import { authRouter } from "./auth.js";
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
v1Router.use("/me", meRouter);
