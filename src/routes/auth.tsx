import { createFileRoute } from "@tanstack/react-router";

import { AuthPage } from "@/pages/AuthPage";

export const Route = createFileRoute("/auth")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Sign in — Suites AI" },
      {
        name: "description",
        content: "Sign in to Suites AI — your AI legal team, always on.",
      },
    ],
  }),
  component: AuthPage,
});
