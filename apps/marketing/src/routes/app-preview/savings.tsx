import { createFileRoute, Link } from "@tanstack/react-router";
import {
  SavingsScreen,
  type SavingsPreviewState,
} from "@/components/app-preview/savings-screen";
import { AppPreviewShell } from "@/components/app-preview/app-preview-shell";
import { PhoneFrame } from "@/components/app-preview/phone-frame";
import { cn } from "@/lib/utils";

type SavingsSearch = {
  state?: SavingsPreviewState;
};

const previewStates = [
  { id: "empty", label: "Empty · create" },
  { id: "goals", label: "Goals + yield" },
  { id: "add", label: "Add to savings" },
  { id: "create", label: "New goal" },
] as const satisfies ReadonlyArray<{ id: SavingsPreviewState; label: string }>;

function isSavingsState(value: unknown): value is SavingsPreviewState {
  return previewStates.some((entry) => entry.id === value);
}

export const Route = createFileRoute("/app-preview/savings")({
  validateSearch: (search: Record<string, unknown>): SavingsSearch => ({
    state: isSavingsState(search.state) ? search.state : "empty",
  }),
  head: () => ({
    meta: [{ title: "App Preview · Savings · Olimpia" }],
  }),
  component: SavingsPreviewPage,
});

function SavingsPreviewPage() {
  const { state = "empty" } = Route.useSearch();

  return (
    <AppPreviewShell
      title="Savings (goals + yield)"
      description="Empty opens create on one screen. Add to savings only appears after a goal exists. Yield is variable and not guaranteed."
      active="savings"
    >
      <div className="flex w-full max-w-[390px] flex-col items-center gap-4">
        <nav
          className="flex w-full flex-wrap justify-center gap-2"
          aria-label="Savings preview states"
        >
          {previewStates.map(({ id, label }) => (
            <Link
              key={id}
              to="/app-preview/savings"
              search={{ state: id }}
              className={cn(
                "rounded-full px-3 py-1.5 text-body-sm font-semibold transition",
                state === id
                  ? "bg-raspberry text-white"
                  : "bg-card text-foreground ring-1 ring-border hover:bg-background",
              )}
            >
              {label}
            </Link>
          ))}
        </nav>

        <PhoneFrame>
          <SavingsScreen key={state} state={state} />
        </PhoneFrame>
      </div>
    </AppPreviewShell>
  );
}
