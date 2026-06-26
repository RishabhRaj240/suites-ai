import { useNavigate } from "@tanstack/react-router";
import { useCallback, useEffect, useRef, useState } from "react";
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
  Eye,
  MoreHorizontal,
  X,
  ChevronRight,
  SlidersHorizontal,
  FileCheck,
  PenLine as PenLineIcon,
  BookOpen,
  ChevronDown,
  AlertCircle,
  Menu,
} from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import type { Profile } from "./DashboardPage";
import { useSidebar } from "@/hooks/useSidebar";

// ─── Types ────────────────────────────────────────────────────────────────────

type CaseRow = {
  id: string;
  case_number?: string | null;
  client_name: string;
  case_type: string;
  description: string;
  contact_info: string;
  intake_date: string;
  ai_summary: string | null;
  status: string;
  created_at: string;
  updated_at: string;
};

type LinkedContract = {
  id: string;
  file_name: string;
  risk_score: number | null;
  created_at: string;
};

type LinkedDraft = {
  id: string;
  document_type: string;
  party_a: string;
  party_b: string;
  created_at: string;
};

type LinkedResearch = {
  id: string;
  query: string;
  created_at: string;
};

// ─── Constants ────────────────────────────────────────────────────────────────

const NAV_ITEMS = [
  { id: "dashboard", label: "Dashboard", icon: LayoutDashboard, path: "/" },
  { id: "intake", label: "Intake Agent", icon: UserRound, path: "/intake" },
  { id: "contracts", label: "Contract Review", icon: FileText, path: "/contracts" },
  { id: "drafting", label: "Drafting Agent", icon: PenLine, path: "/drafting" },
  { id: "research", label: "Research Agent", icon: Search, path: "/research" },
  { id: "memory", label: "Case Memory", icon: FolderOpen, path: "/memory" },
];

const STATUS_STYLES: Record<string, { bg: string; text: string; border: string }> = {
  active:       { bg: "rgba(45,212,191,0.1)",  text: "#2DD4BF", border: "rgba(45,212,191,0.25)" },
  "under review": { bg: "rgba(124,111,255,0.1)", text: "#A78BFF", border: "rgba(124,111,255,0.25)" },
  closed:       { bg: "rgba(255,255,255,0.05)", text: "#7A7A8C", border: "#1E1E2E" },
  complete:     { bg: "rgba(45,212,191,0.1)",  text: "#2DD4BF", border: "rgba(45,212,191,0.25)" },
};

function statusStyle(s: string) {
  return STATUS_STYLES[s.toLowerCase()] ?? STATUS_STYLES["closed"];
}

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

function riskColor(score: number | null) {
  if (score === null) return "#7A7A8C";
  if (score >= 67) return "#EF4444";
  if (score >= 34) return "#F59E0B";
  return "#22C55E";
}

// ─── Detail Drawer ────────────────────────────────────────────────────────────

function CaseDrawer({
  case_: caseRow,
  onClose,
}: {
  case_: CaseRow;
  onClose: () => void;
}) {
  const navigate = useNavigate();
  const [contracts, setContracts] = useState<LinkedContract[]>([]);
  const [drafts, setDrafts] = useState<LinkedDraft[]>([]);
  const [research, setResearch] = useState<LinkedResearch[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      setLoading(true);
      try {
        const { data: userData } = await supabase.auth.getUser();
        if (!userData.user) return;

        const [{ data: c }, { data: d }, { data: r }] = await Promise.all([
          (supabase.from as any)("contracts")
            .select("id, file_name, risk_score, created_at")
            .eq("user_id", userData.user.id)
            .order("created_at", { ascending: false })
            .limit(3),
          (supabase.from as any)("drafts")
            .select("id, document_type, party_a, party_b, created_at")
            .eq("user_id", userData.user.id)
            .order("created_at", { ascending: false })
            .limit(3),
          (supabase.from as any)("research_queries")
            .select("id, query, created_at")
            .eq("user_id", userData.user.id)
            .order("created_at", { ascending: false })
            .limit(3),
        ]);

        setContracts(c ?? []);
        setDrafts(d ?? []);
        setResearch(r ?? []);
      } catch (e) {
        console.warn("[Drawer load]", e);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [caseRow.id]);

  // Close on Escape
  useEffect(() => {
    function onKey(e: KeyboardEvent) { if (e.key === "Escape") onClose(); }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const sLabel: React.CSSProperties = {
    fontSize: 10,
    fontWeight: 700,
    textTransform: "uppercase",
    letterSpacing: "0.1em",
    color: "#7A7A8C",
    marginBottom: 12,
  };

  const ss = statusStyle(caseRow.status);

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-40"
        style={{ background: "rgba(0,0,0,0.5)", backdropFilter: "blur(2px)" }}
        onClick={onClose}
      />

      {/* Drawer */}
      <div
        className="fixed right-0 top-0 h-full z-50 flex flex-col overflow-hidden"
        style={{
          width: 480,
          background: "#0D0D16",
          borderLeft: "1px solid #1E1E2E",
          boxShadow: "-24px 0 60px rgba(0,0,0,0.6)",
          animation: "drawer-slide-in 0.25s cubic-bezier(.4,0,.2,1)",
        }}
      >
        <style>{`
          @keyframes drawer-slide-in {
            from { transform: translateX(100%); opacity: 0; }
            to   { transform: translateX(0);    opacity: 1; }
          }
        `}</style>

        {/* Drawer header */}
        <div className="px-6 py-5 flex items-start justify-between shrink-0" style={{ borderBottom: "1px solid #1E1E2E" }}>
          <div className="flex flex-col gap-1.5">
            <span className="text-xs font-mono font-semibold" style={{ color: "#A78BFF" }}>
              {caseRow.case_number ?? `CASE-${caseRow.id.slice(0, 4).toUpperCase()}`}
            </span>
            <h3 className="text-xl font-bold text-white">{caseRow.client_name}</h3>
            <span
              className="text-xs font-semibold px-2.5 py-1 rounded-full w-fit"
              style={{ background: ss.bg, color: ss.text, border: `1px solid ${ss.border}` }}
            >
              {caseRow.status.charAt(0).toUpperCase() + caseRow.status.slice(1)}
            </span>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg transition-colors mt-1"
            style={{ color: "#7A7A8C" }}
            onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.color = "white"; (e.currentTarget as HTMLButtonElement).style.background = "#1E1E2E"; }}
            onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.color = "#7A7A8C"; (e.currentTarget as HTMLButtonElement).style.background = "transparent"; }}
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Scrollable content */}
        <div className="flex-1 overflow-y-auto">

          {/* Case Overview */}
          <div className="px-6 py-5" style={{ borderBottom: "1px solid #1E1E2E" }}>
            <p style={sLabel}>Case Overview</p>
            <div className="grid grid-cols-2 gap-3 mb-4">
              {[
                { label: "Case Type", value: caseRow.case_type },
                { label: "Intake Date", value: fmtDate(caseRow.intake_date) },
                { label: "Contact", value: caseRow.contact_info },
                { label: "Last Updated", value: fmtDate(caseRow.updated_at) },
              ].map(({ label, value }) => (
                <div key={label} className="flex flex-col gap-1 p-3 rounded-lg" style={{ background: "#12121A", border: "1px solid #1E1E2E" }}>
                  <span className="text-[10px] uppercase tracking-wider font-semibold" style={{ color: "#7A7A8C" }}>{label}</span>
                  <span className="text-sm font-medium text-white truncate" title={value}>{value}</span>
                </div>
              ))}
            </div>
            {caseRow.ai_summary && (
              <div className="rounded-lg p-4" style={{ background: "rgba(124,111,255,0.06)", border: "1px solid rgba(124,111,255,0.15)" }}>
                <p className="text-xs font-semibold uppercase tracking-wider mb-2" style={{ color: "#A78BFF" }}>AI Summary</p>
                <p className="text-sm leading-relaxed" style={{ color: "#c8c4d7" }}>{caseRow.ai_summary}</p>
              </div>
            )}
          </div>

          {/* Linked Contracts */}
          <div className="px-6 py-5" style={{ borderBottom: "1px solid #1E1E2E" }}>
            <div className="flex items-center justify-between mb-3">
              <p style={{ ...sLabel, marginBottom: 0 }}>Linked Contracts</p>
              <button onClick={() => navigate({ to: "/contracts" })} className="text-xs font-medium transition-colors" style={{ color: "#A78BFF" }}>
                + Upload
              </button>
            </div>
            {loading ? (
              <div className="flex flex-col gap-2">
                {[1, 2].map(i => <div key={i} className="h-10 rounded-lg" style={{ background: "#12121A" }} />)}
              </div>
            ) : contracts.length === 0 ? (
              <p className="text-xs" style={{ color: "#7A7A8C" }}>No contracts linked yet.</p>
            ) : (
              <div className="flex flex-col gap-2">
                {contracts.map((c) => (
                  <div key={c.id} className="flex items-center gap-3 p-3 rounded-lg" style={{ background: "#12121A", border: "1px solid #1E1E2E" }}>
                    <FileCheck className="h-4 w-4 shrink-0" style={{ color: "#A78BFF" }} strokeWidth={1.8} />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium text-white truncate">{c.file_name}</p>
                      <p className="text-[10px]" style={{ color: "#7A7A8C" }}>{fmtDate(c.created_at)}</p>
                    </div>
                    {c.risk_score !== null && (
                      <span className="text-[11px] font-bold px-2 py-0.5 rounded" style={{ color: riskColor(c.risk_score), background: `${riskColor(c.risk_score)}18` }}>
                        {c.risk_score >= 67 ? "HIGH" : c.risk_score >= 34 ? "MED" : "LOW"} {c.risk_score}
                      </span>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Drafted Documents */}
          <div className="px-6 py-5" style={{ borderBottom: "1px solid #1E1E2E" }}>
            <div className="flex items-center justify-between mb-3">
              <p style={{ ...sLabel, marginBottom: 0 }}>Drafted Documents</p>
              <button onClick={() => navigate({ to: "/drafting" })} className="text-xs font-medium" style={{ color: "#A78BFF" }}>
                + New Draft
              </button>
            </div>
            {loading ? (
              <div className="h-10 rounded-lg" style={{ background: "#12121A" }} />
            ) : drafts.length === 0 ? (
              <p className="text-xs" style={{ color: "#7A7A8C" }}>No documents drafted yet.</p>
            ) : (
              <div className="flex flex-col gap-2">
                {drafts.map((d) => (
                  <div key={d.id} className="flex items-center gap-3 p-3 rounded-lg" style={{ background: "#12121A", border: "1px solid #1E1E2E" }}>
                    <PenLineIcon className="h-4 w-4 shrink-0" style={{ color: "#A78BFF" }} strokeWidth={1.8} />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium text-white truncate">{d.document_type} — {d.party_a} vs. {d.party_b}</p>
                      <p className="text-[10px]" style={{ color: "#7A7A8C" }}>{fmtDate(d.created_at)}</p>
                    </div>
                    <button className="text-[11px] font-medium transition-colors" style={{ color: "#A78BFF" }}>View</button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Research Notes */}
          <div className="px-6 py-5" style={{ borderBottom: "1px solid #1E1E2E" }}>
            <div className="flex items-center justify-between mb-3">
              <p style={{ ...sLabel, marginBottom: 0 }}>Research Notes</p>
              <button onClick={() => navigate({ to: "/research" })} className="text-xs font-medium" style={{ color: "#A78BFF" }}>
                + Research
              </button>
            </div>
            {loading ? (
              <div className="h-10 rounded-lg" style={{ background: "#12121A" }} />
            ) : research.length === 0 ? (
              <p className="text-xs" style={{ color: "#7A7A8C" }}>No research queries yet.</p>
            ) : (
              <div className="flex flex-col gap-2">
                {research.map((r) => (
                  <div key={r.id} className="flex items-center gap-3 p-3 rounded-lg" style={{ background: "#12121A", border: "1px solid #1E1E2E" }}>
                    <BookOpen className="h-4 w-4 shrink-0" style={{ color: "#2DD4BF" }} strokeWidth={1.8} />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium text-white truncate">"{r.query}"</p>
                      <p className="text-[10px]" style={{ color: "#7A7A8C" }}>{fmtDate(r.created_at)}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Full Description */}
          <div className="px-6 py-5">
            <p style={sLabel}>Full Description</p>
            <p className="text-sm leading-relaxed" style={{ color: "#c8c4d7" }}>
              {caseRow.description || "No description provided."}
            </p>
          </div>
        </div>

        {/* Drawer footer */}
        <div
          className="px-6 py-4 flex items-center justify-between shrink-0"
          style={{ borderTop: "1px solid #1E1E2E" }}
        >
          <button
            onClick={() => navigate({ to: "/intake" })}
            className="px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200"
            style={{ background: "transparent", border: "1px solid #1E1E2E", color: "#7A7A8C" }}
            onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.borderColor = "rgba(124,111,255,0.4)"; (e.currentTarget as HTMLButtonElement).style.color = "#A78BFF"; }}
            onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.borderColor = "#1E1E2E"; (e.currentTarget as HTMLButtonElement).style.color = "#7A7A8C"; }}
          >
            Edit Case
          </button>
          <button
            className="px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200"
            style={{ background: "transparent", border: "1px solid rgba(239,68,68,0.3)", color: "#EF4444" }}
            onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.background = "rgba(239,68,68,0.08)"; }}
            onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.background = "transparent"; }}
            onClick={() => toast("Case closure coming soon")}
          >
            Close Case
          </button>
        </div>
      </div>
    </>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export function CaseMemoryPage() {
  const navigate = useNavigate();
  const [profile, setProfile] = useState<Profile | null>(null);
  const { sidebarOpen, openSidebar, closeSidebar } = useSidebar();
  const [cases, setCases] = useState<CaseRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCase, setSelectedCase] = useState<CaseRow | null>(null);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState("all");
  const [sortOrder, setSortOrder] = useState<"newest" | "oldest">("newest");
  const [hoveredRow, setHoveredRow] = useState<string | null>(null);

  useEffect(() => {
    supabase.auth.getUser().then(async ({ data }) => {
      if (!data.user) return;
      const { data: row } = await supabase
        .from("profiles")
        .select("full_name, email, firm")
        .eq("id", data.user.id)
        .maybeSingle();
      setProfile(row ?? { full_name: null, email: data.user.email ?? null, firm: null });
      await loadCases(data.user.id);
    });
  }, []);

  async function loadCases(userId: string) {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("cases")
        .select("*")
        .eq("user_id", userId)
        .order("created_at", { ascending: false });
      if (error) throw error;
      setCases((data as unknown as CaseRow[]) ?? []);
    } catch (e) {
      console.error(e);
      toast.error("Failed to load cases");
    } finally {
      setLoading(false);
    }
  }

  const displayName = profile?.full_name || profile?.email?.split("@")[0] || "Counselor";
  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";
  const initials = displayName.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2);

  // Filter + sort
  const filtered = cases
    .filter((c) => {
      const q = search.toLowerCase();
      const matchSearch = !q ||
        c.client_name.toLowerCase().includes(q) ||
        c.case_type.toLowerCase().includes(q) ||
        (c.case_number ?? "").toLowerCase().includes(q);
      const matchStatus = statusFilter === "all" || c.status.toLowerCase() === statusFilter;
      const matchType = typeFilter === "all" || c.case_type.toLowerCase().includes(typeFilter.toLowerCase());
      return matchSearch && matchStatus && matchType;
    })
    .sort((a, b) => {
      const da = new Date(a.created_at).getTime();
      const db = new Date(b.created_at).getTime();
      return sortOrder === "newest" ? db - da : da - db;
    });

  const uniqueTypes = [...new Set(cases.map((c) => c.case_type))];

  async function signOut() {
    await supabase.auth.signOut();
    navigate({ to: "/auth", replace: true });
  }

  const colStyle = (w?: number | string): React.CSSProperties => ({
    width: w,
    padding: "0 16px",
    flexShrink: typeof w === "number" ? 0 : undefined,
  });

  const thStyle: React.CSSProperties = {
    fontSize: 11,
    fontWeight: 700,
    textTransform: "uppercase",
    letterSpacing: "0.08em",
    color: "#7A7A8C",
  };

  return (
    <div className="flex h-screen overflow-hidden bg-[#0A0A0F] font-sans antialiased">

      {sidebarOpen && <div className="sidebar-overlay md:hidden" onClick={closeSidebar} />}

      {/* ── Sidebar ── */}
      <nav
        className={`flex flex-col h-full shrink-0 fixed md:static z-40 transition-transform duration-200 ease-out ${sidebarOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"}`}
        style={{ width: 240, background: "#0D0D16", borderRight: "1px solid #1E1E2E" }}
      >
        <div className="p-6 pb-4">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg shrink-0" style={{ background: "linear-gradient(135deg, #7C6FFF, #A78BFF)" }}>
              <img src="/logo.png" alt="Suites AI" className="h-5 w-5 object-contain" />
            </div>
            <div>
              <span className="text-sm font-bold tracking-tight text-white block leading-tight">Suites AI</span>
              <span className="text-[10px] uppercase tracking-widest" style={{ color: "#7A7A8C" }}>Legal Intelligence</span>
            </div>
          </div>
        </div>
        <div className="flex flex-col gap-0.5 px-3 flex-1 overflow-y-auto mt-2">
          {NAV_ITEMS.map(({ id, label, icon: Icon, path }) => {
            const isActive = id === "memory";
            return (
              <button
                key={id}
                onClick={() => navigate({ to: path })}
                className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150 w-full text-left"
                style={{
                  color: isActive ? "#A78BFF" : "#7A7A8C",
                  background: isActive ? "rgba(124,111,255,0.08)" : "transparent",
                  borderLeft: isActive ? "3px solid #A78BFF" : "3px solid transparent",
                }}
              >
                <Icon className="h-4 w-4 shrink-0" strokeWidth={isActive ? 2.2 : 1.8} />
                {label}
              </button>
            );
          })}
        </div>
        <div className="px-3 pb-3" style={{ borderTop: "1px solid #1E1E2E" }}>
          <button onClick={() => navigate({ to: "/settings" })} className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium w-full text-left mt-3" style={{ color: "#7A7A8C", borderLeft: "3px solid transparent" }}>
            <Settings className="h-4 w-4 shrink-0" strokeWidth={1.8} />
            Settings
          </button>
          <button
            onClick={() => navigate({ to: "/intake" })}
            className="mt-3 w-full flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-semibold text-white hover:opacity-90 transition-opacity"
            style={{ background: "linear-gradient(135deg, #7C6FFF, #A78BFF)" }}
          >
            <Plus className="h-4 w-4" />
            New Case
          </button>
        </div>
      </nav>

      {/* ── Main ── */}
      <main className="flex-1 flex flex-col h-full overflow-hidden">

        {/* Header */}
        <header
          className="h-16 flex items-center justify-between px-8 shrink-0"
          style={{ background: "rgba(13,13,22,0.85)", backdropFilter: "blur(20px)", borderBottom: "1px solid #1E1E2E" }}
        >
          <div className="flex items-center gap-2 text-sm" style={{ color: "#7A7A8C" }}>
            <button
              onClick={openSidebar}
              className="md:hidden p-1.5 rounded-lg mr-1 hover:text-white transition-colors"
              aria-label="Open sidebar"
            >
              <Menu className="h-5 w-5" />
            </button>
            <button onClick={() => navigate({ to: "/" })} className="hover:text-white transition-colors">Dashboard</button>
            <ChevronRight className="h-3.5 w-3.5" />
            <span className="text-white font-medium">Case Memory</span>
          </div>
          <div className="flex items-center gap-3">
            <p className="text-sm font-semibold text-white hidden lg:block">
              {greeting}, <span style={{ color: "#A78BFF" }}>{displayName}</span>
            </p>
            <button className="p-2 rounded-lg" style={{ color: "#7A7A8C" }}>
              <Bell className="h-5 w-5" />
            </button>
            <div className="relative group">
              <button className="flex h-9 w-9 items-center justify-center rounded-full text-xs font-bold text-white" style={{ background: "linear-gradient(135deg, #7C6FFF, #A78BFF)" }}>
                {initials}
              </button>
              <div className="absolute right-0 top-full mt-2 w-44 rounded-xl shadow-2xl opacity-0 group-hover:opacity-100 pointer-events-none group-hover:pointer-events-auto transition-opacity z-50" style={{ background: "#0D0D16", border: "1px solid #1E1E2E" }}>
                <div className="p-3 border-b" style={{ borderColor: "#1E1E2E" }}>
                  <p className="text-xs font-medium text-white truncate">{displayName}</p>
                  <p className="text-[11px] truncate" style={{ color: "#7A7A8C" }}>{profile?.email}</p>
                </div>
                <button onClick={signOut} className="flex w-full items-center gap-2 px-3 py-2.5 text-xs rounded-b-xl" style={{ color: "#7A7A8C" }}
                  onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.color = "white"; (e.currentTarget as HTMLButtonElement).style.background = "#1E1E2E"; }}
                  onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.color = "#7A7A8C"; (e.currentTarget as HTMLButtonElement).style.background = "transparent"; }}>
                  <LogOut className="h-3.5 w-3.5" />
                  Sign out
                </button>
              </div>
            </div>
          </div>
        </header>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-8">
          <div className="max-w-7xl mx-auto flex flex-col gap-6">

            {/* Page header */}
            <div className="flex items-end justify-between">
              <div>
                <span className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium mb-4" style={{ background: "rgba(167,139,255,0.1)", color: "#A78BFF", border: "1px solid rgba(167,139,255,0.2)" }}>
                  <span className="h-1.5 w-1.5 rounded-full animate-pulse" style={{ background: "#A78BFF" }} />
                  Case Memory Active
                </span>
                <h1 className="text-3xl font-bold text-white">Case Memory</h1>
                <p className="text-sm mt-1" style={{ color: "#7A7A8C" }}>
                  All your cases, linked documents, and research in one view · {cases.length} total
                </p>
              </div>
              <button
                onClick={() => navigate({ to: "/intake" })}
                className="flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-semibold text-white transition-all duration-200"
                style={{ background: "linear-gradient(135deg, #7C6FFF, #A78BFF)", boxShadow: "0 4px 16px rgba(124,111,255,0.3)" }}
              >
                <Plus className="h-4 w-4" />
                New Intake
              </button>
            </div>

            {/* Search + Filter bar */}
            <div
              className="flex items-center gap-3 rounded-xl"
              style={{ background: "#0D0D16", border: "1px solid #1E1E2E", padding: "12px 16px" }}
            >
              <Search className="h-4 w-4 shrink-0" style={{ color: "#7A7A8C" }} />
              <input
                type="text"
                placeholder="Search cases, clients, types..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="flex-1 bg-transparent text-sm text-white placeholder:text-[#7A7A8C] outline-none"
              />
              <div className="h-5 w-px shrink-0" style={{ background: "#1E1E2E" }} />
              {/* Status filter */}
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="text-xs px-3 py-2 rounded-lg appearance-none cursor-pointer"
                style={{ background: "#12121A", border: "1px solid #1E1E2E", color: "#c8c4d7", outline: "none" }}
              >
                <option value="all">All Status</option>
                <option value="active">Active</option>
                <option value="under review">Under Review</option>
                <option value="complete">Complete</option>
                <option value="closed">Closed</option>
              </select>
              {/* Type filter */}
              <select
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value)}
                className="text-xs px-3 py-2 rounded-lg appearance-none cursor-pointer"
                style={{ background: "#12121A", border: "1px solid #1E1E2E", color: "#c8c4d7", outline: "none" }}
              >
                <option value="all">All Types</option>
                {uniqueTypes.map((t) => <option key={t} value={t}>{t}</option>)}
              </select>
              {/* Sort */}
              <select
                value={sortOrder}
                onChange={(e) => setSortOrder(e.target.value as "newest" | "oldest")}
                className="text-xs px-3 py-2 rounded-lg appearance-none cursor-pointer"
                style={{ background: "#12121A", border: "1px solid #1E1E2E", color: "#c8c4d7", outline: "none" }}
              >
                <option value="newest">Newest First</option>
                <option value="oldest">Oldest First</option>
              </select>
              <button
                className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold transition-all duration-200"
                style={{ background: "rgba(124,111,255,0.1)", color: "#A78BFF", border: "1px solid rgba(124,111,255,0.25)" }}
              >
                <SlidersHorizontal className="h-3.5 w-3.5" />
                Filter
              </button>
            </div>

            {/* Table */}
            <div className="rounded-xl overflow-hidden" style={{ background: "#0D0D16", border: "1px solid #1E1E2E" }}>

              {/* Table header */}
              <div
                className="flex items-center"
                style={{ background: "#12121A", borderBottom: "1px solid #1E1E2E", height: 44 }}
              >
                <div style={{ ...colStyle(140), ...thStyle }}>Case ID</div>
                <div style={{ ...colStyle(), flex: 1, ...thStyle }}>Client Name</div>
                <div style={{ ...colStyle(180), ...thStyle }}>Type</div>
                <div style={{ ...colStyle(140), ...thStyle }}>Status</div>
                <div style={{ ...colStyle(150), ...thStyle }}>Date Created</div>
                <div style={{ ...colStyle(100), ...thStyle }}>Actions</div>
              </div>

              {/* Loading state */}
              {loading && (
                <div className="flex flex-col">
                  {[1, 2, 3, 4].map((i) => (
                    <div key={i} className="flex items-center" style={{ height: 60, borderBottom: "1px solid #1E1E2E" }}>
                      {[140, 0, 180, 140, 150, 100].map((w, j) => (
                        <div key={j} style={{ ...colStyle(w || undefined), flex: w === 0 ? 1 : undefined }}>
                          <div className="h-4 rounded" style={{ background: "#1E1E2E", width: `${60 + (i * j * 7) % 30}%`, opacity: 0.6 }} />
                        </div>
                      ))}
                    </div>
                  ))}
                </div>
              )}

              {/* Empty state */}
              {!loading && filtered.length === 0 && (
                <div className="flex flex-col items-center justify-center gap-4 py-16">
                  <div className="flex h-14 w-14 items-center justify-center rounded-2xl" style={{ background: "#12121A", border: "1px solid #1E1E2E" }}>
                    <AlertCircle className="h-7 w-7" style={{ color: "#7A7A8C" }} strokeWidth={1.5} />
                  </div>
                  <div className="text-center">
                    <p className="text-base font-semibold text-white">
                      {cases.length === 0 ? "No cases yet" : "No matching cases"}
                    </p>
                    <p className="text-sm mt-1" style={{ color: "#7A7A8C" }}>
                      {cases.length === 0 ? "Create your first case via the Intake Agent." : "Try adjusting your search or filters."}
                    </p>
                  </div>
                  {cases.length === 0 && (
                    <button
                      onClick={() => navigate({ to: "/intake" })}
                      className="flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-semibold text-white"
                      style={{ background: "linear-gradient(135deg, #7C6FFF, #A78BFF)" }}
                    >
                      <Plus className="h-4 w-4" />
                      New Intake
                    </button>
                  )}
                </div>
              )}

              {/* Rows */}
              {!loading && filtered.map((c) => {
                const ss = statusStyle(c.status);
                const isSelected = selectedCase?.id === c.id;
                const isHovered = hoveredRow === c.id;
                return (
                  <div
                    key={c.id}
                    className="flex items-center cursor-pointer transition-all duration-150"
                    style={{
                      height: 60,
                      borderBottom: "1px solid #1E1E2E",
                      background: isSelected
                        ? "rgba(124,111,255,0.08)"
                        : isHovered
                        ? "rgba(124,111,255,0.04)"
                        : "transparent",
                      borderLeft: isSelected ? "3px solid #7C6FFF" : "3px solid transparent",
                    }}
                    onMouseEnter={() => setHoveredRow(c.id)}
                    onMouseLeave={() => setHoveredRow(null)}
                    onClick={() => setSelectedCase(isSelected ? null : c)}
                  >
                    {/* Case ID */}
                    <div style={colStyle(140)}>
                      <span className="text-xs font-mono font-semibold" style={{ color: "#A78BFF" }}>
                        {c.case_number ?? `CASE-${c.id.slice(0, 4).toUpperCase()}`}
                      </span>
                    </div>
                    {/* Client Name */}
                    <div style={{ ...colStyle(), flex: 1 }}>
                      <span className="text-sm font-semibold text-white">{c.client_name}</span>
                    </div>
                    {/* Type */}
                    <div style={colStyle(180)}>
                      <span className="text-sm" style={{ color: "#7A7A8C" }}>{c.case_type}</span>
                    </div>
                    {/* Status */}
                    <div style={colStyle(140)}>
                      <span
                        className="text-xs font-semibold px-2.5 py-1 rounded-full"
                        style={{ background: ss.bg, color: ss.text, border: `1px solid ${ss.border}` }}
                      >
                        {c.status.charAt(0).toUpperCase() + c.status.slice(1)}
                      </span>
                    </div>
                    {/* Date */}
                    <div style={colStyle(150)}>
                      <span className="text-xs" style={{ color: "#7A7A8C" }}>{fmtDate(c.created_at)}</span>
                    </div>
                    {/* Actions */}
                    <div style={colStyle(100)} onClick={(e) => e.stopPropagation()}>
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => setSelectedCase(isSelected ? null : c)}
                          className="p-2 rounded-lg transition-all duration-150"
                          style={{ color: isSelected ? "#A78BFF" : "#7A7A8C" }}
                          onMouseEnter={(e) => (e.currentTarget as HTMLButtonElement).style.color = "#A78BFF"}
                          onMouseLeave={(e) => (e.currentTarget as HTMLButtonElement).style.color = isSelected ? "#A78BFF" : "#7A7A8C"}
                        >
                          <Eye className="h-4 w-4" />
                        </button>
                        <button
                          className="p-2 rounded-lg transition-all duration-150"
                          style={{ color: "#7A7A8C" }}
                          onMouseEnter={(e) => (e.currentTarget as HTMLButtonElement).style.color = "#A78BFF"}
                          onMouseLeave={(e) => (e.currentTarget as HTMLButtonElement).style.color = "#7A7A8C"}
                          onClick={() => toast(`More options for ${c.client_name} coming soon`)}
                        >
                          <MoreHorizontal className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Footer count */}
            {!loading && filtered.length > 0 && (
              <p className="text-xs text-center" style={{ color: "#7A7A8C" }}>
                Showing {filtered.length} of {cases.length} cases
              </p>
            )}

          </div>
        </div>
      </main>

      {/* Detail Drawer */}
      {selectedCase && (
        <CaseDrawer
          case_={selectedCase}
          onClose={() => setSelectedCase(null)}
        />
      )}
    </div>
  );
}
