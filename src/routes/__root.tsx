import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  Outlet,
  createRootRouteWithContext,
  useRouter,
  HeadContent,
  Scripts,
} from "@tanstack/react-router";
import { useEffect, useRef, type ReactNode } from "react";
import { Toaster } from "sonner";

import appCss from "../styles.css?url";
import { supabase } from "@/integrations/supabase/client";
import { NotFoundPage } from "@/pages/NotFoundPage";
import { ErrorPage } from "@/pages/ErrorPage";

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
  notFoundComponent: NotFoundPage,
  errorComponent: ErrorPage,
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
  const navKey = useRef(0);

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
      <div className="page-transition" style={{ minHeight: "100vh" }}>
        <Outlet />
      </div>
      <Toaster
        theme="dark"
        position="top-right"
        richColors
        toastOptions={{
          style: {
            background: "rgba(13,13,22,0.97)",
            border: "1px solid #1E1E2E",
            color: "#e4e1e9",
            fontFamily: "Inter, sans-serif",
          },
        }}
      />
    </QueryClientProvider>
  );
}
