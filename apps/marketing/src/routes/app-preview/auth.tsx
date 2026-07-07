import { createFileRoute, Link } from "@tanstack/react-router";
import { AppPreviewShell } from "@/components/app-preview/app-preview-shell";
import { AuthScreen } from "@/components/app-preview/auth-screen";
import { PhoneFrame } from "@/components/app-preview/phone-frame";
import { cn } from "@/lib/utils";

type AuthSearch = {
  mode?: "signup" | "signin";
  step?: "entry" | "otp" | "loading" | "error";
};

const authStates = [
  { id: "entry", label: "Email entry", step: "entry" as const },
  { id: "otp", label: "OTP", step: "otp" as const },
  { id: "loading", label: "Loading", step: "loading" as const },
  { id: "error", label: "Error", step: "error" as const },
] as const;

export const Route = createFileRoute("/app-preview/auth")({
  validateSearch: (search: Record<string, unknown>): AuthSearch => {
    const step = search.step;
    return {
      mode: search.mode === "signin" ? "signin" : "signup",
      step:
        step === "otp" || step === "loading" || step === "error"
          ? step
          : "entry",
    };
  },
  head: () => ({
    meta: [{ title: "App Preview · Auth · Olimpia" }],
  }),
  component: AuthPreviewPage,
});

function AuthPreviewPage() {
  const { mode, step } = Route.useSearch();
  const resolvedStep = step === "error" ? "entry" : step ?? "entry";

  return (
    <AppPreviewShell
      title="Auth (A2)"
      description="Sign up / sign in — matches auth mock. Use the state pills to preview each step, or walk through the flow interactively."
      active="auth"
    >
      <div className="flex w-full max-w-[390px] flex-col items-center gap-4">
        <nav
          className="flex w-full flex-wrap justify-center gap-2"
          aria-label="Auth preview states"
        >
          {authStates.map(({ id, label, step: stateStep }) => (
            <Link
              key={id}
              to="/app-preview/auth"
              search={{
                mode,
                step: stateStep,
              }}
              className={cn(
                "rounded-full px-3 py-1.5 text-[0.8125rem] font-semibold transition",
                step === stateStep
                  ? "bg-raspberry text-white"
                  : "bg-card text-foreground ring-1 ring-border hover:bg-background",
              )}
            >
              {label}
            </Link>
          ))}
        </nav>

        <PhoneFrame>
          <AuthScreen
            key={`${mode}-${step ?? "entry"}`}
            initialMode={mode}
            initialStep={resolvedStep}
            initialError={step === "error"}
            previewMode={(step ?? "entry") !== "entry"}
          />
        </PhoneFrame>
      </div>
    </AppPreviewShell>
  );
}
