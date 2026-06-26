import { createFileRoute } from "@tanstack/react-router";
import { CaseMemoryPage } from "@/pages/CaseMemoryPage";

export const Route = createFileRoute("/_authenticated/memory")({
  head: () => ({
    meta: [{ title: "Case Memory — Suites AI" }],
  }),
  component: CaseMemoryPage,
});
