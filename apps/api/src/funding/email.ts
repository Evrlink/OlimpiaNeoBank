import { env } from "../config/env.js";

export async function sendDepositCompletedEmail(input: {
  toEmail: string | null;
  amountUsd: string;
}): Promise<void> {
  if (!input.toEmail?.trim()) {
    return;
  }

  if (!env.resendApiKey.trim() || !env.resendFromEmail.trim()) {
    return;
  }

  try {
    await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${env.resendApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: env.resendFromEmail,
        to: [input.toEmail.trim()],
        subject: "Money added to your Olimpia account",
        text: `$${input.amountUsd} was added to your available balance.`,
      }),
    });
  } catch {
    // Email is best-effort; deposit completion must not fail on Resend errors.
  }
}
