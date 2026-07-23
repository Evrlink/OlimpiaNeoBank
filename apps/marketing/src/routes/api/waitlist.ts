import { createFileRoute } from "@tanstack/react-router";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
/** Inbox that receives waitlist signup notifications (FormSubmit destination). */
const DEFAULT_NOTIFY_EMAIL = "alexandretamara@gmail.com";

type WaitlistBody = {
  email?: string;
  source?: string;
};

function json(data: unknown, status = 200) {
  return Response.json(data, { status });
}

async function deliverViaFormSubmit(
  signupEmail: string,
  source: string,
  requestUrl: string,
): Promise<{ ok: boolean; detail: string }> {
  const notify =
    process.env.WAITLIST_NOTIFY_EMAIL ||
    process.env.VITE_WAITLIST_NOTIFY_EMAIL ||
    process.env.VITE_SUPPORT_EMAIL ||
    DEFAULT_NOTIFY_EMAIL;

  const origin = (() => {
    try {
      return new URL(requestUrl).origin;
    } catch {
      return "https://olimpianeobank.app";
    }
  })();

  try {
    const response = await fetch(`https://formsubmit.co/ajax/${encodeURIComponent(notify)}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
        Origin: origin,
        Referer: `${origin}/`,
      },
      body: JSON.stringify({
        email: signupEmail,
        source,
        message: `New Olimpia waitlist signup: ${signupEmail}`,
        _replyto: signupEmail,
        _subject: `Olimpia waitlist: ${signupEmail}`,
        _template: "table",
        _captcha: "false",
      }),
    });

    const body = (await response.json().catch(() => null)) as {
      success?: string | boolean;
      message?: string;
    } | null;

    if (response.ok && (body?.success === true || body?.success === "true")) {
      return { ok: true, detail: "formsubmit" };
    }

    if (body?.message && /activate|confirm|check your email/i.test(body.message)) {
      // First-time FormSubmit setup: activation mail is sent to notify inbox.
      console.warn("[waitlist] FormSubmit activation email sent to", notify);
      return { ok: true, detail: "formsubmit_activation" };
    }

    console.error("[waitlist] formsubmit failed", response.status, body);
    return { ok: false, detail: `formsubmit_${response.status}` };
  } catch (error) {
    console.error("[waitlist] formsubmit error", error);
    return { ok: false, detail: "formsubmit_error" };
  }
}

export const Route = createFileRoute("/api/waitlist")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        let body: WaitlistBody;
        try {
          body = (await request.json()) as WaitlistBody;
        } catch {
          return json({ ok: false, error: "Invalid request." }, 400);
        }

        const email = String(body.email ?? "")
          .trim()
          .toLowerCase();
        const source =
          String(body.source ?? "marketing_modal")
            .trim()
            .slice(0, 100) || "marketing_modal";

        if (!email || email.length > 255 || !EMAIL_RE.test(email)) {
          return json({ ok: false, error: "Please enter a valid email address." }, 400);
        }

        console.info(
          "[waitlist] signup",
          JSON.stringify({ email, source, at: new Date().toISOString() }),
        );

        const delivered = await deliverViaFormSubmit(email, source, request.url);
        if (delivered.ok) {
          return json({ ok: true, stored: delivered.detail });
        }

        // Always accept after logging so the form never hard-fails while storage is being activated.
        return json({ ok: true, stored: "log" });
      },
    },
  },
});
