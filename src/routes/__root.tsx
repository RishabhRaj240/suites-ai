import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  Outlet,
  Link,
  createRootRouteWithContext,
  useRouter,
  HeadContent,
  Scripts,
} from "@tanstack/react-router";
import { useEffect, type ReactNode } from "react";
import { Toaster } from "sonner";

import appCss from "../styles.css?url";
import { reportLovableError } from "../lib/lovable-error-reporting";
import { supabase } from "@/integrations/supabase/client";

function NotFoundComponent() {
  return (
    <div className="bg-aurora flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-7xl font-bold text-foreground">404</h1>
        <h2 className="mt-4 text-xl font-semibold text-foreground">Page not found</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          The page you're looking for doesn't exist or has been moved.
        </p>
        <div className="mt-6">
          <Link
            to="/"
            className="bg-violet-gradient inline-flex items-center justify-center rounded-md px-4 py-2 text-sm font-medium text-primary-foreground transition-shadow hover:shadow-violet-glow"
          >
            Go home
          </Link>
        </div>
      </div>
    </div>
  );
}

function ErrorComponent({ error, reset }: { error: Error; reset: () => void }) {
  console.error(error);
  const router = useRouter();
  useEffect(() => {
    reportLovableError(error, { boundary: "tanstack_root_error_component" });
  }, [error]);

  return (
    <div className="bg-aurora flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-xl font-semibold tracking-tight text-foreground">
          This page didn't load
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Something went wrong. Try refreshing or head back home.
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-2">
          <button
            onClick={() => {
              router.invalidate();
              reset();
            }}
            className="bg-violet-gradient inline-flex items-center justify-center rounded-md px-4 py-2 text-sm font-medium text-primary-foreground transition-shadow hover:shadow-violet-glow"
          >
            Try again
          </button>
          <a
            href="/"
            className="inline-flex items-center justify-center rounded-md border border-border bg-surface px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-secondary"
          >
            Go home
          </a>
        </div>
      </div>
    </div>
  );
}

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: "Suites AI — AI Legal Assistant for Lawyers" },
      {
        name: "description",
        content:
          "Suites AI is the AI-powered legal assistant platform for lawyers and legal teams.",
      },
      { name: "theme-color", content: "#0A0A0F" },
      { property: "og:title", content: "Suites AI — AI Legal Assistant for Lawyers" },
      {
        property: "og:description",
        content: "Your AI legal team, always on.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:title", content: "Suites AI — AI Legal Assistant for Lawyers" },
      { name: "description", content: "Automate contract review, legal drafting, and client intake with AI agents built for law firms." },
      { property: "og:description", content: "Automate contract review, legal drafting, and client intake with AI agents built for law firms." },
      { name: "twitter:description", content: "Automate contract review, legal drafting, and client intake with AI agents built for law firms." },
      { property: "og:image", content: "https://pub-bb2e103a32db4e198524a2e9ed8f35b4.r2.dev/397da43c-d70d-44c7-82b8-802d31524331/id-preview-c20541e3--5709e0c9-5d3f-46b2-afc3-8f8c21b3f7af.lovable.app-1782110426752.png" },
      { name: "twitter:image", content: "https://pub-bb2e103a32db4e198524a2e9ed8f35b4.r2.dev/397da43c-d70d-44c7-82b8-802d31524331/id-preview-c20541e3--5709e0c9-5d3f-46b2-afc3-8f8c21b3f7af.lovable.app-1782110426752.png" },
    ],
    links: [
      { rel: "stylesheet", href: appCss },
      { rel: "preconnect", href: "https://fonts.googleapis.com" },
      {
        rel: "preconnect",
        href: "https://fonts.gstatic.com",
        crossOrigin: "anonymous",
      },
      {
        rel: "stylesheet",
        href: "https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Sora:wght@600;700;800&family=JetBrains+Mono:wght@400;500&display=swap",
      },
    ],
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
  errorComponent: ErrorComponent,
});

function RootShell({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <head>
        <HeadContent />
      </head>
      <body>
        {children}
        <Scripts />
      </body>
    </html>
  );
}

function RootComponent() {
  const { queryClient } = Route.useRouteContext();
  const router = useRouter();

  useEffect(() => {
    const { data: sub } = supabase.auth.onAuthStateChange((event) => {
      if (event !== "SIGNED_IN" && event !== "SIGNED_OUT" && event !== "USER_UPDATED") {
        return;
      }
      router.invalidate();
      if (event !== "SIGNED_OUT") queryClient.invalidateQueries();
    });
    return () => sub.subscription.unsubscribe();
  }, [router, queryClient]);

  return (
    <QueryClientProvider client={queryClient}>
      <Outlet />
      <Toaster
        theme="dark"
        position="top-right"
        toastOptions={{
          style: {
            background: "oklch(0.14 0.02 280)",
            border: "1px solid oklch(0.24 0.025 280)",
            color: "oklch(0.96 0.012 285)",
          },
        }}
      />
    </QueryClientProvider>
  );
}
