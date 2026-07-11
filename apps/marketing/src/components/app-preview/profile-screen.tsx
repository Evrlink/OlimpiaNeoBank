import {
  PreviewTabShell,
  previewAvatar,
  previewCard,
  previewCardElevated,
} from "./preview-chrome";

export function ProfileScreen() {
  return (
    <PreviewTabShell active="profile">
      <div className="flex items-center gap-3">
        <div className={`${previewAvatar} h-14 w-14`} aria-hidden />
        <div>
          <p className="text-h3 font-semibold text-foreground">Sarah Chen</p>
          <p className="text-body-sm text-ink-muted">sarah@email.com</p>
          <p className="text-body-sm text-raspberry">@sarahchen</p>
        </div>
      </div>

      <div className={`mt-6 ${previewCardElevated} p-4`}>
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-rose-soft text-raspberry">
            <span className="text-body-sm font-semibold">P</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-body font-semibold text-foreground">Pia</span>
            <span className="rounded-full bg-rose-soft px-2.5 py-0.5 text-caption font-semibold text-raspberry">
              Coming Soon
            </span>
          </div>
        </div>
        <div className="mt-4 rounded-2xl rounded-tl-md bg-surface/60 px-4 py-3">
          <p className="text-body-sm text-ink-muted">
            Pia will help you understand saving, growth, and financial confidence — supportive,
            never judgmental.
          </p>
        </div>
      </div>

      <div className={`mt-4 overflow-hidden ${previewCard}`}>
        {["Notifications", "Security", "Help & support"].map((label) => (
          <div key={label} className="border-b border-border/40 px-4 py-3.5 last:border-b-0">
            <span className="text-body text-foreground">{label}</span>
          </div>
        ))}
      </div>

      <button type="button" className="mt-6 w-full py-3 text-body-sm font-semibold text-berry">
        Sign out
      </button>
    </PreviewTabShell>
  );
}
