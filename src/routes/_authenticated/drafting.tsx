import { createFileRoute } from "@tanstack/react-router";
import { DraftingAgentPage } from "@/pages/DraftingAgentPage";

export const Route = createFileRoute("/_authenticated/drafting")({
  head: () => ({
    meta: [{ title: "Drafting Agent — Suites AI" }],
  }),
  component: DraftingAgentPage,
});
