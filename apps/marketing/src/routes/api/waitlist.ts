import { createFileRoute } from "@tanstack/react-router";
import { createClient } from "@supabase/supabase-js";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const DEAD_SUPABASE_HOST = "ykyynwhkvxknqpzrptem.supabase.co";

type WaitlistBody = {
  email?: string;
  source?: string;
};

function json(data: unknown, status = 200) {
  return Response.json(data, { status });
}

async function trySupabaseInsert(email: string, source: string): Promise<boolean> {
  const url = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
  const key = process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY;
  if (!url || !key) return false;
  if (url.includes(DEAD_SUPABASE_HOST)) {
    console.warn("[waitlist] skipping unreachable Supabase project");
    return false;
  }

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 2500);
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

async function tryFormNotify(email: string, source: string, requestUrl: string): Promise<boolean> {
  const notify =
    process.env.WAITLIST_NOTIFY_EMAIL ||
    process.env.VITE_WAITLIST_NOTIFY_EMAIL ||
    process.env.VITE_SUPPORT_EMAIL ||
    "hello@olimpia.app";

  const origin = (() => {
    try {
      return new URL(requestUrl).origin;
    } catch {
      return process.env.VITE_SITE_URL || "https://olimpianeobank.app";
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
        email,
        source,
        _subject: "Olimpia waitlist signup",
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
    if (body?.message && /confirm|activate|check your email/i.test(body.message)) {
      console.warn("[waitlist] formsubmit activation required for", notify);
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

        // Always keep a server log so signups are recoverable from Vercel logs.
        console.info("[waitlist] signup", JSON.stringify({ email, source, at: new Date().toISOString() }));

        if (await trySupabaseInsert(email, source)) {
          return json({ ok: true });
        }

        if (await tryFormNotify(email, source, request.url)) {
          return json({ ok: true });
        }

        // Last-resort: still accept the signup after logging so the product isn't blocked
        // by a dead Supabase project / unactivated FormSubmit inbox.
        return json({ ok: true, stored: "log" });
      },
    },
  },
});
