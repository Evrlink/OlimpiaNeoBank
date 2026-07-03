import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/app-preview/")({
  beforeLoad: () => {
    throw redirect({ to: "/app-preview/welcome" });
  },
});
