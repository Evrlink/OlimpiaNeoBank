/**
 * TEMPORARY Phase 4 Add Money visual gallery — preview only.
 * Delete with add-money-flow-screen.tsx when native review is available.
 */
import { createFileRoute, Link } from "@tanstack/react-router";
import {
  AddMoneyFlowScreen,
  type AddMoneyPreviewState,
} from "@/components/app-preview/add-money-flow-screen";
import { AppPreviewShell } from "@/components/app-preview/app-preview-shell";
import { PhoneFrame } from "@/components/app-preview/phone-frame";
import { cn } from "@/lib/utils";

type AddMoneySearch = {
  state?: AddMoneyPreviewState;
};

const previewStates = [
  { id: "amount", label: "Amount" },
  { id: "review", label: "Review" },
  { id: "processing", label: "Processing" },
  { id: "success", label: "Success" },
  { id: "failed", label: "Failed" },
  { id: "home-funded", label: "Home funded" },
  { id: "home-earning", label: "Home earning" },
] as const satisfies ReadonlyArray<{ id: AddMoneyPreviewState; label: string }>;

function isAddMoneyState(value: unknown): value is AddMoneyPreviewState {
  return previewStates.some((entry) => entry.id === value);
}

export const Route = createFileRoute("/app-preview/add-money")({
  validateSearch: (search: Record<string, unknown>): AddMoneySearch => {
    // Legacy ?state=pending maps to the single processing UX state.
    const raw = search.state === "pending" ? "processing" : search.state;
    return {
      state: isAddMoneyState(raw) ? raw : "amount",
    };
  },
  head: () => ({
    meta: [{ title: "App Preview · Add Money (Phase 4) · Olimpia" }],
  }),
  component: AddMoneyPreviewPage,
});

function AddMoneyPreviewPage() {
  const { state = "amount" } = Route.useSearch();

  return (
    <AppPreviewShell
      title="Add Money (Phase 4 · temporary)"
      description="Browser-only visual gallery matching the mobile Add Money mock flow. Not production. Switch states with the pills below."
      active="add-money"
    >
      <div className="flex w-full max-w-[390px] flex-col items-center gap-4">
        <nav
          className="flex w-full flex-wrap justify-center gap-2"
          aria-label="Add Money preview states"
        >
          {previewStates.map(({ id, label }) => (
            <Link
              key={id}
              to="/app-preview/add-money"
              search={{ state: id }}
              className={cn(
                "rounded-full px-3 py-1.5 text-[0.8125rem] font-semibold transition",
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
          <AddMoneyFlowScreen key={state} state={state} />
        </PhoneFrame>
      </div>
    </AppPreviewShell>
  );
}
