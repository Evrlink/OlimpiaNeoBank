import { getSupabase } from "@/lib/supabase";
import { SUPPORT_EMAIL } from "@/lib/seo";

const DEFAULT_SOURCE = "marketing_modal";
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export type WaitlistSubmitResult = { ok: true } | { ok: false; error: string };

async function insertViaSupabase(
  email: string,
  source: string,
): Promise<"ok" | "skip" | "fail"> {
  const supabase = getSupabase();
  if (!supabase) return "skip";

  const { error } = await supabase.from("waitlist_emails").insert({ email, source });
  if (!error || error.code === "23505") return "ok";

  console.error("[waitlist] supabase insert failed", error.code, error.message);
  return "fail";
}

async function insertViaFormNotify(
  email: string,
  source: string,
): Promise<"ok" | "fail"> {
  const notify =
    (import.meta.env.VITE_WAITLIST_NOTIFY_EMAIL as string | undefined)?.trim() ||
    SUPPORT_EMAIL;

  try {
    const response = await fetch(
      `https://formsubmit.co/ajax/${encodeURIComponent(notify)}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify({
          email,
          source,
          _subject: "Olimpia waitlist signup",
          _template: "table",
          _captcha: "false",
        }),
      },
    );

    const body = (await response.json().catch(() => null)) as {
      success?: string | boolean;
      message?: string;
    } | null;

    if (response.ok && (body?.success === true || body?.success === "true")) {
      return "ok";
    }

    // First-time FormSubmit activation emails the inbox owner to confirm.
    if (body?.message && /confirm|activate|check your email/i.test(body.message)) {
      return "ok";
    }

    console.error("[waitlist] form notify failed", response.status, body);
    return "fail";
  } catch (error) {
    console.error("[waitlist] form notify error", error);
    return "fail";
  }
}

export async function submitWaitlistEmail(
  email: string,
  source: string = DEFAULT_SOURCE,
): Promise<WaitlistSubmitResult> {
  const trimmed = email.trim().toLowerCase();
  const normalizedSource = (source.trim() || DEFAULT_SOURCE).slice(0, 100);

  if (!trimmed || trimmed.length > 255 || !EMAIL_RE.test(trimmed)) {
    return { ok: false, error: "Please enter a valid email address." };
  }

  const supabaseResult = await insertViaSupabase(trimmed, normalizedSource);
  if (supabaseResult === "ok") {
    return { ok: true };
  }

  // Supabase may be missing or misconfigured in production — still capture the lead.
  const notifyResult = await insertViaFormNotify(trimmed, normalizedSource);
  if (notifyResult === "ok") {
    return { ok: true };
  }

  return {
    ok: false,
    error: "Something went wrong. Please try again.",
  };
}
