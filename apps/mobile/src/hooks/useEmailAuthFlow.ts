import { useEmbeddedEthereumWallet, useLoginWithEmail, usePrivy } from "@privy-io/expo";
import { useCallback, useEffect, useState } from "react";
import type { AuthMode, AuthSuccessPayload } from "@/screens/AuthScreen";
import { syncAccount } from "@/services/api/authSync";
import {
  getAuthErrorMessage,
  getSyncErrorMessage,
  hasEmbeddedEthereumWallet,
  isValidEmail,
} from "@/utils/auth";

export type AuthFlowStep = "email" | "otp" | "loading";

const emptyOtpDigits = () => Array.from({ length: 6 }, () => "");

type UseEmailAuthFlowResult = {
  step: AuthFlowStep;
  email: string;
  setEmail: (value: string) => void;
  otpDigits: string[];
  updateOtpDigit: (index: number, digit: string) => void;
  inlineError: string | null;
  resendSeconds: number;
  isSendingCode: boolean;
  isSubmittingCode: boolean;
  submitEmail: () => Promise<void>;
  submitOtp: () => Promise<void>;
  resendCode: () => Promise<void>;
  resetToEmail: () => void;
};

export function useEmailAuthFlow(
  authMode: AuthMode,
  onSuccess: (payload: AuthSuccessPayload) => void,
): UseEmailAuthFlowResult {
  const [step, setStep] = useState<AuthFlowStep>("email");
  const [email, setEmail] = useState("");
  const [otpDigits, setOtpDigits] = useState<string[]>(emptyOtpDigits);
  const [inlineError, setInlineError] = useState<string | null>(null);
  const [resendSeconds, setResendSeconds] = useState(0);

  const { getAccessToken } = usePrivy();
  const { sendCode, loginWithCode, state } = useLoginWithEmail({
    onError: (error) => {
      setInlineError(getAuthErrorMessage(error));
      setStep((current) => (current === "loading" ? "otp" : current));
    },
  });
  const { create } = useEmbeddedEthereumWallet();

  useEffect(() => {
    if (step !== "otp" || resendSeconds <= 0) {
      return;
    }

    const timer = setInterval(() => {
      setResendSeconds((seconds) => Math.max(0, seconds - 1));
    }, 1000);

    return () => clearInterval(timer);
  }, [step, resendSeconds]);

  const normalizedEmail = email.trim();
  const otpCode = otpDigits.join("");

  const clearOtpDigits = useCallback(() => {
    setOtpDigits(emptyOtpDigits());
  }, []);

  const updateOtpDigit = useCallback((index: number, digit: string) => {
    setOtpDigits((current) => {
      const next = [...current];
      next[index] = digit;
      return next;
    });
    setInlineError(null);
  }, []);

  const submitEmail = useCallback(async () => {
    if (!isValidEmail(normalizedEmail)) {
      setInlineError("Enter a valid email address.");
      return;
    }

    setInlineError(null);
    clearOtpDigits();

    try {
      await sendCode({ email: normalizedEmail });
      setResendSeconds(45);
      setStep("otp");
    } catch (error) {
      setInlineError(getAuthErrorMessage(error));
    }
  }, [clearOtpDigits, normalizedEmail, sendCode]);

  const submitOtp = useCallback(async () => {
    if (otpCode.trim().length < 6) {
      setInlineError("Enter the 6-digit code we sent to your email.");
      return;
    }

    setInlineError(null);
    setStep("loading");

    try {
      const user = await loginWithCode({
        code: otpCode.trim(),
        email: normalizedEmail,
        ...(authMode === "signin" ? { disableSignup: true } : {}),
      });

      if (!user) {
        setStep("otp");
        setInlineError("That code didn't match. Check and try again.");
        return;
      }

      if (!hasEmbeddedEthereumWallet(user)) {
        await create();
      }

      const accessToken = await getAccessToken();

      if (!accessToken) {
        setStep("otp");
        setInlineError("Your session expired. Please verify your email again.");
        return;
      }

      const syncResult = await syncAccount(accessToken);
      const destination =
        syncResult.isNewUser && authMode === "signup" ? "youre-in" : "home";

      onSuccess({ destination, syncResult });
    } catch (error) {
      setStep("otp");
      setInlineError(getSyncErrorMessage(error));
    }
  }, [
    authMode,
    create,
    getAccessToken,
    loginWithCode,
    normalizedEmail,
    onSuccess,
    otpCode,
  ]);

  const resendCode = useCallback(async () => {
    if (resendSeconds > 0 || !isValidEmail(normalizedEmail)) {
      return;
    }

    setInlineError(null);

    try {
      await sendCode({ email: normalizedEmail });
      setResendSeconds(45);
      clearOtpDigits();
    } catch (error) {
      setInlineError(getAuthErrorMessage(error));
    }
  }, [clearOtpDigits, normalizedEmail, resendSeconds, sendCode]);

  const resetToEmail = useCallback(() => {
    setStep("email");
    clearOtpDigits();
    setInlineError(null);
    setResendSeconds(0);
  }, [clearOtpDigits]);

  return {
    step,
    email,
    setEmail,
    otpDigits,
    updateOtpDigit,
    inlineError,
    resendSeconds,
    isSendingCode: state.status === "sending-code",
    isSubmittingCode: state.status === "submitting-code",
    submitEmail,
    submitOtp,
    resendCode,
    resetToEmail,
  };
}
