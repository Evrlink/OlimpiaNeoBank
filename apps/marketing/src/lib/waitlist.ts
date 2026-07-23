const DEFAULT_SOURCE = "marketing_modal";
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
/** Must match the FormSubmit destination used by /api/waitlist (founder inbox). */
const CLIENT_NOTIFY_FALLBACK = "alexandretamara@gmail.com";

export type WaitlistSubmitResult = { ok: true } | { ok: false; error: string };

async function postJson(url: string, payload: unknown) {
  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify(payload),
  });
  const text = await response.text();
  let data: { ok?: boolean; error?: string; success?: string | boolean; message?: string } | null =
    null;
  try {
    data = JSON.parse(text) as typeof data;
  } catch {
    data = null;
  }
  return { response, text, data };
}

async function submitViaApi(email: string, source: string): Promise<boolean> {
  try {
    const endpoint =
      typeof window !== "undefined"
        ? new URL("/api/waitlist", window.location.origin).toString()
        : "/api/waitlist";
    const { response, data } = await postJson(endpoint, { email, source });
    return Boolean(response.ok && data?.ok);
  } catch (error) {
    console.error("[waitlist] api submit failed", error);
    return false;
  }
}

async function submitViaFormSubmit(email: string, source: string): Promise<boolean> {
  const notify =
    (import.meta.env.VITE_WAITLIST_NOTIFY_EMAIL as string | undefined)?.trim() ||
    CLIENT_NOTIFY_FALLBACK;

  try {
    const { response, data } = await postJson(
      `https://formsubmit.co/ajax/${encodeURIComponent(notify)}`,
      {
        email,
        source,
        message: `New Olimpia waitlist signup: ${email}`,
        _replyto: email,
        _subject: `Olimpia waitlist: ${email}`,
        _template: "table",
        _captcha: "false",
      },
    );

    if (response.ok && (data?.success === true || data?.success === "true")) {
      return true;
    }
    if (data?.message && /activate|confirm|check your email/i.test(data.message)) {
      return true;
    }
    console.error("[waitlist] client formsubmit failed", response.status, data);
    return false;
  } catch (error) {
    console.error("[waitlist] client formsubmit error", error);
    return false;
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

  // Prefer same-origin API, then browser FormSubmit (works even if API path is cached oddly).
  if (await submitViaApi(trimmed, normalizedSource)) {
    return { ok: true };
  }
  if (await submitViaFormSubmit(trimmed, normalizedSource)) {
    return { ok: true };
  }

  return {
    ok: false,
    error: "Something went wrong. Please try again.",
  };
}
