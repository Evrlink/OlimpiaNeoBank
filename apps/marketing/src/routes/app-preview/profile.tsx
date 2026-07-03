import { createFileRoute } from "@tanstack/react-router";
import { AppPreviewShell } from "@/components/app-preview/app-preview-shell";
import { PhoneFrame } from "@/components/app-preview/phone-frame";
import { ProfileScreen } from "@/components/app-preview/profile-screen";

export const Route = createFileRoute("/app-preview/profile")({
  head: () => ({
    meta: [{ title: "App Preview · Profile · Olimpia" }],
  }),
  component: ProfilePreviewPage,
});

function ProfilePreviewPage() {
  return (
    <AppPreviewShell
      title="Profile (A16)"
      description="Account info + Pia Coming Soon card — static only, no chat."
      active="profile"
    >
      <PhoneFrame>
        <ProfileScreen />
      </PhoneFrame>
    </AppPreviewShell>
  );
}
