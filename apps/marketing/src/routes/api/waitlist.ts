import { createFileRoute } from "@tanstack/react-router";
import { createClient } from "@supabase/supabase-js";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const DEFAULT_NOTIFY_EMAIL = "alexandretamara@gmail.com";

type WaitlistBody = {
  email?: string;
  source?: string;
};

function json(data: unknown, status = 200) {
  return Response.json(data, { status });
}

async function insertViaSupabase(email: string, source: string): Promise<boolean> {
  const url = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
  const key = process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY;
  if (!url || !key) {
    console.warn("[waitlist] supabase env missing");
    return false;
  }

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 8000);
  try {
    const supabase = createClient(url, key, {
      global: {
        fetch: (input, init) => fetch(input, { ...init, signal: controller.signal }),
      },
    });
    const { error } = await supabase.from("waitlist_emails").insert({ email, source });
    if (!error || error.code === "23505") return true;
    console.error("[waitlist] supabase insert failed", error.code, error.message);
    return false;
  } catch (error) {
    console.error("[waitlist] supabase unreachable", error);
    return false;
  } finally {
    clearTimeout(timer);
  }
}

async function deliverViaFormSubmit(
  signupEmail: string,
  source: string,
  requestUrl: string,
): Promise<boolean> {
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
      return true;
    }
    if (body?.message && /activate|confirm|check your email/i.test(body.message)) {
      console.warn("[waitlist] FormSubmit activation email sent to", notify);
      return true;
    }
    console.error("[waitlist] formsubmit failed", response.status, body);
    return false;
  } catch (error) {
    console.error("[waitlist] formsubmit error", error);
    return false;
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

        if (await insertViaSupabase(email, source)) {
          return json({ ok: true, stored: "supabase" });
        }

        if (await deliverViaFormSubmit(email, source, request.url)) {
          return json({ ok: true, stored: "formsubmit" });
        }

        return json({ ok: false, error: "Something went wrong. Please try again." }, 502);
      },
    },
  },
});
