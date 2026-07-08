import { usePrivy } from "@privy-io/expo";
import { useEffect, useState } from "react";
import type { AuthSyncResponse } from "@/services/api/authSync";
import { getMe, meResponseToAuthSync } from "@/services/api/me";

type SessionRestoreState = {
  isBootstrapping: boolean;
  authSync: AuthSyncResponse | null;
  setAuthSync: (value: AuthSyncResponse | null) => void;
  sessionRestored: boolean;
  clearAuthenticatedSession: () => void;
};

export function useSessionRestore(): SessionRestoreState {
  const { user, isReady, getAccessToken } = usePrivy();
  const [isBootstrapping, setIsBootstrapping] = useState(true);
  const [authSync, setAuthSync] = useState<AuthSyncResponse | null>(null);
  const [sessionRestored, setSessionRestored] = useState(false);

  useEffect(() => {
    if (!isReady) {
      return;
    }

    let cancelled = false;

    async function restoreSession() {
      if (!user) {
        if (!cancelled) {
          setIsBootstrapping(false);
        }
        return;
      }

      try {
        const accessToken = await getAccessToken();

        if (!accessToken) {
          if (!cancelled) {
            setIsBootstrapping(false);
          }
          return;
        }

        const me = await getMe(accessToken);

        if (!cancelled) {
          setAuthSync(meResponseToAuthSync(me));
          setSessionRestored(true);
          setIsBootstrapping(false);
        }
      } catch {
        if (!cancelled) {
          setIsBootstrapping(false);
        }
      }
    }

    void restoreSession();

    return () => {
      cancelled = true;
    };
  }, [getAccessToken, isReady, user]);

  return {
    isBootstrapping,
    authSync,
    setAuthSync,
    sessionRestored,
    clearAuthenticatedSession: () => {
      setAuthSync(null);
      setSessionRestored(false);
    },
  };
}
