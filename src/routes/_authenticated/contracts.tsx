import { createFileRoute } from "@tanstack/react-router";
import { ContractReviewPage } from "@/pages/ContractReviewPage";

export const Route = createFileRoute("/_authenticated/contracts")({
  head: () => ({
    meta: [{ title: "Contract Review — Suites AI" }],
  }),
  component: ContractReviewPage,
});
