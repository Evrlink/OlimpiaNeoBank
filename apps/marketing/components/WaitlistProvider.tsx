"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";

type WaitlistContextValue = {
  isOpen: boolean;
  openWaitlist: () => void;
  closeWaitlist: () => void;
};

const WaitlistContext = createContext<WaitlistContextValue | null>(null);

export function WaitlistProvider({ children }: { children: ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);

  const openWaitlist = useCallback(() => setIsOpen(true), []);
  const closeWaitlist = useCallback(() => setIsOpen(false), []);

  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") closeWaitlist();
    };
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", onKey);
    };
  }, [isOpen, closeWaitlist]);

  return (
    <WaitlistContext.Provider value={{ isOpen, openWaitlist, closeWaitlist }}>
      {children}
      {isOpen && <WaitlistModal onClose={closeWaitlist} />}
    </WaitlistContext.Provider>
  );
}

export function useWaitlist() {
  const ctx = useContext(WaitlistContext);
  if (!ctx) throw new Error("useWaitlist must be used within WaitlistProvider");
  return ctx;
}

function WaitlistModal({ onClose }: { onClose: () => void }) {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">(
    "idle"
  );
  const [errorMsg, setErrorMsg] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setErrorMsg("Please enter a valid email address.");
      setStatus("error");
      return;
    }

    setStatus("loading");
    setErrorMsg("");

    const apiUrl = process.env.NEXT_PUBLIC_API_URL;
    try {
      if (apiUrl) {
        const res = await fetch(`${apiUrl}/api/v1/waitlist`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email: email.trim() }),
        });
        if (!res.ok) throw new Error("Request failed");
      } else {
        await new Promise((r) => setTimeout(r, 600));
        if (typeof window !== "undefined") {
          const key = "olimpia_waitlist";
          const existing = JSON.parse(localStorage.getItem(key) || "[]");
          existing.push({ email: email.trim(), at: new Date().toISOString() });
          localStorage.setItem(key, JSON.stringify(existing));
        }
      }
      setStatus("success");
    } catch {
      setErrorMsg("Something went wrong. Please try again or email hello@olimpia.app.");
      setStatus("error");
    }
  }

  return (
    <div
      className="modal-overlay"
      role="presentation"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div
        className="modal"
        role="dialog"
        aria-labelledby="waitlist-title"
        aria-modal="true"
      >
        <button
          type="button"
          className="modal-close"
          onClick={onClose}
          aria-label="Close waitlist dialog"
        >
          ×
        </button>

        {status === "success" ? (
          <div className="modal-success">
            <h2 id="waitlist-title">You&apos;re on the list!</h2>
            <p>
              We&apos;ll email you at <strong>{email}</strong> the moment
              Olimpia is live.
            </p>
            <button type="button" className="btn btn-primary" onClick={onClose}>
              Close
            </button>
          </div>
        ) : (
          <>
            <h2 id="waitlist-title">Get the Olimpia App</h2>
            <p className="modal-body">
              The app is launching soon. Join the waitlist and we&apos;ll email
              you the moment it&apos;s live.
            </p>
            <form onSubmit={handleSubmit} className="modal-form">
              <label htmlFor="waitlist-email" className="sr-only">
                Email address
              </label>
              <input
                id="waitlist-email"
                type="email"
                name="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoComplete="email"
                required
                disabled={status === "loading"}
              />
              {status === "error" && errorMsg && (
                <p className="modal-error" role="alert">
                  {errorMsg}
                </p>
              )}
              <button
                type="submit"
                className="btn btn-primary modal-submit"
                disabled={status === "loading"}
              >
                {status === "loading" ? "Joining…" : "Join waitlist"}
              </button>
            </form>
            <p className="modal-stores">
              <span className="stores-badge">App Store & Google Play — coming soon</span>
            </p>
          </>
        )}
      </div>
    </div>
  );
}
