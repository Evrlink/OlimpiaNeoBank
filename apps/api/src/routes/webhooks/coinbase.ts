import { Router } from "express";
import { env } from "../../config/env.js";
import { handleCoinbaseOnrampWebhook, WebhookError } from "../../funding/webhooks.js";
import { verifyCoinbaseWebhookSignature } from "../../funding/coinbase/signature.js";

export const coinbaseWebhookRouter = Router();

coinbaseWebhookRouter.post("/", async (req, res) => {
  const secret = env.coinbaseWebhookSecret.trim();

  if (!secret) {
    res.status(500).send("Webhook secret not configured");
    return;
  }

  const rawBody = Buffer.isBuffer(req.body)
    ? req.body.toString("utf8")
    : typeof req.body === "string"
      ? req.body
      : "";

  if (!rawBody) {
    res.status(400).send("Missing body");
    return;
  }

  const signatureHeader = req.header("x-hook0-signature") ?? req.header("X-Hook0-Signature");

  if (
    !verifyCoinbaseWebhookSignature({
      payload: rawBody,
      signatureHeader,
      secret,
      headers: req.headers,
    })
  ) {
    res.status(400).send("Invalid signature");
    return;
  }

  let parsed: unknown;

  try {
    parsed = JSON.parse(rawBody);
  } catch {
    res.status(400).send("Invalid JSON");
    return;
  }

  try {
    await handleCoinbaseOnrampWebhook({
      payload: parsed,
      headers: req.headers,
    });
    res.status(200).send("OK");
  } catch (error) {
    if (error instanceof WebhookError) {
      res.status(error.status).send(error.message);
      return;
    }

    res.status(500).send("Processing error");
  }
});
