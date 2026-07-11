import { AlertCircle, ArrowLeft, Mail, Phone, ShieldCheck } from "lucide-react";
import { Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState } from "react";
import { cn } from "@/lib/utils";
import { AppPreviewTopBar } from "./app-preview-wordmark";

type AuthMode = "signup" | "signin";
type AuthStep = "entry" | "otp" | "loading";
type InputMethod = "email" | "phone";

type AuthScreenProps = {
  initialMode?: AuthMode;
  initialStep?: AuthStep;
  initialError?: boolean;
  previewMode?: boolean;
};

const authSparkles = [
  { top: "8%", left: "72%" },
  { top: "14%", left: "84%" },
  { top: "18%", left: "62%" },
  { top: "11%", left: "90%" },
];

function AppleLogo({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 16 18" className={className} aria-hidden>
      <path
        fill="currentColor"
        d="M12.58 9.54c-.02-2.17 1.77-3.21 1.85-3.26-1.01-1.47-2.58-1.67-3.14-1.69-1.34-.14-2.61.79-3.29.79-.69 0-1.75-.77-2.88-.75-1.48.02-2.85.86-3.61 2.19-1.54 2.67-.39 6.62 1.11 8.79.73 1.06 1.6 2.25 2.74 2.21 1.1-.04 1.52-.71 2.85-.71 1.33 0 1.7.71 2.86.69 1.18-.02 1.93-1.08 2.65-2.15.84-1.22 1.18-2.4 1.2-2.46-.03-.01-2.31-.89-2.33-3.51ZM10.24 2.92c.6-.73 1.01-1.74.9-2.75-.87.04-1.93.58-2.56 1.31-.56.64-1.05 1.67-.92 2.65.97.08 1.97-.49 2.58-1.21Z"
      />
    </svg>
  );
}

function isValidEmail(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());
}

function GoogleLogo({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 18 18" className={className} aria-hidden>
      <path
        fill="#4285F4"
        d="M17.64 9.2c0-.74-.06-1.28-.19-1.84H9v3.34h4.84a4.14 4.14 0 0 1-1.8 2.71v2.26h2.92a8.78 8.78 0 0 0 2.68-6.47Z"
      />
      <path
        fill="#34A853"
        d="M9 18c2.43 0 4.47-.8 5.96-2.18l-2.92-2.26c-.8.54-1.84.86-3.04.86-2.34 0-4.32-1.58-5.03-3.71H.96v2.33A9 9 0 0 0 9 18Z"
      />
      <path
        fill="#FBBC05"
        d="M3.97 10.71A5.41 5.41 0 0 1 3.68 9c0-.59.1-1.16.27-1.71V4.96H.96A9 9 0 0 0 0 9c0 1.45.35 2.82.96 4.04l3.01-2.33Z"
      />
      <path
        fill="#EA4335"
        d="M9 3.58c1.32 0 2.23.57 2.74 1.04l2-1.95A8.86 8.86 0 0 0 9 0 9 9 0 0 0 .96 4.96l3.01 2.33C4.68 5.16 6.66 3.58 9 3.58Z"
      />
    </svg>
  );
}

function OAuthButton({
  provider,
  onClick,
}: {
  provider: "apple" | "google";
  onClick: () => void;
}) {
  const label = provider === "apple" ? "Apple" : "Google";

  return (
    <button type="button" onClick={onClick} className="auth-oauth-btn">
      {provider === "apple" ? (
        <AppleLogo className="h-[1.125rem] w-[1.125rem] shrink-0" />
      ) : (
        <GoogleLogo className="h-[1.125rem] w-[1.125rem] shrink-0" />
      )}
      <span className="auth-oauth-label">Continue with {label}</span>
    </button>
  );
}

export function AuthScreen({
  initialMode = "signup",
  initialStep = "entry",
  initialError = false,
  previewMode = false,
}: AuthScreenProps) {
  const navigate = useNavigate();
  const otpRefs = useRef<Array<HTMLInputElement | null>>([]);
  const [mode, setMode] = useState<AuthMode>(initialMode);
  const [step, setStep] = useState<AuthStep>(initialStep);
  const [inputMethod, setInputMethod] = useState<InputMethod>("email");
  const [value, setValue] = useState(() => {
    if (initialError) return "you@example";
    if (previewMode && initialStep === "otp") return "you@example.com";
    return "";
  });
  const [otpDigits, setOtpDigits] = useState<string[]>(() =>
    previewMode && initialStep === "otp"
      ? ["1", "2", "3", "4", "5", "6"]
      : ["", "", "", "", "", ""],
  );
  const [entryError, setEntryError] = useState(initialError);
  const [otpError, setOtpError] = useState(false);
  const [resendSeconds, setResendSeconds] = useState(45);

  const isSignIn = mode === "signin";
  const title = isSignIn ? "Welcome back" : "Create your account";
  const subtitle = isSignIn
    ? "Sign in to pick up where you left off."
    : "Sign up in minutes. Olimpia keeps the money tools simple behind the scenes.";
  const otpValue = useMemo(() => otpDigits.join(""), [otpDigits]);
  const displayEmail = value.trim() || "you@example.com";
  const isLoading = step === "loading";

  useEffect(() => {
    if (step !== "loading") return;
    // Static Loading pill (?step=loading) — show overlay only, no auto-advance.
    if (initialStep === "loading") return;

    const timer = window.setTimeout(() => {
      navigate({ to: isSignIn ? "/app-preview/home" : "/app-preview/youre-in" });
    }, 1800);
    return () => window.clearTimeout(timer);
  }, [step, navigate, isSignIn, initialStep]);

  useEffect(() => {
    if (previewMode || step !== "otp" || resendSeconds <= 0) return;
    const timer = window.setInterval(() => {
      setResendSeconds((seconds) => Math.max(0, seconds - 1));
    }, 1000);
    return () => window.clearInterval(timer);
  }, [step, resendSeconds, previewMode]);

  const resendDisplay = previewMode ? 45 : resendSeconds;

  function startLoading() {
    setStep("loading");
  }

  function handleContinue() {
    if (inputMethod === "phone") {
      if (!value.trim()) {
        setEntryError(true);
        return;
      }
    } else if (!isValidEmail(value)) {
      setEntryError(true);
      return;
    }
    setEntryError(false);
    setOtpDigits(["", "", "", "", "", ""]);
    setOtpError(false);
    setResendSeconds(45);
    setStep("otp");
  }

  function handleVerify() {
    if (otpValue.length < 6) {
      setOtpError(true);
      return;
    }
    setOtpError(false);
    startLoading();
  }

  function updateOtpDigit(index: number, digit: string) {
    const next = [...otpDigits];
    next[index] = digit;
    setOtpDigits(next);
    if (otpError) setOtpError(false);
    if (digit && index < 5) otpRefs.current[index + 1]?.focus();
  }

  function switchToPhone() {
    setInputMethod("phone");
    setValue("");
    setEntryError(false);
  }

  function switchToEmail() {
    setInputMethod("email");
    setValue("");
    setEntryError(false);
  }

  function toggleMode() {
    setMode(isSignIn ? "signup" : "signin");
    setStep("entry");
    setValue("");
    setOtpDigits(["", "", "", "", "", ""]);
    setEntryError(false);
    setOtpError(false);
    setInputMethod("email");
  }

  return (
    <div className="relative flex min-h-0 flex-1 flex-col overflow-hidden bg-background">
      <div className="auth-preview-glow" aria-hidden />
      {authSparkles.map((pos, index) => (
        <span
          key={index}
          className="auth-preview-sparkle"
          style={{ top: pos.top, left: pos.left }}
          aria-hidden
        />
      ))}

      <div
        className={cn(
          "relative z-[1] flex min-h-0 flex-1 flex-col px-6 pt-3",
          step === "otp" ? "pb-0" : "pb-3",
        )}
      >
        <div
          className={cn(
            "relative flex min-h-0 flex-1 flex-col",
            isLoading && "auth-preview-ghost",
          )}
        >
          <AppPreviewTopBar
            leftSlot={
              <Link
                to="/app-preview/welcome"
                className="flex h-10 w-10 items-center justify-center rounded-full text-foreground transition hover:bg-surface/80"
                aria-label="Back to Welcome"
              >
                <ArrowLeft className="h-5 w-5" strokeWidth={2} aria-hidden />
              </Link>
            }
          />

          {step === "otp" ? (
            <div className="auth-otp-screen">
              <div className="auth-otp-body mt-5">
                <h1 className="text-h2 font-semibold text-foreground whitespace-nowrap">
                  Verify your email
                </h1>
                <p className="auth-otp-copy">We sent a 6-digit code to</p>
                <p className="auth-otp-email">{displayEmail}</p>

                <div className="auth-otp-grid">
                    {otpDigits.map((digit, index) => (
                      <input
                        key={index}
                        ref={(element) => {
                          otpRefs.current[index] = element;
                        }}
                        type="text"
                        inputMode="numeric"
                        maxLength={1}
                        value={digit}
                        readOnly={previewMode}
                        onChange={(event) =>
                          updateOtpDigit(index, event.target.value.replace(/\D/g, "").slice(-1))
                        }
                        onKeyDown={(event) => {
                          if (event.key === "Backspace" && !otpDigits[index] && index > 0) {
                            otpRefs.current[index - 1]?.focus();
                          }
                        }}
                        className={cn("auth-otp-cell", otpError && "is-error")}
                      />
                    ))}
                  </div>

                  {otpError ? (
                    <p className="mt-2 text-body-sm text-raspberry" role="alert">
                      That code didn&apos;t match. Check and try again.
                    </p>
                  ) : null}

                  <p className="auth-resend">
                    {resendDisplay > 0 ? (
                      <>
                        Resend code in{" "}
                        <span className="font-semibold">
                          00:{String(resendDisplay).padStart(2, "0")}
                        </span>
                      </>
                    ) : (
                      <button type="button" className="font-semibold">
                        Resend code
                      </button>
                    )}
                  </p>

                  <button
                    type="button"
                    onClick={handleVerify}
                    className="auth-primary-btn auth-otp-verify bg-raspberry transition hover:opacity-90"
                  >
                    Verify
                  </button>
                </div>
            </div>
          ) : (
            <div className="flex min-h-0 flex-1 flex-col">
              <div className="mt-5">
                <h1 className="text-h2 font-semibold text-foreground">
                  {title}
                </h1>
                <p className="mt-3 max-w-[20rem] text-body-sm text-ink-muted">
                  {subtitle}
                </p>
              </div>

              <div className="auth-card mt-6">
                <label htmlFor="auth-field" className="auth-field-label">
                  {inputMethod === "email" ? "Email address" : "Phone number"}
                </label>

                <div className="relative mt-1.5">
                  <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2">
                    {inputMethod === "email" ? (
                      <Mail
                        className={cn(
                          "h-[1.125rem] w-[1.125rem]",
                          entryError ? "text-raspberry/70" : "text-ink-muted/60",
                        )}
                        aria-hidden
                      />
                    ) : (
                      <Phone className="h-[1.125rem] w-[1.125rem] text-ink-muted/60" aria-hidden />
                    )}
                  </span>
                  <input
                    id="auth-field"
                    type={inputMethod === "email" ? "email" : "tel"}
                    autoComplete={inputMethod === "email" ? "email" : "tel"}
                    placeholder={inputMethod === "email" ? "you@example.com" : "(555) 555-0123"}
                    value={value}
                    onChange={(event) => {
                      setValue(event.target.value);
                      if (entryError) setEntryError(false);
                    }}
                    className={cn("auth-field-input", entryError && "is-error")}
                    readOnly={previewMode && entryError}
                  />
                  {entryError ? (
                    <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2">
                      <AlertCircle className="h-[1.125rem] w-[1.125rem] text-raspberry" aria-hidden />
                    </span>
                  ) : null}
                </div>

                {entryError ? (
                  <p className="mt-2 text-body-sm text-raspberry" role="alert">
                    {inputMethod === "email"
                      ? "Please enter a valid email address"
                      : "Please enter a valid phone number"}
                  </p>
                ) : null}

                <button
                  type="button"
                  onClick={inputMethod === "email" ? switchToPhone : switchToEmail}
                  className="mt-3 inline-flex items-center gap-1.5 text-body-sm font-semibold text-raspberry"
                >
                  <Phone className="h-3.5 w-3.5" strokeWidth={2} aria-hidden />
                  {inputMethod === "email" ? "Continue with phone" : "Continue with email"}
                </button>

                <button
                  type="button"
                  onClick={handleContinue}
                  disabled={entryError}
                  className={cn(
                    "auth-primary-btn mt-5 transition",
                    entryError
                      ? "cursor-not-allowed bg-raspberry/35"
                      : "bg-raspberry hover:opacity-90",
                  )}
                >
                  Continue
                </button>

                <div className="my-5 flex items-center gap-3">
                  <span className="h-px flex-1 bg-border/70" />
                  <span className="text-caption text-ink-muted">or</span>
                  <span className="h-px flex-1 bg-border/70" />
                </div>

                <div className="auth-oauth-row">
                  <OAuthButton provider="apple" onClick={startLoading} />
                  <OAuthButton provider="google" onClick={startLoading} />
                </div>

                <button
                  type="button"
                  onClick={toggleMode}
                  className="mt-5 w-full text-center text-body-sm text-ink-muted"
                >
                  {isSignIn ? (
                    <>
                      Don&apos;t have an account?{" "}
                      <span className="font-semibold text-raspberry">Sign up</span>
                    </>
                  ) : (
                    <>
                      Already have an account?{" "}
                      <span className="font-semibold text-raspberry">Sign in</span>
                    </>
                  )}
                </button>
              </div>

              <p className="mt-auto flex items-center justify-center gap-2 pt-5 text-center text-caption text-ink-muted">
                <ShieldCheck className="h-3.5 w-3.5 shrink-0 text-raspberry/80" aria-hidden />
                <span>Secure sign in. No seed phrases. No crypto setup.</span>
              </p>
            </div>
          )}
        </div>

        {isLoading ? (
          <div className="auth-loading-overlay" aria-live="polite">
            <div className="auth-loading-spinner" aria-hidden />
            <p className="mt-6 text-body font-medium text-foreground">
              Creating your account...
            </p>
            <p className="mt-1 text-body-sm text-ink-muted">
              This will only take a moment.
            </p>
          </div>
        ) : null}
      </div>
    </div>
  );
}
