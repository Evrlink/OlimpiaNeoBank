/**
 * TEMPORARY Phase 4 visual review — marketing app-preview only.
 * Mirrors apps/mobile Add Money flow for browser review without Xcode.
 * Safe to delete with the /app-preview/add-money route.
 *
 * Uses shared preview-chrome for padding, cards, CTAs, and tab bar.
 */
import { ArrowLeft, Check, Clock, LoaderCircle, X } from "lucide-react";
import { AppPreviewTopBar } from "./app-preview-wordmark";
import {
  PreviewFlowShell,
  PreviewTabShell,
  previewAvatar,
  previewCard,
  previewCardElevated,
  previewIconCircle,
  previewPrimaryBtn,
} from "./preview-chrome";

export type AddMoneyPreviewState =
  | "amount"
  | "review"
  | "processing"
  | "success"
  | "failed"
  | "home-funded"
  | "home-earning";

type AddMoneyFlowScreenProps = {
  state: AddMoneyPreviewState;
};

const PREVIEW_AMOUNT = "25.00";

function statusCopy(state: "processing" | "success" | "failed"): {
  title: string;
  body: string;
} {
  switch (state) {
    case "processing":
      return {
        title: "Adding money to your account",
        body: "We're preparing your transfer. This usually takes a moment.",
      };
    case "success":
      return {
        title: "Money added",
        body: "Your balance is updated. You’re ready to keep going.",
      };
    case "failed":
      return {
        title: "We couldn’t complete this deposit",
        body: "Nothing was added to your balance. You can try again.",
      };
  }
}

function FlowBack() {
  return (
    <span
      className="flex h-10 w-10 items-center justify-center rounded-full text-foreground"
      aria-hidden
    >
      <ArrowLeft className="h-5 w-5" strokeWidth={2} />
    </span>
  );
}

function AmountState() {
  return (
    <PreviewFlowShell showTabBar>
      <AppPreviewTopBar leftSlot={<FlowBack />} />
      <div className="mt-6">
        <h1 className="text-h2 font-semibold text-foreground">Add money</h1>
        <p className="mt-3 max-w-[20rem] text-body-sm text-ink-muted">
          Enter how much you’d like to add to your Olimpia balance.
        </p>

        <div className={`mt-6 ${previewCard} px-4 py-3.5`}>
          <p className="text-caption font-semibold text-ink-muted">Amount (USD)</p>
          <div className="mt-2 flex items-center gap-2">
            <span className="text-body-lg font-semibold text-foreground">$</span>
            <span className="text-body-lg text-ink-muted">0.00</span>
          </div>
        </div>

        <div className={`mt-6 ${previewPrimaryBtn} opacity-55`}>Continue</div>
      </div>
    </PreviewFlowShell>
  );
}

function ReviewState() {
  return (
    <PreviewFlowShell showTabBar>
      <AppPreviewTopBar leftSlot={<FlowBack />} />
      <div className="mt-6">
        <h1 className="text-h2 font-semibold text-foreground">Review</h1>
        <p className="mt-3 max-w-[20rem] text-body-sm text-ink-muted">
          ${PREVIEW_AMOUNT} will be added to your balance.
        </p>

        <div className={`mt-6 ${previewCardElevated} px-4 py-5`}>
          <p className="text-body-sm text-ink-muted">You’re adding</p>
          <p className="mt-2 text-h2 font-semibold text-foreground">${PREVIEW_AMOUNT}</p>
          <p className="mt-2 text-body-sm text-ink-muted">
            Shown in dollars in your Olimpia balance.
          </p>
        </div>

        <div className={`mt-6 ${previewPrimaryBtn}`}>Confirm</div>
      </div>
    </PreviewFlowShell>
  );
}

function StatusState({ state }: { state: "processing" | "success" | "failed" }) {
  const copy = statusCopy(state);

  return (
    <PreviewFlowShell showTabBar>
      <AppPreviewTopBar leftSlot={state === "failed" ? <FlowBack /> : undefined} />
      <div className="mt-6">
        <div className={`flex flex-col items-center ${previewCardElevated} px-4 py-8 text-center`}>
          {state === "success" ? (
            <span className="mb-4 flex h-11 w-11 items-center justify-center rounded-full bg-raspberry text-white">
              <Check className="h-5 w-5" strokeWidth={2.5} aria-hidden />
            </span>
          ) : null}
          {state === "failed" ? (
            <span className="mb-4 flex h-11 w-11 items-center justify-center rounded-full bg-raspberry text-white">
              <X className="h-5 w-5" strokeWidth={2.5} aria-hidden />
            </span>
          ) : null}
          {state === "processing" ? (
            <LoaderCircle
              className="mb-4 h-8 w-8 animate-spin text-raspberry"
              strokeWidth={2}
              aria-hidden
            />
          ) : null}

          <p className="text-body-lg font-semibold text-foreground">{copy.title}</p>
          <p className="mt-2 max-w-[17.5rem] text-body-sm text-ink-muted">{copy.body}</p>
          <p className="mt-4 text-h3 font-semibold text-foreground">${PREVIEW_AMOUNT}</p>
        </div>

        {state === "failed" ? <div className={`mt-6 ${previewPrimaryBtn}`}>Try again</div> : null}

        {state === "success" ? (
          <p className="mt-5 text-center text-body-sm text-ink-muted">Returning to Home…</p>
        ) : null}
      </div>
    </PreviewFlowShell>
  );
}

/** Funded Home — same tab chrome as Empty Home / Profile. */
function HomeFundedState({ earning = false }: { earning?: boolean }) {
  const available = earning ? "10.00" : PREVIEW_AMOUNT;
  const earningAmount = earning ? "15.00" : "0.00";
  const hasAvailable = Number(available) > 0;
  const estimatedApyPercent = 4.2;

  return (
    <PreviewTabShell active="home" wash>
      <header className="flex items-center justify-between">
        <div>
          <p className="text-body-sm text-ink-muted">Hi Sarah ✨</p>
          <p className="mt-0.5 text-h3 font-semibold text-foreground">Sarah</p>
        </div>
        <span className={previewAvatar} aria-hidden />
      </header>

      {earning ? (
        <>
          <h1 className="mt-6 text-h2 font-semibold text-foreground">Your money is growing.</h1>
          <p className="mt-2 text-body-sm text-ink-muted">
            Available to use, and earning yield.
          </p>
        </>
      ) : (
        <>
          <h1 className="mt-6 text-h2 font-semibold text-foreground">
            You’re ready to start earning.
          </h1>
          <p className="mt-2 text-body-sm text-ink-muted">Your money is here and ready to grow.</p>
        </>
      )}

      <div className={`mt-6 ${previewCardElevated} px-4 py-5`}>
        <p className="text-body-sm text-ink-muted">Available balance</p>
        <p className="mt-2 text-h1 font-semibold text-foreground">${available}</p>

        {hasAvailable ? (
          <>
            <p className="mt-4 text-body-sm font-medium text-ink-muted">Put this to work</p>
            <div className={`mt-3 ${previewPrimaryBtn}`}>
              Choose Yield
              <span className="ml-2" aria-hidden>
                →
              </span>
            </div>
          </>
        ) : null}

        <div className="my-4 h-px bg-border/50" />

        {earning ? (
          <div className="mb-2 flex items-center gap-1.5">
            <span className="h-1.5 w-1.5 rounded-full bg-raspberry" aria-hidden />
            <p className="text-label font-semibold tracking-[0.04em] text-raspberry">Earning</p>
          </div>
        ) : null}
        <p className="text-body-sm text-ink-muted">Earning yield</p>
        <p className="mt-1.5 text-h3 font-semibold text-foreground">${earningAmount}</p>
        {earning ? (
          <p className="mt-1 text-caption text-ink-muted">Est. {estimatedApyPercent}% APY</p>
        ) : null}
      </div>

      <div className="mt-8 flex justify-center gap-12">
        {(
          [
            { label: "Send", icon: "↑" },
            { label: "Receive", icon: "↓" },
          ] as const
        ).map(({ label, icon }) => (
          <div key={label} className="flex min-w-16 flex-col items-center gap-2">
            <span className={previewIconCircle}>
              <span className="text-body-lg">{icon}</span>
            </span>
            <span className="text-body-sm font-medium text-foreground">{label}</span>
          </div>
        ))}
      </div>

      <div className={`mt-6 flex items-center gap-3 ${previewCard} px-4 py-3.5`}>
        <span className="flex h-9 w-9 items-center justify-center rounded-[10px] bg-raspberry text-h3 font-semibold leading-none text-white">
          +
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-body-sm font-semibold text-foreground">Add money</p>
          <p className="mt-0.5 text-body-sm text-ink-muted">Add more anytime</p>
        </div>
        <span className="text-h3 text-ink-muted" aria-hidden>
          ›
        </span>
      </div>

      <p className="mt-8 text-body font-semibold text-foreground">Recent activity</p>
      <div className={`mt-3 flex items-center gap-2.5 ${previewCard} px-4 py-4`}>
        <Clock className="h-5 w-5 shrink-0 text-ink-muted" aria-hidden />
        <p className="text-body-sm text-ink-muted">
          No activity yet. Your transfers will show up here.
        </p>
      </div>
    </PreviewTabShell>
  );
}

export function AddMoneyFlowScreen({ state }: AddMoneyFlowScreenProps) {
  switch (state) {
    case "amount":
      return <AmountState />;
    case "review":
      return <ReviewState />;
    case "processing":
      return <StatusState state="processing" />;
    case "success":
      return <StatusState state="success" />;
    case "failed":
      return <StatusState state="failed" />;
    case "home-funded":
      return <HomeFundedState />;
    case "home-earning":
      return <HomeFundedState earning />;
  }
}
