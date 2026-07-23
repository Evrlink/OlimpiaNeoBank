const DEFAULT_SOURCE = "marketing_modal";
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export type WaitlistSubmitResult = { ok: true } | { ok: false; error: string };

export async function submitWaitlistEmail(
  email: string,
  source: string = DEFAULT_SOURCE,
): Promise<WaitlistSubmitResult> {
  const trimmed = email.trim().toLowerCase();
  const normalizedSource = (source.trim() || DEFAULT_SOURCE).slice(0, 100);

  if (!trimmed || trimmed.length > 255 || !EMAIL_RE.test(trimmed)) {
    return { ok: false, error: "Please enter a valid email address." };
  }

  try {
    const response = await fetch("/api/waitlist", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify({ email: trimmed, source: normalizedSource }),
    });

    const data = (await response.json().catch(() => null)) as {
      ok?: boolean;
      error?: string;
    } | null;

    if (response.ok && data?.ok) {
      return { ok: true };
    }

    return {
      ok: false,
      error: data?.error || "Something went wrong. Please try again.",
    };
  } catch (error) {
    console.error("[waitlist] submit failed", error);
    return {
      ok: false,
      error: "Something went wrong. Please try again.",
    };
  }
}
