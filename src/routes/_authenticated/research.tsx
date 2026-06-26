import { createFileRoute } from "@tanstack/react-router";
import { ResearchAgentPage } from "@/pages/ResearchAgentPage";

export const Route = createFileRoute("/_authenticated/research")({
  head: () => ({
    meta: [{ title: "Research Agent — Suites AI" }],
  }),
  component: ResearchAgentPage,
});
