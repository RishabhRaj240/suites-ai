import { useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import {
  LayoutDashboard,
  UserRound,
  FileText,
  PenLine,
  Search,
  FolderOpen,
  Settings,
  Bell,
  LogOut,
  Plus,
  TrendingUp,
  ChevronRight,
  Briefcase,
  Upload,
  BookOpen,
  CircleDot,
  Menu,
  X,
} from "lucide-react";
import { toast } from "sonner";
import { useSidebar } from "@/hooks/useSidebar";
import { useRipple } from "@/hooks/useRipple";

import { supabase } from "@/integrations/supabase/client";

export interface Profile {
  full_name: string | null;
  email: string | null;
  firm: string | null;
}

type NavItem = {
  id: string;
  label: string;
  icon: React.ComponentType<{ className?: string; strokeWidth?: number }>;
};

const NAV_ITEMS: NavItem[] = [
  { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
  { id: "intake", label: "Intake Agent", icon: UserRound },
  { id: "contracts", label: "Contract Review", icon: FileText },
  { id: "drafting", label: "Drafting Agent", icon: PenLine },
  { id: "research", label: "Research Agent", icon: Search },
  { id: "memory", label: "Case Memory", icon: FolderOpen },
];

const NAV_PATHS: Record<string, string> = {
  dashboard: "/",
  intake: "/intake",
  contracts: "/contracts",
  drafting: "/drafting",
  research: "/research",
  memory: "/memory",
};


const METRIC_CARDS = [
  { label: "Active Cases", value: "12", trend: "+2 this week", icon: Briefcase },
  { label: "Contracts Reviewed", value: "47", trend: "+8 this month", icon: FileText },
  { label: "Notices Drafted", value: "23", trend: "+3 this week", icon: PenLine },
  { label: "Research Queries", value: "89", trend: "+15 this month", icon: BookOpen },
];

const ACTIVITY_LOG = [
  { time: "2 min ago", action: "Contract analyzed: MSA_TechCorp.pdf", agent: "Contract Reviewer", status: "Completed", done: true },
  { time: "14 min ago", action: "New intake started: Smith v. Jones", agent: "Intake Agent", status: "In Progress", done: false },
  { time: "1 hr ago", action: "Notice drafted: Demand Letter #7", agent: "Drafting Agent", status: "Completed", done: true },
  { time: "3 hrs ago", action: "Research query: negligence case law", agent: "Research Agent", status: "Completed", done: true },
];

const QUICK_ACTIONS = [
  { label: "New Intake", icon: Plus, path: "/intake" },
  { label: "Upload Contract", icon: Upload, path: "/contracts" },
  { label: "Draft Notice", icon: PenLine, path: "/drafting" },
  { label: "Start Research", icon: Search, path: "/research" },
];

export function DashboardPage() {
  const navigate = useNavigate();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [activeNav, setActiveNav] = useState("dashboard");
  const [hoveredCard, setHoveredCard] = useState<number | null>(null);
  const [hoveredAction, setHoveredAction] = useState<number | null>(null);
  const { sidebarOpen, openSidebar, closeSidebar } = useSidebar();
  const ripple = useRipple();

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

  const hour = new Date().getHours();
  const greeting =
    hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";

  const initials = displayName
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  return (
    <div className="flex h-screen overflow-hidden bg-[#0A0A0F] font-sans antialiased">

      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div className="sidebar-overlay md:hidden" onClick={closeSidebar} />
      )}

      {/* ── Sidebar ── */}
      <nav
        className={`flex flex-col h-full shrink-0 fixed md:static z-40 transition-transform duration-200 ease-out ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"
        }`}
        style={{ width: 240, background: "#0D0D16", borderRight: "1px solid #1E1E2E" }}
      >
        {/* Logo */}
        <div className="p-6 pb-4">
          <div className="flex items-center gap-2.5">
            <div
              className="flex h-8 w-8 items-center justify-center rounded-lg shrink-0"
              style={{ background: "linear-gradient(135deg, #7C6FFF, #A78BFF)" }}
            >
              <img src="/logo.png" alt="Suites AI" className="h-5 w-5 object-contain" />
            </div>
            <div>
              <span className="text-sm font-bold tracking-tight text-white block leading-tight">Suites AI</span>
              <span className="text-[10px] uppercase tracking-widest" style={{ color: "#7A7A8C" }}>Legal Intelligence</span>
            </div>
          </div>
        </div>

        {/* Nav items */}
        <div className="flex flex-col gap-0.5 px-3 flex-1 overflow-y-auto mt-2">
          {NAV_ITEMS.map(({ id, label, icon: Icon }) => {
            const isActive = activeNav === id;
            const navPath = NAV_PATHS[id];
            return (
              <button
                key={id}
                onClick={() => {
                  setActiveNav(id);
                  if (navPath) navigate({ to: navPath });
                }}
                className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150 w-full text-left relative"
                style={{
                  color: isActive ? "#A78BFF" : "#7A7A8C",
                  background: isActive ? "rgba(124, 111, 255, 0.08)" : "transparent",
                  borderLeft: isActive ? "3px solid #A78BFF" : "3px solid transparent",
                }}
              >
                <Icon className="h-4 w-4 shrink-0" strokeWidth={isActive ? 2.2 : 1.8} />
                {label}
              </button>
            );
          })}
        </div>

        {/* Settings at bottom */}
        <div className="px-3 pb-3" style={{ borderTop: "1px solid #1E1E2E" }}>
          <button
            onClick={() => navigate({ to: "/settings" })}
            className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150 w-full text-left mt-3"
            style={{ color: "#7A7A8C", borderLeft: "3px solid transparent" }}
          >
            <Settings className="h-4 w-4 shrink-0" strokeWidth={1.8} />
            Settings
          </button>

          {/* New Case CTA */}
          <button className="mt-3 w-full flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-semibold text-white transition-opacity hover:opacity-90"
            style={{ background: "linear-gradient(135deg, #7C6FFF, #A78BFF)" }}>
            <Plus className="h-4 w-4" />
            New Case
          </button>
        </div>
      </nav>

      {/* ── Main content ── */}
      <main className="flex-1 flex flex-col h-full overflow-hidden">
        {/* Top bar */}
        <header
          className="h-16 flex items-center justify-between px-8 shrink-0"
          style={{
            background: "rgba(13, 13, 22, 0.85)",
            backdropFilter: "blur(20px)",
            borderBottom: "1px solid #1E1E2E",
          }}
        >
          {/* Hamburger — mobile only */}
          <button
            className="md:hidden p-2 rounded-lg mr-2"
            style={{ color: "#7A7A8C" }}
            onClick={openSidebar}
            aria-label="Open sidebar"
          >
            <Menu className="h-5 w-5" />
          </button>
          <p className="text-base font-semibold text-white">
            {greeting},{" "}
            <span style={{ color: "#A78BFF" }}>{displayName}</span>
          </p>

          <div className="flex items-center gap-3">
            {/* Bell */}
            <button
              className="p-2 rounded-lg transition-colors"
              style={{ color: "#7A7A8C" }}
              onMouseEnter={(e) =>
                ((e.currentTarget as HTMLButtonElement).style.background = "#1E1E2E")
              }
              onMouseLeave={(e) =>
                ((e.currentTarget as HTMLButtonElement).style.background = "transparent")
              }
            >
              <Bell className="h-5 w-5" />
            </button>

            {/* Avatar + Sign out */}
            <div className="relative group">
              <button
                className="flex h-9 w-9 items-center justify-center rounded-full text-xs font-bold text-white"
                style={{ background: "linear-gradient(135deg, #7C6FFF, #A78BFF)" }}
              >
                {initials}
              </button>
              {/* Dropdown on hover */}
              <div
                className="absolute right-0 top-full mt-2 w-44 rounded-xl shadow-2xl opacity-0 group-hover:opacity-100 pointer-events-none group-hover:pointer-events-auto transition-opacity z-50"
                style={{ background: "#0D0D16", border: "1px solid #1E1E2E" }}
              >
                <div className="p-3 border-b" style={{ borderColor: "#1E1E2E" }}>
                  <p className="text-xs font-medium text-white truncate">{displayName}</p>
                  <p className="text-[11px] truncate" style={{ color: "#7A7A8C" }}>
                    {profile?.email}
                  </p>
                </div>
                <button
                  onClick={signOut}
                  className="flex w-full items-center gap-2 px-3 py-2.5 text-xs transition-colors"
                  style={{ color: "#7A7A8C" }}
                  onMouseEnter={(e) => {
                    (e.currentTarget as HTMLButtonElement).style.color = "white";
                    (e.currentTarget as HTMLButtonElement).style.background = "#1E1E2E";
                  }}
                  onMouseLeave={(e) => {
                    (e.currentTarget as HTMLButtonElement).style.color = "#7A7A8C";
                    (e.currentTarget as HTMLButtonElement).style.background = "transparent";
                  }}
                >
                  <LogOut className="h-3.5 w-3.5" />
                  Sign out
                </button>
              </div>
            </div>
          </div>
        </header>

        {/* Scrollable workspace */}
        <div className="flex-1 overflow-y-auto p-10">
          <div className="max-w-5xl mx-auto flex flex-col gap-10">

            {/* ── Page title ── */}
            <section>
              <div>
                <span
                  className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium mb-5"
                  style={{
                    background: "rgba(167, 139, 255, 0.1)",
                    color: "#A78BFF",
                    border: "1px solid rgba(167, 139, 255, 0.2)",
                  }}
                >
                  <span
                    className="h-1.5 w-1.5 rounded-full animate-pulse"
                    style={{ background: "#A78BFF" }}
                  />
                  System Online
                </span>
                <h1 className="text-4xl font-bold text-white mt-3">Overview</h1>
                <p className="mt-2 text-base" style={{ color: "#7A7A8C" }}>
                  Your AI legal assistants are ready.
                </p>
              </div>
            </section>

            {/* ── 2×2 Metric Cards ── */}
            <section className="grid grid-cols-2 gap-5">
              {METRIC_CARDS.map(({ label, value, trend, icon: Icon }, i) => (
                <div
                  key={label}
                  onMouseEnter={() => setHoveredCard(i)}
                  onMouseLeave={() => setHoveredCard(null)}
                  className="card-hover relative overflow-hidden rounded-xl p-6 flex flex-col gap-3 cursor-default"
                  style={{
                    background: "#12121A",
                    border: `1px solid ${hoveredCard === i ? "rgba(124,111,255,0.35)" : "#1E1E2E"}`,
                  }}
                >
                  {/* Radial hover glow */}
                  <div
                    className="absolute inset-0 pointer-events-none transition-opacity duration-300"
                    style={{
                      opacity: hoveredCard === i ? 1 : 0,
                      background: "radial-gradient(circle at bottom left, rgba(124,111,255,0.07), transparent 65%)",
                    }}
                  />

                  {/* Label row */}
                  <div className="flex items-center justify-between">
                    <span
                      className="text-xs font-semibold uppercase tracking-widest"
                      style={{ color: "#7A7A8C" }}
                    >
                      {label}
                    </span>
                    <div
                      className="flex h-8 w-8 items-center justify-center rounded-lg"
                      style={{
                        background: hoveredCard === i ? "rgba(124,111,255,0.15)" : "rgba(30,30,46,0.8)",
                        transition: "background 0.3s",
                      }}
                    >
                      <Icon
                        className="h-4 w-4"
                        style={{ color: hoveredCard === i ? "#A78BFF" : "#7A7A8C" }}
                        strokeWidth={1.8}
                      />
                    </div>
                  </div>

                  {/* Value */}
                  <div className="flex items-baseline gap-3">
                    <span
                      className="text-5xl font-bold leading-none tracking-tight"
                      style={{
                        color: "#A78BFF",
                        textShadow: hoveredCard === i ? "0 0 20px rgba(167,139,255,0.4)" : "none",
                        transition: "text-shadow 0.3s",
                      }}
                    >
                      {value}
                    </span>
                  </div>

                  {/* Trend */}
                  <div className="flex items-center gap-1.5">
                    <TrendingUp className="h-3 w-3" style={{ color: "#A78BFF" }} strokeWidth={2} />
                    <span className="text-xs font-medium" style={{ color: "#A78BFF" }}>
                      {trend}
                    </span>
                  </div>
                </div>
              ))}
            </section>

            {/* ── Recent Activity ── */}
            <section>
              <div className="flex items-center justify-between mb-5">
                <h2 className="text-xl font-semibold text-white">Recent Activity</h2>
                <button
                  className="flex items-center gap-1 text-xs font-medium transition-opacity hover:opacity-70"
                  style={{ color: "#A78BFF" }}
                >
                  View all <ChevronRight className="h-3.5 w-3.5" />
                </button>
              </div>

              <div
                className="rounded-xl overflow-hidden"
                style={{ background: "#0D0D16", border: "1px solid #1E1E2E" }}
              >
                {/* Table header */}
                <div
                  className="grid px-5 py-3 text-xs font-semibold uppercase tracking-widest"
                  style={{
                    color: "#7A7A8C",
                    background: "#0A0A0F",
                    borderBottom: "1px solid #1E1E2E",
                    gridTemplateColumns: "90px 1fr 160px 110px",
                  }}
                >
                  <div>Time</div>
                  <div>Action</div>
                  <div>Agent</div>
                  <div>Status</div>
                </div>

                {/* Rows */}
                {ACTIVITY_LOG.map(({ time, action, agent, status, done }, i, arr) => (
                  <div
                    key={i}
                    className="grid items-center px-5 py-4 transition-colors duration-150"
                    style={{
                      gridTemplateColumns: "90px 1fr 160px 110px",
                      borderBottom: i < arr.length - 1 ? "1px solid #1E1E2E" : undefined,
                    }}
                    onMouseEnter={(e) =>
                      ((e.currentTarget as HTMLDivElement).style.background = "rgba(167,139,255,0.03)")
                    }
                    onMouseLeave={(e) =>
                      ((e.currentTarget as HTMLDivElement).style.background = "transparent")
                    }
                  >
                    {/* Time */}
                    <div className="flex items-center gap-2">
                      <CircleDot
                        className="h-3 w-3 shrink-0"
                        style={{ color: done ? "#A78BFF" : "#7C6FFF" }}
                        strokeWidth={2}
                      />
                      <span className="text-xs" style={{ color: "#7A7A8C" }}>
                        {time}
                      </span>
                    </div>

                    {/* Action */}
                    <span className="text-sm text-white truncate pr-4">{action}</span>

                    {/* Agent badge */}
                    <div>
                      <span
                        className="text-[11px] font-medium px-2.5 py-1 rounded-md whitespace-nowrap"
                        style={{
                          background: "rgba(124,111,255,0.1)",
                          color: "#A78BFF",
                          border: "1px solid rgba(124,111,255,0.2)",
                        }}
                      >
                        {agent}
                      </span>
                    </div>

                    {/* Status chip */}
                    <div>
                      <span
                        className="text-[11px] font-medium px-2.5 py-1 rounded-md whitespace-nowrap"
                        style={
                          done
                            ? { background: "rgba(167,139,255,0.08)", color: "#A78BFF" }
                            : {
                                background: "rgba(124,111,255,0.1)",
                                color: "#A78BFF",
                                boxShadow: "inset 0 0 0 1px rgba(167,139,255,0.3)",
                              }
                        }
                      >
                        {status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </section>

            {/* ── Quick Actions ── */}
            <section>
              <h2 className="text-xl font-semibold text-white mb-5">Quick Actions</h2>
              <div className="flex gap-3 flex-wrap">
                {QUICK_ACTIONS.map(({ label, icon: Icon, path }, i) => (
                  <button
                    key={label}
                    onClick={ripple(() => { if (path) navigate({ to: path }); })}
                    onMouseEnter={() => setHoveredAction(i)}
                    onMouseLeave={() => setHoveredAction(null)}
                    className="ripple-btn flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-medium transition-all duration-200"
                    style={{
                      background: hoveredAction === i ? "rgba(124,111,255,0.06)" : "transparent",
                      border: `1px solid ${hoveredAction === i ? "rgba(124,111,255,0.5)" : "#1E1E2E"}`,
                      color: hoveredAction === i ? "#A78BFF" : "#e4e1e9",
                      boxShadow: hoveredAction === i ? "0 0 12px rgba(124,111,255,0.15)" : "none",
                      cursor: path ? "pointer" : "default",
                    }}
                  >
                    <Icon className="h-4 w-4 shrink-0" strokeWidth={1.8} />
                    {label}
                  </button>
                ))}
              </div>
            </section>

          </div>
        </div>
      </main>
    </div>
  );
}
