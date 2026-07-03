import { AppTabBar } from "./app-tab-bar";

export function ProfileScreen() {
  return (
    <div className="relative flex min-h-0 flex-1 flex-col bg-background">
      <div className="relative z-[1] flex min-h-0 flex-1 flex-col overflow-y-auto px-4 pb-4 pt-4">
        <div className="flex items-center gap-3">
          <div
            className="h-14 w-14 shrink-0 rounded-full bg-gradient-to-br from-rose to-raspberry/80 ring-2 ring-background"
            aria-hidden
          />
          <div>
            <p className="text-h3 font-semibold text-foreground">Sarah Chen</p>
            <p className="text-body-sm text-ink-muted">sarah@email.com</p>
            <p className="text-body-sm text-raspberry">@sarahchen</p>
          </div>
        </div>

        <div className="mt-6 rounded-2xl border border-border/40 bg-card p-4 shadow-card">
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

        <div className="mt-4 overflow-hidden rounded-2xl border border-border/40 bg-card">
          {["Notifications", "Security", "Help & support"].map((label) => (
            <div
              key={label}
              className="border-b border-border/40 px-4 py-3.5 last:border-b-0"
            >
              <span className="text-body text-foreground">{label}</span>
            </div>
          ))}
        </div>

        <button
          type="button"
          className="mt-6 w-full py-3 text-body-sm font-semibold text-berry"
        >
          Sign out
        </button>
      </div>

      <AppTabBar active="profile" />
    </div>
  );
}
