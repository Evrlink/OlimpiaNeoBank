import { createFileRoute, Link } from "@tanstack/react-router";

/**
 * Temporary preview hub (easy to restore to Welcome-only redirect later).
 * Phase 4 gallery: /app-preview/add-money
 */
export const Route = createFileRoute("/app-preview/")({
  head: () => ({
    meta: [{ title: "App Preview · Olimpia" }],
  }),
  component: AppPreviewIndexPage,
});

function AppPreviewIndexPage() {
  return (
    <div className="min-h-screen bg-surface/50 px-4 py-10">
      <div className="mx-auto max-w-lg">
        <p className="text-label font-semibold uppercase tracking-[0.18em] text-raspberry">
          App preview
        </p>
        <h1 className="mt-2 text-h2 font-semibold text-foreground">Preview hub</h1>
        <p className="mt-2 text-body-sm text-ink-muted">
          Temporary index for visual review. Use the shell nav on any preview screen, or open
          the Phase 4 gallery below.
        </p>
        <ul className="mt-6 space-y-3">
          <li>
            <Link
              to="/app-preview/welcome"
              className="text-body font-semibold text-raspberry underline-offset-2 hover:underline"
            >
              Welcome (Phase 2)
            </Link>
          </li>
          <li>
            <Link
              to="/app-preview/add-money"
              search={{ state: "amount" }}
              className="text-body font-semibold text-raspberry underline-offset-2 hover:underline"
            >
              Add Money (Phase 4 · temporary gallery)
            </Link>
          </li>
        </ul>
      </div>
    </div>
  );
}
