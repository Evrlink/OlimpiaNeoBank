import { Router } from "express";

export const v1Router = Router();

v1Router.get("/", (_req, res) => {
  res.json({
    api: "olimpia",
    version: "v1",
    status: "ready",
  });
});
