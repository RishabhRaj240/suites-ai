// @lovable.dev/vite-tanstack-config already includes the following — do NOT add them manually
// or the app will break with duplicate plugins:
//   - tanstackStart, viteReact, tailwindcss, tsConfigPaths, nitro (build-only using cloudflare as a default target),
//     componentTagger (dev-only), VITE_* env injection, @ path alias, React/TanStack dedupe,
//     error logger plugins, and sandbox detection (port/host/strictPort).
// You can pass additional config via defineConfig({ vite: { ... }, etc... }) if needed.
import { defineConfig } from "@lovable.dev/vite-tanstack-config";

export default defineConfig({
  tanstackStart: {
    // Redirect TanStack Start's bundled server entry to src/server.ts (our SSR error wrapper).
    // nitro/vite builds from this
    server: { entry: "server" },
  },

  // FIX: Without this, the Lovable vite config skips Nitro entirely when it
  // doesn't detect a Lovable sandbox environment (e.g. Vercel CI, local builds).
  //
  // Setting nitro: { preset: "vercel" } does two things:
  //   1. Sets explicitNitro = true  → shouldRunNitro = true  → Nitro runs.
  //   2. Uses the "vercel" Nitro preset → generates .vercel/output/functions/
  //      with a proper serverless handler and the correct config.json routing.
  //
  // The default preset is "cloudflare-module" which only produces dist/server/
  // but never writes .vercel/output/functions/ — hence the 404 on Vercel.
  //
  // Reference: @lovable.dev/vite-tanstack-config/dist/index.d.ts
  //   nitro?: true | { preset?: string; ... } | false
  //   "Set preset (e.g. { preset: 'vercel' }) to hard-pin a target from your own CI."
  nitro: {
    preset: "vercel",
  },
});
