import { createFileRoute } from "@tanstack/react-router";
import { AppPreviewShell } from "@/components/app-preview/app-preview-shell";
import { PhoneFrame } from "@/components/app-preview/phone-frame";
import { WelcomeScreen } from "@/components/app-preview/welcome-screen";

export const Route = createFileRoute("/app-preview/welcome")({
  head: () => ({
    meta: [{ title: "App Preview · Welcome · Olimpia" }],
  }),
  component: WelcomePreviewPage,
});

function WelcomePreviewPage() {
  return (
    <AppPreviewShell
      title="Welcome (A1)"
      description="Pre-auth marketing screen — product promise and Get started."
      active="welcome"
    >
      <PhoneFrame>
        <WelcomeScreen />
      </PhoneFrame>
    </AppPreviewShell>
  );
}
