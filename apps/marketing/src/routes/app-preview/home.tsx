import { createFileRoute } from "@tanstack/react-router";
import { AppPreviewShell } from "@/components/app-preview/app-preview-shell";
import { EmptyHomeScreen } from "@/components/app-preview/empty-home-screen";
import { PhoneFrame } from "@/components/app-preview/phone-frame";

export const Route = createFileRoute("/app-preview/home")({
  head: () => ({
    meta: [{ title: "App Preview · Empty Home · Olimpia" }],
  }),
  component: HomePreviewPage,
});

function HomePreviewPage() {
  return (
    <AppPreviewShell
      title="Empty Home (A4 · State 1)"
      description="Post-auth $0 state — Add money focus, trust copy, goal/growth placeholders."
      active="home"
    >
      <PhoneFrame>
        <EmptyHomeScreen />
      </PhoneFrame>
    </AppPreviewShell>
  );
}
