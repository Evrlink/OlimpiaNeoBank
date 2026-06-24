import { getSupabase } from "@/lib/supabase";

const WAITLIST_SOURCE = "marketing_modal";

export async function submitWaitlistEmail(
  email: string,
): Promise<{ ok: true } | { ok: false; error: string }> {
  const supabase = getSupabase();
  if (!supabase) {
    return {
      ok: false,
      error: "Waitlist is unavailable right now. Please try again later.",
    };
  }

  const { error } = await supabase.from("waitlist_emails").insert({
    email: email.trim().toLowerCase(),
    source: WAITLIST_SOURCE,
  });

  if (!error) {
    return { ok: true };
  }

  if (error.code === "23505") {
    return { ok: true };
  }

  return {
    ok: false,
    error: "Something went wrong. Please try again.",
  };
}
