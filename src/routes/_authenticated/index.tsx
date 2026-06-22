import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Gavel, LogOut, Scale, Sparkles, FileText } from "lucide-react";
import { toast } from "sonner";

import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/_authenticated/")({
  head: () => ({
    meta: [{ title: "Dashboard — Suites AI" }],
  }),
  component: Dashboard,
});

interface Profile {
  full_name: string | null;
  email: string | null;
  firm: string | null;
}

function Dashboard() {
  const navigate = useNavigate();
  const [profile, setProfile] = useState<Profile | null>(null);

  useEffect(() => {
    supabase.auth.getUser().then(async ({ data }) => {
      if (!data.user) return;
      const { data: row } = await supabase
        .from("profiles")
        .select("full_name, email, firm")
        .eq("id", data.user.id)
        .maybeSingle();
      setProfile(
        row ?? {
          full_name: null,
          email: data.user.email ?? null,
          firm: null,
        },
      );
    });
  }, []);

  async function signOut() {
    await supabase.auth.signOut();
    toast.success("Signed out");
    navigate({ to: "/auth", replace: true });
  }

  const displayName =
    profile?.full_name || profile?.email?.split("@")[0] || "Counselor";

  return (
    <div className="bg-aurora min-h-screen bg-background">
      {/* Top bar */}
      <header className="border-b border-border bg-background/60 backdrop-blur-xl">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-2.5">
            <div className="bg-violet-gradient flex h-8 w-8 items-center justify-center rounded-lg">
              <Gavel className="h-4 w-4 text-primary-foreground" strokeWidth={2.4} />
            </div>
            <span className="text-base font-bold tracking-tight text-foreground">
              Suites AI
            </span>
          </div>
          <button
            onClick={signOut}
            className="inline-flex items-center gap-2 rounded-lg border border-border bg-surface px-3 py-1.5 text-xs font-medium text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
          >
            <LogOut className="h-3.5 w-3.5" />
            Sign out
          </button>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-6 py-16">
        <div className="animate-fade-in">
          <span className="inline-flex items-center gap-1.5 rounded-full border border-border bg-surface px-3 py-1 text-xs font-medium text-accent">
            <span className="h-1.5 w-1.5 rounded-full bg-accent shadow-[0_0_8px_currentColor]" />
            Online
          </span>
          <h1 className="mt-5 text-4xl text-foreground md:text-5xl">
            Welcome back, {displayName}.
          </h1>
          <p className="mt-3 max-w-xl text-muted-foreground">
            Your AI legal workspace is ready. Agents, contracts and case research will
            appear here as we wire them up.
          </p>
        </div>

        {/* Placeholder agent cards with the signature "legal pulse" */}
        <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <AgentCard
            icon={FileText}
            name="Contract Analyst"
            description="Reviews and redlines contracts against your playbook."
            active
          />
          <AgentCard
            icon={Scale}
            name="Case Researcher"
            description="Surfaces precedent and statutory authority on demand."
          />
          <AgentCard
            icon={Sparkles}
            name="Brief Drafter"
            description="Drafts memos, motions and client correspondence."
          />
        </div>
      </main>
    </div>
  );
}

function AgentCard({
  icon: Icon,
  name,
  description,
  active,
}: {
  icon: React.ComponentType<{ className?: string }>;
  name: string;
  description: string;
  active?: boolean;
}) {
  return (
    <div
      className={`group relative rounded-2xl border border-border bg-surface/80 p-5 transition-colors hover:border-primary/40 ${active ? "legal-pulse" : ""}`}
    >
      <div className="flex items-start justify-between">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg border border-border bg-background/60 text-primary-glow">
          <Icon className="h-5 w-5" />
        </div>
        {active && (
          <span className="text-[10px] font-medium uppercase tracking-wider text-accent">
            Active
          </span>
        )}
      </div>
      <h3 className="mt-4 text-base font-semibold text-foreground">{name}</h3>
      <p className="mt-1 text-sm text-muted-foreground">{description}</p>
    </div>
  );
}
