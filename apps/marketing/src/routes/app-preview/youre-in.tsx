import { createFileRoute } from "@tanstack/react-router";
import { AppPreviewShell } from "@/components/app-preview/app-preview-shell";
import { PhoneFrame } from "@/components/app-preview/phone-frame";
import { YoureInScreen } from "@/components/app-preview/youre-in-screen";

export const Route = createFileRoute("/app-preview/youre-in")({
  head: () => ({
    meta: [{ title: "App Preview · You're in · Olimpia" }],
  }),
  component: YoureInPreviewPage,
});

function YoureInPreviewPage() {
  return (
    <AppPreviewShell
      title="You're in (A3)"
      description="Post sign-up confirmation — Add money or explore Empty Home."
      active="youre-in"
    >
      <PhoneFrame>
        <YoureInScreen />
      </PhoneFrame>
    </AppPreviewShell>
  );
}
