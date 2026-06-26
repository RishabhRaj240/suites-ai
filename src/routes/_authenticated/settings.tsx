import { createFileRoute } from "@tanstack/react-router";
import { SettingsPage } from "@/pages/SettingsPage";

export const Route = createFileRoute("/_authenticated/settings")({
  head: () => ({
    meta: [{ title: "Settings — Suites AI" }],
  }),
  component: SettingsPage,
});
