/**
 * Provider webhook helpers.
 * Bridge webhooks have been removed. Coinbase Headless webhook handling
 * will be added here in the Coinbase integration task.
 */

export class WebhookError extends Error {
  constructor(
    message: string,
    readonly status: number = 400,
  ) {
    super(message);
    this.name = "WebhookError";
  }
}
