import { createFileRoute } from "@tanstack/react-router";
import { IntakeAgentPage } from "@/pages/IntakeAgentPage";

export const Route = createFileRoute("/_authenticated/intake")({
  head: () => ({
    meta: [{ title: "Intake Agent — Suites AI" }],
  }),
  component: IntakeAgentPage,
});
