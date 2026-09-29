import { useEmbeddedEthereumWallet, useLoginWithEmail, usePrivy } from "@privy-io/expo";
import { useCallback, useEffect, useRef, useState } from "react";
import type { AuthMode, AuthSuccessPayload } from "@/screens/AuthScreen";
import { syncAccount } from "@/services/api/authSync";
import {
  getAuthErrorMessage,
  getEmbeddedEthereumAddress,
  getLoginSetupErrorMessage,
  hasPrivyEmbeddedEthereumWallet,
  isAlreadyLoggedInError,
  isExistingEmbeddedWalletError,
  isValidEmail,
} from "@/utils/auth";
import { waitForLinkedSmartWallet } from "@/utils/smartWallet";

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

  const { getAccessToken, user } = usePrivy();
  const userRef = useRef(user);
  userRef.current = user;
  const { sendCode, loginWithCode, state } = useLoginWithEmail({
    onError: (error) => {
      if (isAlreadyLoggedInError(error)) {
        return;
      }

      setInlineError(getAuthErrorMessage(error));
      setStep((current) => (current === "loading" ? "otp" : current));
    },
  });
  const { create, wallets } = useEmbeddedEthereumWallet();
  const walletsRef = useRef(wallets);
  walletsRef.current = wallets;

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

  const hasExistingEmbeddedWallet = useCallback((loginUser: unknown) => {
    return (
      walletsRef.current.length > 0 ||
      hasPrivyEmbeddedEthereumWallet(loginUser) ||
      hasPrivyEmbeddedEthereumWallet(userRef.current)
    );
  }, []);

  const waitForExistingEmbeddedWallet = useCallback(
    async (loginUser: unknown) => {
      if (hasExistingEmbeddedWallet(loginUser)) {
        return true;
      }

      const started = Date.now();
      while (Date.now() - started <= 1500) {
        await new Promise((resolve) => setTimeout(resolve, 100));
        if (hasExistingEmbeddedWallet(loginUser)) {
          return true;
        }
      }

      return hasExistingEmbeddedWallet(loginUser);
    },
    [hasExistingEmbeddedWallet],
  );

  const continueAuthenticatedSession = useCallback(
    async (sessionUser?: { linked_accounts?: readonly unknown[] } | null) => {
      const resolvedUser = sessionUser ?? userRef.current;

      if (!(await waitForExistingEmbeddedWallet(resolvedUser))) {
        try {
          await create();
        } catch (error) {
          if (!isExistingEmbeddedWalletError(error)) {
            throw error;
          }
        }
      }

      const embeddedAddress =
        getEmbeddedEthereumAddress(userRef.current) ??
        getEmbeddedEthereumAddress(resolvedUser as never) ??
        "";
      if (embeddedAddress) {
        await waitForLinkedSmartWallet({
          getLinkedAccounts: () =>
            userRef.current?.linked_accounts ?? resolvedUser?.linked_accounts,
          embeddedAddress,
        });
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
    },
    [authMode, create, getAccessToken, onSuccess, waitForExistingEmbeddedWallet],
  );

  const updateOtpDigit = useCallback((index: number, digit: string) => {
    setOtpDigits((current) => {
      const next = [...current];
      next[index] = digit;
      return next;
    });
    setInlineError(null);
  }, []);

  const submitEmail = useCallback(async () => {
    if (userRef.current) {
      setInlineError(null);
      setStep("loading");

      try {
        await continueAuthenticatedSession(userRef.current);
      } catch (error) {
        setStep("email");
        setInlineError(getLoginSetupErrorMessage(error));
      }
      return;
    }

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
      if (isAlreadyLoggedInError(error)) {
        setStep("loading");
        try {
          await continueAuthenticatedSession(userRef.current);
        } catch (resumeError) {
          setStep("email");
          setInlineError(getLoginSetupErrorMessage(resumeError));
        }
        return;
      }

      setInlineError(getAuthErrorMessage(error));
    }
  }, [clearOtpDigits, continueAuthenticatedSession, normalizedEmail, sendCode]);

  const submitOtp = useCallback(async () => {
    const existingUser = userRef.current;

    if (existingUser) {
      setInlineError(null);
      setStep("loading");

      try {
        await continueAuthenticatedSession(existingUser);
      } catch (error) {
        setStep("otp");
        setInlineError(getLoginSetupErrorMessage(error));
      }
      return;
    }

    if (otpCode.trim().length < 6) {
      setInlineError("Enter the 6-digit code we sent to your email.");
      return;
    }

    setInlineError(null);
    setStep("loading");

    try {
      let sessionUser;

      try {
        sessionUser = await loginWithCode({
          code: otpCode.trim(),
          email: normalizedEmail,
          ...(authMode === "signin" ? { disableSignup: true } : {}),
        });
      } catch (error) {
        if (!isAlreadyLoggedInError(error)) {
          throw error;
        }

        const started = Date.now();
        while (!userRef.current && Date.now() - started <= 1500) {
          await new Promise((resolve) => setTimeout(resolve, 100));
        }

        sessionUser = userRef.current;
      }

      if (!sessionUser) {
        setStep("otp");
        setInlineError("That code didn't match. Check and try again.");
        return;
      }

      await continueAuthenticatedSession(sessionUser);
    } catch (error) {
      setStep("otp");
      setInlineError(getLoginSetupErrorMessage(error));
    }
  }, [
    authMode,
    continueAuthenticatedSession,
    loginWithCode,
    normalizedEmail,
    otpCode,
  ]);

  const resendCode = useCallback(async () => {
    if (userRef.current) {
      setInlineError(null);
      setStep("loading");

      try {
        await continueAuthenticatedSession(userRef.current);
      } catch (error) {
        setStep("otp");
        setInlineError(getLoginSetupErrorMessage(error));
      }
      return;
    }

    if (resendSeconds > 0 || !isValidEmail(normalizedEmail)) {
      return;
    }

    setInlineError(null);

    try {
      await sendCode({ email: normalizedEmail });
      setResendSeconds(45);
      clearOtpDigits();
    } catch (error) {
      if (isAlreadyLoggedInError(error)) {
        setStep("loading");
        try {
          await continueAuthenticatedSession(userRef.current);
        } catch (resumeError) {
          setStep("otp");
          setInlineError(getLoginSetupErrorMessage(resumeError));
        }
        return;
      }

      setInlineError(getAuthErrorMessage(error));
    }
  }, [
    clearOtpDigits,
    continueAuthenticatedSession,
    normalizedEmail,
    resendSeconds,
    sendCode,
  ]);

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
