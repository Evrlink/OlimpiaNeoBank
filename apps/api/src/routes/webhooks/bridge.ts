import { Router, type Request } from "express";
import {
  processBridgeWebhook,
  verifyBridgeWebhookSignature,
  WebhookError,
} from "../../funding/webhooks.js";

type RequestWithRawBody = Request & { rawBody?: Buffer };

export const bridgeWebhookRouter = Router();

bridgeWebhookRouter.post("/", async (req, res) => {
  try {
    const request = req as RequestWithRawBody;
    const rawBody = request.rawBody
      ? request.rawBody.toString("utf8")
      : JSON.stringify(req.body ?? {});

    verifyBridgeWebhookSignature({
      rawBody,
      signatureHeader: req.header("X-Webhook-Signature") ?? undefined,
    });

    const payload =
      typeof req.body === "object" && req.body !== null
        ? req.body
        : JSON.parse(rawBody);

    const result = await processBridgeWebhook(payload);

    res.status(200).json({
      received: true,
      duplicate: result.duplicate,
    });
  } catch (error) {
    if (error instanceof WebhookError) {
      res.status(error.status).json({
        error: {
          code: "VALIDATION_ERROR",
          message: error.message,
        },
      });
      return;
    }

    if (error instanceof SyntaxError) {
      res.status(400).json({
        error: {
          code: "VALIDATION_ERROR",
          message: "Invalid webhook payload.",
        },
      });
      return;
    }

    res.status(500).json({
      error: {
        code: "INTERNAL_ERROR",
        message: "Unable to process webhook.",
      },
    });
  }
});
