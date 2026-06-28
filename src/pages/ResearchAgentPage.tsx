import { useNavigate } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
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
  Clock,
  BookOpen,
  ChevronRight,
  Menu,
  ChevronDown,
  Bookmark,
  Sparkles,
  ArrowRight,
  X,
} from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { searchLegal, deepDiveResearch } from "@/lib/researchAgent";
import type { ResearchResult, DeepDiveResult } from "@/lib/researchAgent";
import { callResearch, isFastApiConfigured } from "@/lib/apiClient";
import type { Profile } from "./DashboardPage";
import { useSidebar } from "@/hooks/useSidebar";
import { useRipple } from "@/hooks/useRipple";

// ─── Constants ────────────────────────────────────────────────────────────────

const NAV_ITEMS = [
  { id: "dashboard", label: "Dashboard", icon: LayoutDashboard, path: "/" },
  { id: "intake", label: "Intake Agent", icon: UserRound, path: "/intake" },
  { id: "contracts", label: "Contract Review", icon: FileText, path: "/contracts" },
  { id: "drafting", label: "Drafting Agent", icon: PenLine, path: "/drafting" },
  { id: "research", label: "Research Agent", icon: Search, path: "/research" },
  { id: "memory", label: "Case Memory", icon: FolderOpen, path: "/" },
];

const QUICK_TAGS = ["Contract Law", "Criminal Procedure", "IP & Patents", "Employment Law", "Constitutional Law"];

const CATEGORY_COLORS: Record<string, { bg: string; text: string; border: string; label: string }> = {
  case_law:   { bg: "rgba(124,111,255,0.08)", text: "#A78BFF", border: "rgba(124,111,255,0.2)", label: "Case Law" },
  statute:    { bg: "rgba(34,197,94,0.08)",   text: "#22C55E", border: "rgba(34,197,94,0.2)",   label: "Statute" },
  academic:   { bg: "rgba(245,158,11,0.08)",  text: "#F59E0B", border: "rgba(245,158,11,0.2)",  label: "Academic" },
  regulation: { bg: "rgba(45,212,191,0.08)",  text: "#2DD4BF", border: "rgba(45,212,191,0.2)",  label: "Regulation" },
};

// ─── Relevance Arc ─────────────────────────────────────────────────────────────

function RelevanceArc({ score }: { score: number }) {
  const color = score >= 90 ? "#22C55E" : score >= 70 ? "#F59E0B" : "#EF4444";
  const r = 16;
  const circ = 2 * Math.PI * r;
  const filled = (score / 100) * circ;

  return (
    <div className="flex flex-col items-center gap-0.5 shrink-0">
      <div className="relative" style={{ width: 44, height: 44 }}>
        <svg width={44} height={44} style={{ transform: "rotate(-90deg)" }}>
          <circle cx={22} cy={22} r={r} fill="none" stroke="#1E1E2E" strokeWidth={4} />
          <circle
            cx={22} cy={22} r={r}
            fill="none"
            stroke={color}
            strokeWidth={4}
            strokeLinecap="round"
            strokeDasharray={`${filled} ${circ}`}
            style={{ filter: `drop-shadow(0 0 4px ${color}88)`, transition: "stroke-dasharray 0.8s ease" }}
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-[10px] font-bold" style={{ color }}>{score}</span>
        </div>
      </div>
      <span className="text-[10px] uppercase tracking-wide" style={{ color: "#7A7A8C" }}>Match</span>
    </div>
  );
}

// ─── Deep Dive Panel ──────────────────────────────────────────────────────────

function DeepDivePanel({ brief, loading }: { brief: DeepDiveResult | null; loading: boolean }) {
  if (loading) {
    return (
      <div
        className="mt-4 rounded-xl p-5 flex flex-col gap-3"
        style={{ background: "rgba(45,212,191,0.04)", borderLeft: "3px solid #2DD4BF" }}
      >
        <style>{`
          @keyframes shimmer-dd {
            0%   { background-position: -200% 0; }
            100% { background-position: 200% 0; }
          }
          .dd-shimmer {
            background: linear-gradient(90deg, #1E1E2E 25%, #2a3a38 50%, #1E1E2E 75%);
            background-size: 200% 100%;
            animation: shimmer-dd 1.4s infinite;
            border-radius: 4px;
          }
        `}</style>
        <div className="flex items-center gap-2">
          <span className="h-1.5 w-1.5 rounded-full animate-pulse" style={{ background: "#2DD4BF" }} />
          <span className="text-xs font-semibold uppercase tracking-widest" style={{ color: "#2DD4BF" }}>
            Deep Dive Research Brief
          </span>
        </div>
        {[80, 95, 70, 85, 60, 90].map((w, i) => (
          <div key={i} className="dd-shimmer h-2.5" style={{ width: `${w}%` }} />
        ))}
      </div>
    );
  }

  if (!brief) return null;

  const sections = [
    { label: "Key Holding", text: brief.keyHolding },
    { label: "Legal Significance", text: brief.legalSignificance },
    { label: "Modern Application", text: brief.modernApplication },
  ];

  return (
    <div
      className="mt-4 rounded-xl p-5 flex flex-col gap-4"
      style={{ background: "rgba(45,212,191,0.04)", borderLeft: "3px solid #2DD4BF" }}
    >
      <div className="flex items-center gap-2">
        <BookOpen className="h-3.5 w-3.5 shrink-0" style={{ color: "#2DD4BF" }} />
        <span className="text-xs font-semibold uppercase tracking-widest" style={{ color: "#2DD4BF" }}>
          Research Brief
        </span>
      </div>
      {sections.map(({ label, text }) => (
        <div key={label}>
          <p className="text-xs font-semibold uppercase tracking-wider mb-1.5" style={{ color: "#7A7A8C" }}>
            {label}
          </p>
          <p className="text-sm leading-relaxed" style={{ color: "#c8c4d7" }}>{text}</p>
        </div>
      ))}
    </div>
  );
}

// ─── Result Card ──────────────────────────────────────────────────────────────

function ResultCard({
  result,
  query,
  index,
}: {
  result: ResearchResult;
  query: string;
  index: number;
}) {
  const [expanded, setExpanded] = useState(false);
  const [brief, setBrief] = useState<DeepDiveResult | null>(null);
  const [loadingBrief, setLoadingBrief] = useState(false);
  const [bookmarked, setBookmarked] = useState(false);

  const cat = CATEGORY_COLORS[result.category] ?? CATEGORY_COLORS["case_law"];

  async function handleDeepDive() {
    setExpanded((e) => {
      const next = !e;
      if (next && !brief && !loadingBrief) {
        setLoadingBrief(true);
        deepDiveResearch({ data: { query, title: result.title, excerpt: result.excerpt } })
          .then((res) => { setBrief(res); setLoadingBrief(false); })
          .catch(() => setLoadingBrief(false));
      }
      return next;
    });
  }

  return (
    <div
      className="rounded-xl p-6 flex flex-col gap-4 transition-all duration-200"
      style={{
        background: "#0D0D16",
        border: "1px solid #1E1E2E",
        animationDelay: `${index * 80}ms`,
      }}
      onMouseEnter={(e) => (e.currentTarget as HTMLDivElement).style.borderColor = "rgba(124,111,255,0.3)"}
      onMouseLeave={(e) => (e.currentTarget as HTMLDivElement).style.borderColor = "#1E1E2E"}
    >
      {/* Row 1: Meta */}
      <div className="flex flex-wrap items-center gap-2">
        <span
          className="text-[11px] font-semibold px-2.5 py-1 rounded-full"
          style={{ background: cat.bg, color: cat.text, border: `1px solid ${cat.border}` }}
        >
          {cat.label}
        </span>
        <span className="text-xs font-medium" style={{ color: "#7A7A8C" }}>
          {result.source} · {result.jurisdiction}
        </span>
        <div className="ml-auto">
          <RelevanceArc score={result.relevanceScore} />
        </div>
      </div>

      {/* Row 2: Title */}
      <h3 className="text-base font-semibold text-white leading-snug">{result.title}</h3>

      {/* Row 3: Excerpt */}
      <p className="text-sm leading-relaxed" style={{ color: "#7A7A8C" }}>{result.excerpt}</p>

      {/* Row 4: Actions */}
      <div className="flex items-center gap-3">
        <button
          onClick={handleDeepDive}
          className="flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold transition-all duration-200"
          style={{
            background: expanded ? "rgba(124,111,255,0.15)" : "rgba(124,111,255,0.08)",
            color: "#A78BFF",
            border: "1px solid rgba(124,111,255,0.25)",
          }}
          onMouseEnter={(e) => (e.currentTarget as HTMLButtonElement).style.background = "rgba(124,111,255,0.18)"}
          onMouseLeave={(e) => (e.currentTarget as HTMLButtonElement).style.background = expanded ? "rgba(124,111,255,0.15)" : "rgba(124,111,255,0.08)"}
        >
          {expanded ? (
            <>
              <ChevronDown className="h-3.5 w-3.5" />
              Collapse
            </>
          ) : (
            <>
              Deep Dive
              <ArrowRight className="h-3.5 w-3.5" />
            </>
          )}
        </button>
        <button
          onClick={() => setBookmarked((b) => !b)}
          className="p-2 rounded-lg transition-all duration-200"
          style={{
            color: bookmarked ? "#A78BFF" : "#7A7A8C",
            background: bookmarked ? "rgba(124,111,255,0.1)" : "transparent",
            border: `1px solid ${bookmarked ? "rgba(124,111,255,0.25)" : "#1E1E2E"}`,
          }}
        >
          <Bookmark className="h-3.5 w-3.5" fill={bookmarked ? "#A78BFF" : "none"} />
        </button>
        <span className="text-xs ml-auto" style={{ color: "#7A7A8C" }}>
          {new Date().toLocaleDateString("en-US", { month: "short", day: "numeric" })}
        </span>
      </div>

      {/* Deep Dive expansion */}
      {expanded && <DeepDivePanel brief={brief} loading={loadingBrief} />}
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export function ResearchAgentPage() {
  const navigate = useNavigate();
  const [profile, setProfile] = useState<Profile | null>(null);
  const { sidebarOpen, openSidebar, closeSidebar } = useSidebar();
  const ripple = useRipple();
  const [query, setQuery] = useState("");
  const [searching, setSearching] = useState(false);
  const [results, setResults] = useState<ResearchResult[] | null>(null);
  const [activeQuery, setActiveQuery] = useState("");
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const [searchFocused, setSearchFocused] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    supabase.auth.getUser().then(async ({ data }) => {
      if (!data.user) return;
      const { data: row } = await supabase
        .from("profiles")
        .select("full_name, email, firm")
        .eq("id", data.user.id)
        .maybeSingle();
      setProfile(row ?? { full_name: null, email: data.user.email ?? null, firm: null });

      // Load recent searches from Supabase
      try {
        const { data: recents } = await (supabase.from as any)("research_queries")
          .select("query")
          .eq("user_id", data.user.id)
          .order("created_at", { ascending: false })
          .limit(5);
        if (recents) {
          const unique = [...new Set<string>(recents.map((r: { query: string }) => r.query))];
          setRecentSearches(unique);
        }
      } catch {
        // table may not exist yet
      }
    });
  }, []);

  const displayName = profile?.full_name || profile?.email?.split("@")[0] || "Counselor";
  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";
  const initials = displayName.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2);

  async function handleSearch(q?: string) {
    const searchQuery = (q ?? query).trim();
    if (!searchQuery) return;

    setSearching(true);
    setResults(null);
    setActiveQuery(searchQuery);

    try {
      // Try FastAPI backend first if configured
      let res: ResearchResult[];
      if (isFastApiConfigured()) {
        try {
          const apiRes = await callResearch({ query: searchQuery });
          // Normalize snake_case → camelCase from backend
          res = apiRes.results.map((r) => ({
            id: r.id,
            title: r.title,
            source: r.source,
            jurisdiction: r.jurisdiction,
            relevanceScore: r.relevance_score,
            excerpt: r.excerpt,
            category: r.category,
          }));
        } catch (apiErr) {
          console.warn("[FastAPI /research fallback]", apiErr);
          const fallback = await searchLegal({ data: { query: searchQuery } });
          res = fallback.results;
        }
      } else {
        const fallback = await searchLegal({ data: { query: searchQuery } });
        res = fallback.results;
      }
      setResults(res);

      // Save to Supabase — both legacy research_queries and canonical research_logs
      try {
        const { data: userData } = await supabase.auth.getUser();
        if (userData.user) {
          const uid = userData.user.id;
          // Legacy table (backward compat)
          await (supabase.from as any)("research_queries").insert({
            user_id: uid,
            query: searchQuery,
            results: res,
          });
          // Canonical spec table
          await (supabase.from as any)("research_logs").insert({
            user_id: uid,
            query: searchQuery,
            result_json: res,
          });
          if (!recentSearches.includes(searchQuery)) {
            setRecentSearches((prev) => [searchQuery, ...prev].slice(0, 5));
          }
        }
      } catch { /* silent */ }
    } catch (err: any) {
      toast.error("Search failed, please try again");
    } finally {
      setSearching(false);
    }
  }

  function handleQuickTag(tag: string) {
    setQuery(tag);
    handleSearch(tag);
  }

  function handleRecentSearch(q: string) {
    setQuery(q);
    handleSearch(q);
  }

  function handleNewSearch() {
    setResults(null);
    setActiveQuery("");
    setQuery("");
    setTimeout(() => inputRef.current?.focus(), 100);
  }

  async function signOut() {
    await supabase.auth.signOut();
    navigate({ to: "/auth", replace: true });
  }

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
        <div className="flex flex-col gap-0.5 px-3 flex-1 overflow-y-auto mt-2">
          {NAV_ITEMS.map(({ id, label, icon: Icon, path }) => {
            const isActive = id === "research";
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
          <button
            onClick={() => navigate({ to: "/settings" })}
            className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium w-full text-left mt-3"
            style={{ color: "#7A7A8C", borderLeft: "3px solid transparent" }}
          >
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
          className="h-16 flex items-center justify-between px-4 md:px-8 shrink-0"
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
            <span className="text-white font-medium">Research Agent</span>
          </div>
          <div className="flex items-center gap-3">
            <p className="text-sm font-semibold text-white hidden lg:block">
              {greeting}, <span style={{ color: "#A78BFF" }}>{displayName}</span>
            </p>
            <button className="p-2 rounded-lg" style={{ color: "#7A7A8C" }}>
              <Bell className="h-5 w-5" />
            </button>
            <div className="relative group">
              <button
                className="flex h-9 w-9 items-center justify-center rounded-full text-xs font-bold text-white"
                style={{ background: "linear-gradient(135deg, #7C6FFF, #A78BFF)" }}
              >
                {initials}
              </button>
              <div
                className="absolute right-0 top-full mt-2 w-44 rounded-xl shadow-2xl opacity-0 group-hover:opacity-100 pointer-events-none group-hover:pointer-events-auto transition-opacity z-50"
                style={{ background: "#0D0D16", border: "1px solid #1E1E2E" }}
              >
                <div className="p-3 border-b" style={{ borderColor: "#1E1E2E" }}>
                  <p className="text-xs font-medium text-white truncate">{displayName}</p>
                  <p className="text-[11px] truncate" style={{ color: "#7A7A8C" }}>{profile?.email}</p>
                </div>
                <button
                  onClick={signOut}
                  className="flex w-full items-center gap-2 px-3 py-2.5 text-xs rounded-b-xl"
                  style={{ color: "#7A7A8C" }}
                  onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.color = "white"; (e.currentTarget as HTMLButtonElement).style.background = "#1E1E2E"; }}
                  onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.color = "#7A7A8C"; (e.currentTarget as HTMLButtonElement).style.background = "transparent"; }}
                >
                  <LogOut className="h-3.5 w-3.5" />
                  Sign out
                </button>
              </div>
            </div>
          </div>
        </header>

        {/* Scrollable content */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-10">
          <div className="max-w-4xl mx-auto flex flex-col gap-6 lg:gap-8">

            {/* Page hero */}
            <section className="flex flex-col items-center text-center gap-4">
              <span
                className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium"
                style={{ background: "rgba(167,139,255,0.1)", color: "#A78BFF", border: "1px solid rgba(167,139,255,0.2)" }}
              >
                <span className="h-1.5 w-1.5 rounded-full animate-pulse" style={{ background: "#A78BFF" }} />
                Research Agent Active
              </span>
              <h1 className="text-2xl md:text-4xl font-bold text-white">Legal Research</h1>
              <p className="text-base" style={{ color: "#7A7A8C" }}>
                Ask anything — statutes, precedents, case law, regulations
              </p>

              {/* Search bar */}
              <div className="w-full max-w-3xl mt-2">
                {/* Input row */}
                <div
                  className="flex items-center rounded-xl overflow-hidden transition-all duration-200"
                  style={{
                    background: "#0D0D16",
                    border: `2px solid ${searchFocused ? "#7C6FFF" : "#1E1E2E"}`,
                    boxShadow: searchFocused ? "0 0 0 4px rgba(124,111,255,0.12)" : "none",
                  }}
                >
                  <div className="pl-4 pr-2 flex items-center shrink-0">
                    <Search className="h-4 w-4" style={{ color: searchFocused ? "#A78BFF" : "#7A7A8C" }} />
                  </div>
                  <input
                    ref={inputRef}
                    type="text"
                    placeholder="Search statutes, precedents..."
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    onFocus={() => setSearchFocused(true)}
                    onBlur={() => setSearchFocused(false)}
                    onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                    className="flex-1 bg-transparent text-sm text-white placeholder:text-[#7A7A8C] outline-none min-w-0 py-4"
                  />
                  {query && (
                    <button
                      onClick={() => setQuery("")}
                      className="p-2 rounded-lg shrink-0 transition-colors"
                      style={{ color: "#7A7A8C" }}
                      onMouseEnter={(e) => (e.currentTarget as HTMLButtonElement).style.color = "white"}
                      onMouseLeave={(e) => (e.currentTarget as HTMLButtonElement).style.color = "#7A7A8C"}
                    >
                      <X className="h-4 w-4" />
                    </button>
                  )}
                  {/* Search button — hidden on mobile (shown below) */}
                  <button
                    onClick={() => handleSearch()}
                    disabled={searching}
                    className="hidden sm:flex h-full px-5 text-sm font-semibold text-white items-center gap-2 shrink-0 transition-all duration-200"
                    style={{
                      background: searching ? "rgba(124,111,255,0.5)" : "linear-gradient(135deg, #7C6FFF, #A78BFF)",
                      borderLeft: "1px solid rgba(124,111,255,0.3)",
                      cursor: searching ? "not-allowed" : "pointer",
                      margin: "8px",
                      borderRadius: 8,
                    }}
                  >
                    {searching ? (
                      <span className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <>
                        <Sparkles className="h-4 w-4" />
                        Search
                      </>
                    )}
                  </button>
                </div>

                {/* Mobile-only full-width search button */}
                <button
                  onClick={() => handleSearch()}
                  disabled={searching}
                  className="sm:hidden mt-2 w-full py-3 rounded-xl text-sm font-semibold text-white flex items-center justify-center gap-2 transition-all duration-200"
                  style={{
                    background: searching ? "rgba(124,111,255,0.5)" : "linear-gradient(135deg, #7C6FFF, #A78BFF)",
                    cursor: searching ? "not-allowed" : "pointer",
                  }}
                >
                  {searching ? (
                    <span className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <>
                      <Sparkles className="h-4 w-4" />
                      Search
                    </>
                  )}
                </button>

                {/* Quick tags */}
                <div className="flex items-center gap-2 mt-3 flex-wrap justify-center">
                  {QUICK_TAGS.map((tag) => (
                    <button
                      key={tag}
                      onClick={() => handleQuickTag(tag)}
                      className="px-3 py-1.5 rounded-full text-xs font-medium transition-all duration-200"
                      style={{
                        background: "rgba(124,111,255,0.08)",
                        color: "#A78BFF",
                        border: "1px solid rgba(124,111,255,0.2)",
                      }}
                      onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.background = "rgba(124,111,255,0.18)"; }}
                      onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.background = "rgba(124,111,255,0.08)"; }}
                    >
                      {tag}
                    </button>
                  ))}
                </div>
              </div>
            </section>

            {/* Recent searches */}
            {!results && !searching && recentSearches.length > 0 && (
              <section>
                <p className="text-xs font-semibold uppercase tracking-widest mb-3" style={{ color: "#7A7A8C" }}>
                  Recent Searches
                </p>
                <div className="flex flex-wrap gap-2">
                  {recentSearches.map((q) => (
                    <button
                      key={q}
                      onClick={() => handleRecentSearch(q)}
                      className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-all duration-200"
                      style={{
                        background: "#0D0D16",
                        border: "1px solid #1E1E2E",
                        color: "#c8c4d7",
                      }}
                      onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.borderColor = "rgba(124,111,255,0.4)"; (e.currentTarget as HTMLButtonElement).style.color = "#A78BFF"; }}
                      onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.borderColor = "#1E1E2E"; (e.currentTarget as HTMLButtonElement).style.color = "#c8c4d7"; }}
                    >
                      <Clock className="h-3.5 w-3.5 shrink-0" style={{ color: "#7A7A8C" }} />
                      {q}
                    </button>
                  ))}
                </div>
              </section>
            )}

            {/* Searching shimmer */}
            {searching && (
              <section className="flex flex-col gap-4">
                <style>{`
                  @keyframes search-shimmer {
                    0%   { background-position: -200% 0; }
                    100% { background-position: 200% 0; }
                  }
                  .s-shimmer {
                    background: linear-gradient(90deg, #0D0D16 25%, #1a1a2e 50%, #0D0D16 75%);
                    background-size: 200% 100%;
                    animation: search-shimmer 1.5s infinite;
                    border-radius: 8px;
                  }
                `}</style>
                <div className="flex items-center gap-2 mb-1">
                  <span className="h-1.5 w-1.5 rounded-full animate-pulse" style={{ background: "#A78BFF" }} />
                  <p className="text-sm font-medium" style={{ color: "#A78BFF" }}>
                    Searching legal databases...
                  </p>
                </div>
                {[1, 2, 3, 4].map((i) => (
                  <div
                    key={i}
                    className="rounded-xl p-6 flex flex-col gap-3"
                    style={{ background: "#0D0D16", border: "1px solid #1E1E2E" }}
                  >
                    <div className="flex gap-3">
                      <div className="s-shimmer h-6 w-20" />
                      <div className="s-shimmer h-6 w-32" />
                    </div>
                    <div className="s-shimmer h-5 w-3/4" />
                    <div className="flex flex-col gap-2">
                      <div className="s-shimmer h-3 w-full" />
                      <div className="s-shimmer h-3 w-5/6" />
                    </div>
                  </div>
                ))}
              </section>
            )}

            {/* Results */}
            {results && (
              <section className="flex flex-col gap-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-lg font-semibold text-white">Research Results</h2>
                    <p className="text-xs mt-0.5" style={{ color: "#7A7A8C" }}>
                      {results.length} results for "{activeQuery}"
                    </p>
                  </div>
                  <button
                    onClick={handleNewSearch}
                    className="flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-medium transition-all duration-200"
                    style={{ background: "transparent", border: "1px solid #1E1E2E", color: "#7A7A8C" }}
                    onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.borderColor = "rgba(124,111,255,0.4)"; (e.currentTarget as HTMLButtonElement).style.color = "#A78BFF"; }}
                    onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.borderColor = "#1E1E2E"; (e.currentTarget as HTMLButtonElement).style.color = "#7A7A8C"; }}
                  >
                    <Search className="h-3.5 w-3.5" />
                    New Search
                  </button>
                </div>

                {results.map((r, i) => (
                  <ResultCard key={r.id} result={r} query={activeQuery} index={i} />
                ))}
              </section>
            )}

            {/* Empty / landing state */}
            {!results && !searching && recentSearches.length === 0 && (
              <section className="flex flex-col items-center gap-6 py-8">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 w-full max-w-2xl">
                  {[
                    { label: "Case Law", desc: "Search Supreme Court and circuit court decisions", icon: "⚖️" },
                    { label: "Statutes", desc: "Federal and state legislative authority", icon: "📜" },
                    { label: "Regulations", desc: "Agency rules and administrative guidance", icon: "🏛️" },
                  ].map(({ label, desc, icon }) => (
                    <div
                      key={label}
                      className="rounded-xl p-5 flex flex-col gap-2 cursor-pointer transition-all duration-200"
                      style={{ background: "#0D0D16", border: "1px solid #1E1E2E" }}
                      onMouseEnter={(e) => (e.currentTarget as HTMLDivElement).style.borderColor = "rgba(124,111,255,0.3)"}
                      onMouseLeave={(e) => (e.currentTarget as HTMLDivElement).style.borderColor = "#1E1E2E"}
                    >
                      <span className="text-2xl">{icon}</span>
                      <p className="text-sm font-semibold text-white">{label}</p>
                      <p className="text-xs leading-relaxed" style={{ color: "#7A7A8C" }}>{desc}</p>
                    </div>
                  ))}
                </div>
              </section>
            )}

          </div>
        </div>
      </main>
    </div>
  );
}
