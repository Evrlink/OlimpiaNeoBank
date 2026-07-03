import { createFileRoute } from "@tanstack/react-router";
import { AppPreviewShell } from "@/components/app-preview/app-preview-shell";
import { PhoneFrame } from "@/components/app-preview/phone-frame";
import { TabEmptyState } from "@/components/app-preview/tab-empty-state";
import { PiggyBank } from "lucide-react";

export const Route = createFileRoute("/app-preview/savings")({
  head: () => ({
    meta: [{ title: "App Preview · Savings · Olimpia" }],
  }),
  component: SavingsPreviewPage,
});

function SavingsPreviewPage() {
  return (
    <AppPreviewShell
      title="Savings empty (A10)"
      description="Goals tab shell — calm empty state, no fake data."
      active="savings"
    >
      <PhoneFrame>
        <TabEmptyState
          active="savings"
          icon={PiggyBank}
          title="Your savings goals will live here."
          description="You'll be able to create and track goals here."
        />
      </PhoneFrame>
    </AppPreviewShell>
  );
}
