/**
 * Savings tab preview — named goals earning yield (APY), no target dates.
 * Empty = create form (one screen). Add to savings only when goals exist.
 */
import { useMemo, useState } from "react";
import { ArrowLeft, ChevronRight, Plus } from "lucide-react";
import { AppPreviewTopBar } from "./app-preview-wordmark";
import {
  PreviewFlowShell,
  PreviewTabShell,
  previewCard,
  previewCardElevated,
  previewPrimaryBtn,
  previewSecondaryBtn,
} from "./preview-chrome";

export type SavingsPreviewState = "empty" | "goals" | "add" | "create";

type SavingsGoal = {
  id: string;
  title: string;
  principalUsd: number;
  earnedUsd: number;
  apyPercent: number;
};

const DEFAULT_APY = 4.2;

const SEED_GOALS: SavingsGoal[] = [
  {
    id: "vacation",
    title: "Vacation",
    principalUsd: 800,
    earnedUsd: 7.8,
    apyPercent: DEFAULT_APY,
  },
  {
    id: "shopping",
    title: "Shopping",
    principalUsd: 450,
    earnedUsd: 4.6,
    apyPercent: DEFAULT_APY,
  },
  {
    id: "emergency",
    title: "Emergency",
    principalUsd: 320,
    earnedUsd: 2.1,
    apyPercent: DEFAULT_APY,
  },
];

function formatUsd(value: number): string {
  return value.toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

type SavingsScreenProps = {
  state?: SavingsPreviewState;
};

export function SavingsScreen({ state = "goals" }: SavingsScreenProps) {
  if (state === "empty") {
    return <CreateGoalForm variant="empty" />;
  }
  if (state === "create") {
    return <CreateGoalForm variant="flow" />;
  }
  if (state === "add") {
    return <AddToSavingsPreview />;
  }
  return <SavingsGoalsPreview />;
}

/** Empty tab = create form. Same form used for “New goal” from the list. */
function CreateGoalForm({ variant }: { variant: "empty" | "flow" }) {
  const [title, setTitle] = useState("");
  const canCreate = title.trim().length > 0;

  const body = (
    <>
      {variant === "flow" ? (
        <AppPreviewTopBar
          leftSlot={
            <span
              className="flex h-10 w-10 items-center justify-center rounded-full text-foreground"
              aria-hidden
            >
              <ArrowLeft className="h-5 w-5" strokeWidth={2} />
            </span>
          }
        />
      ) : null}

      <h1
        className={`text-h2 font-semibold text-foreground ${variant === "flow" ? "mt-6" : ""}`}
      >
        {variant === "empty" ? "Savings" : "New goal"}
      </h1>
      <p className="mt-2 text-body-sm text-ink-muted">
        Name a goal and add money when you’re ready.
      </p>

      <label className={`mt-6 block ${previewCard} px-4 py-3.5`}>
        <span className="text-caption font-semibold text-ink-muted">Goal title</span>
        <input
          value={title}
          onChange={(event) => setTitle(event.target.value)}
          placeholder="Name your goal"
          autoComplete="off"
          className="mt-2 w-full bg-transparent text-body-lg font-semibold text-foreground outline-none placeholder:font-normal placeholder:text-ink-muted"
        />
      </label>

      <div className={`mt-4 ${previewCard} px-4 py-3.5`}>
        <p className="text-caption font-semibold text-ink-muted">
          Add money <span className="font-normal">(optional)</span>
        </p>
        <div className="mt-2 flex items-center gap-2">
          <span className="text-body-lg font-semibold text-foreground">$</span>
          <span className="text-body-lg text-ink-muted">0.00</span>
        </div>
      </div>

      <div
        className={`mt-6 ${previewPrimaryBtn} ${canCreate ? "" : "opacity-45"}`}
        aria-disabled={!canCreate}
      >
        Create goal
      </div>
      <p className="mt-3 text-center text-caption text-ink-muted">
        You can add yield later from Home when you’re ready.
      </p>
    </>
  );

  if (variant === "empty") {
    return (
      <PreviewTabShell active="savings" wash>
        {body}
      </PreviewTabShell>
    );
  }

  return (
    <PreviewFlowShell showTabBar tabActive="savings">
      {body}
    </PreviewFlowShell>
  );
}

function SavingsGoalsPreview() {
  const [activeIndex, setActiveIndex] = useState(0);
  const totals = useMemo(() => {
    const principal = SEED_GOALS.reduce((sum, goal) => sum + goal.principalUsd, 0);
    const earned = SEED_GOALS.reduce((sum, goal) => sum + goal.earnedUsd, 0);
    return { principal, earned, apy: DEFAULT_APY };
  }, []);

  return (
    <PreviewTabShell active="savings" wash>
      <h1 className="text-h2 font-semibold text-foreground">Savings</h1>
      <p className="mt-2 text-body-sm text-ink-muted">
        Your goals earn yield in USDC. Add anytime.
      </p>

      <div className={`mt-6 ${previewCardElevated} px-4 py-5`}>
        <p className="text-body-sm text-ink-muted">Amount</p>
        <p className="mt-2 text-h1 font-semibold text-foreground">
          ${formatUsd(totals.principal)}
        </p>
        <div className="mt-4 flex items-end justify-between gap-4">
          <div>
            <p className="text-caption font-semibold uppercase tracking-[0.18em] text-raspberry">
              APY
            </p>
            <p className="mt-1 text-body font-semibold text-foreground">{totals.apy}%</p>
          </div>
          <div className="text-right">
            <p className="text-caption text-ink-muted">You’ve earned</p>
            <p className="mt-1 text-body font-semibold text-raspberry">
              ${formatUsd(totals.earned)}
            </p>
          </div>
        </div>
      </div>

      <div className={`mt-4 ${previewPrimaryBtn}`}>
        <Plus className="mr-2 h-4 w-4" strokeWidth={2.5} aria-hidden />
        Add to savings
      </div>
      <p className="mt-2 text-center text-caption text-ink-muted">
        Add USDC from your available balance to a goal.
      </p>

      <div className="mt-8 flex items-end justify-between gap-3">
        <p className="text-body font-semibold text-foreground">Your goals</p>
        <p className="text-caption text-ink-muted">
          {activeIndex + 1} of {SEED_GOALS.length}
        </p>
      </div>

      <div
        className="-mx-6 mt-3 flex snap-x snap-mandatory gap-3 overflow-x-auto px-6 pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        onScroll={(event) => {
          const el = event.currentTarget;
          const cardWidth = el.clientWidth - 48;
          const next = Math.round(el.scrollLeft / Math.max(cardWidth + 12, 1));
          setActiveIndex(Math.min(Math.max(next, 0), SEED_GOALS.length - 1));
        }}
      >
        {SEED_GOALS.map((goal) => (
          <div key={goal.id} className="w-[calc(100%-1.25rem)] shrink-0 snap-center">
            <GoalCard goal={goal} />
          </div>
        ))}
      </div>

      <div className="mt-3 flex items-center justify-center gap-3">
        <div className="flex items-center gap-1.5" aria-label="Goal pages">
          {SEED_GOALS.map((goal, index) => (
            <span
              key={goal.id}
              className={`h-1.5 rounded-full transition-all ${
                index === activeIndex ? "w-4 bg-raspberry" : "w-1.5 bg-border"
              }`}
            />
          ))}
        </div>
        {activeIndex < SEED_GOALS.length - 1 ? (
          <span className="flex items-center gap-0.5 text-caption text-ink-muted">
            Swipe
            <ChevronRight className="h-3.5 w-3.5" aria-hidden />
          </span>
        ) : null}
      </div>

      <button type="button" className={`mt-5 ${previewSecondaryBtn}`}>
        <Plus className="mr-2 h-4 w-4" strokeWidth={2.5} aria-hidden />
        New goal
      </button>
    </PreviewTabShell>
  );
}

function GoalCard({ goal }: { goal: SavingsGoal }) {
  return (
    <div className={`${previewCard} px-4 py-4`}>
      <div className="flex items-start justify-between gap-3">
        <p className="text-body font-semibold text-foreground">{goal.title}</p>
        <p className="text-h3 font-semibold text-foreground">${formatUsd(goal.principalUsd)}</p>
      </div>

      <div className="mt-4 flex items-center justify-between gap-3 border-t border-border/40 pt-3">
        <div>
          <p className="text-caption text-ink-muted">APY</p>
          <p className="mt-0.5 text-body-sm font-semibold text-foreground">{goal.apyPercent}%</p>
        </div>
        <div className="text-right">
          <p className="text-caption text-ink-muted">You’ve earned</p>
          <p className="mt-0.5 text-body-sm font-semibold text-raspberry">
            ${formatUsd(goal.earnedUsd)}
          </p>
        </div>
      </div>

      <button
        type="button"
        className="mt-4 w-full rounded-2xl border border-raspberry/25 bg-rose-soft/50 py-2.5 text-body-sm font-semibold text-raspberry"
      >
        Add to {goal.title} goal
      </button>
    </div>
  );
}

function AddToSavingsPreview() {
  return (
    <PreviewFlowShell showTabBar tabActive="savings">
      <AppPreviewTopBar
        leftSlot={
          <span
            className="flex h-10 w-10 items-center justify-center rounded-full text-foreground"
            aria-hidden
          >
            <ArrowLeft className="h-5 w-5" strokeWidth={2} />
          </span>
        }
      />

      <h1 className="mt-6 text-h2 font-semibold text-foreground">Add to savings</h1>
      <p className="mt-2 text-body-sm text-ink-muted">
        Move USDC from your available balance into a goal. It starts earning the current APY.
      </p>

      <div className={`mt-6 ${previewCard} px-4 py-3.5`}>
        <p className="text-caption font-semibold text-ink-muted">Amount (USDC)</p>
        <div className="mt-2 flex items-center gap-2">
          <span className="text-body-lg font-semibold text-foreground">$</span>
          <span className="text-body-lg text-ink-muted">100.00</span>
        </div>
      </div>

      <p className="mt-6 text-body-sm font-semibold text-foreground">Add to</p>
      <div className="mt-3 space-y-2">
        {SEED_GOALS.map((goal, index) => (
          <div
            key={goal.id}
            className={`${previewCard} flex items-center justify-between px-4 py-3.5 ${
              index === 0 ? "ring-2 ring-raspberry/30" : ""
            }`}
          >
            <div>
              <p className="text-body-sm font-semibold text-foreground">{goal.title}</p>
              <p className="mt-0.5 text-caption text-ink-muted">
                ${formatUsd(goal.principalUsd)} · {goal.apyPercent}% APY
              </p>
            </div>
            {index === 0 ? (
              <span className="text-caption font-semibold text-raspberry">Selected</span>
            ) : null}
          </div>
        ))}
      </div>

      <div className={`mt-6 ${previewCardElevated} px-4 py-4`}>
        <p className="text-body-sm text-ink-muted">After this add</p>
        <p className="mt-1 text-h3 font-semibold text-foreground">
          Vacation · ${formatUsd(900)}
        </p>
        <p className="mt-2 text-body-sm text-ink-muted">
          Continues earning at {DEFAULT_APY}% APY. Yield is variable and not guaranteed.
        </p>
      </div>

      <div className={`mt-6 ${previewPrimaryBtn}`}>Confirm add</div>
    </PreviewFlowShell>
  );
}
