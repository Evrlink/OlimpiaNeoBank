import { createFileRoute } from "@tanstack/react-router";
import { AddFundsScreen } from "@/components/app-preview/add-funds-screen";
import { AppPreviewShell } from "@/components/app-preview/app-preview-shell";
import { PhoneFrame } from "@/components/app-preview/phone-frame";

export const Route = createFileRoute("/app-preview/add-funds")({
  head: () => ({
    meta: [{ title: "App Preview · Add funds · Olimpia" }],
  }),
  component: AddFundsPreviewPage,
});

function AddFundsPreviewPage() {
  return (
    <AppPreviewShell
      title="Add funds (A5)"
      description="Shared funding stub — bank or debit method, safety copy, Continue."
      active="add-funds"
    >
      <PhoneFrame>
        <AddFundsScreen />
      </PhoneFrame>
    </AppPreviewShell>
  );
}
