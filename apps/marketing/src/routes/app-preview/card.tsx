import { createFileRoute } from "@tanstack/react-router";
import { AppPreviewShell } from "@/components/app-preview/app-preview-shell";
import { PhoneFrame } from "@/components/app-preview/phone-frame";
import { TabEmptyState } from "@/components/app-preview/tab-empty-state";
import { CreditCard } from "lucide-react";

export const Route = createFileRoute("/app-preview/card")({
  head: () => ({
    meta: [{ title: "App Preview · Card · Olimpia" }],
  }),
  component: CardPreviewPage,
});

function CardPreviewPage() {
  return (
    <AppPreviewShell
      title="Card empty (A14)"
      description="Card tab shell — virtual debit placeholder, no PAN or Visa imagery."
      active="card"
    >
      <PhoneFrame>
        <TabEmptyState
          active="card"
          icon={CreditCard}
          title="Your virtual debit card will live here."
          description="Your card details and spending tools will appear here."
        />
      </PhoneFrame>
    </AppPreviewShell>
  );
}
