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
  Sparkles,
  Copy,
  Download,
  RefreshCw,
  CheckCircle2,
  ChevronRight,
  Menu,
  Wand2,
} from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { generateDraft } from "@/lib/generateDraft";
import type { DraftInput } from "@/lib/generateDraft";
import { callDraft, isFastApiConfigured } from "@/lib/apiClient";
import type { Profile } from "./DashboardPage";
import { useSidebar } from "@/hooks/useSidebar";
import { useRipple } from "@/hooks/useRipple";

// ─── Constants ────────────────────────────────────────────────────────────────

const NAV_ITEMS = [
  { id: "dashboard", label: "Dashboard", icon: LayoutDashboard, path: "/" },
  { id: "intake", label: "Intake Agent", icon: UserRound, path: "/intake" },
  { id: "contracts", label: "Contract Review", icon: FileText, path: "/contracts" },
  { id: "drafting", label: "Drafting Agent", icon: PenLine, path: "/drafting" },
  { id: "research", label: "Research Agent", icon: Search, path: "/" },
  { id: "memory", label: "Case Memory", icon: FolderOpen, path: "/" },
];

const DOC_TYPES = [
  "Legal Notice",
  "Non-Disclosure Agreement (NDA)",
  "Cease & Desist Letter",
  "Demand Letter",
  "Settlement Agreement",
  "Employment Contract",
  "Service Agreement",
];

// ─── Typewriter effect component ─────────────────────────────────────────────

function TypewriterText({ text, active }: { text: string; active: boolean }) {
  const [displayed, setDisplayed] = useState("");
  const [done, setDone] = useState(false);
  const rafRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!active || !text) {
      setDisplayed(text);
      setDone(true);
      return;
    }
    setDisplayed("");
    setDone(false);
    let i = 0;
    const speed = text.length > 1000 ? 4 : 12;

    function tick() {
      const chunk = Math.ceil(text.length / 300); // bigger chunks for long docs
      i = Math.min(i + chunk, text.length);
      setDisplayed(text.slice(0, i));
      if (i < text.length) {
        rafRef.current = setTimeout(tick, speed);
      } else {
        setDone(true);
      }
    }
    rafRef.current = setTimeout(tick, speed);
    return () => { if (rafRef.current) clearTimeout(rafRef.current); };
  }, [text, active]);

  return (
    <pre
      className="whitespace-pre-wrap font-mono text-[13px] leading-relaxed"
      style={{ color: "#c8c4d7", fontFamily: "'JetBrains Mono', 'Fira Code', monospace" }}
    >
      {displayed}
      {active && !done && (
        <span
          className="inline-block w-0.5 h-4 ml-0.5 animate-pulse"
          style={{ background: "#7C6FFF", verticalAlign: "middle" }}
        />
      )}
    </pre>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export function DraftingAgentPage() {
  const navigate = useNavigate();
  const [profile, setProfile] = useState<Profile | null>(null);
  const { sidebarOpen, openSidebar, closeSidebar } = useSidebar();
  const ripple = useRipple();
  const [form, setForm] = useState<DraftInput>({
    documentType: "Legal Notice",
    partyA: "",
    partyB: "",
    jurisdiction: "",
    keyFacts: "",
  });
  const [generating, setGenerating] = useState(false);
  const [draft, setDraft] = useState<{ content: string; wordCount: number } | null>(null);
  const [typewriterActive, setTypewriterActive] = useState(false);
  const [copied, setCopied] = useState(false);
  const [focusedField, setFocusedField] = useState<string | null>(null);
  const previewRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    supabase.auth.getUser().then(async ({ data }) => {
      if (!data.user) return;
      const { data: row } = await supabase
        .from("profiles")
        .select("full_name, email, firm")
        .eq("id", data.user.id)
        .maybeSingle();
      setProfile(row ?? { full_name: null, email: data.user.email ?? null, firm: null });
    });
  }, []);

  const displayName = profile?.full_name || profile?.email?.split("@")[0] || "Counselor";
  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";
  const initials = displayName.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2);

  async function handleGenerate() {
    if (!form.partyA.trim() || !form.partyB.trim() || !form.jurisdiction.trim() || !form.keyFacts.trim()) {
      toast.error("Please fill in all required fields");
      return;
    }

    setGenerating(true);
    setDraft(null);
    setTypewriterActive(false);

    try {
      // Try FastAPI backend first if configured
      let result: { content: string; wordCount: number };
      if (isFastApiConfigured()) {
        try {
          const apiRes = await callDraft({
            document_type: form.documentType,
            party_a: form.partyA,
            party_b: form.partyB,
            jurisdiction: form.jurisdiction,
            key_facts: form.keyFacts,
          });
          result = { content: apiRes.content, wordCount: apiRes.word_count };
        } catch (apiErr) {
          console.warn("[FastAPI /draft fallback]", apiErr);
          result = await generateDraft({ data: form });
        }
      } else {
        result = await generateDraft({ data: form });
      }

      // Save to Supabase
      try {
        const { data: userData } = await supabase.auth.getUser();
        if (userData.user) {
          await (supabase.from as any)("drafts").insert({
            user_id: userData.user.id,
            document_type: form.documentType,
            party_a: form.partyA,
            party_b: form.partyB,
            jurisdiction: form.jurisdiction,
            key_facts: form.keyFacts,
            document_content: result.content,
            word_count: result.wordCount,
            status: "draft",
          });
        }
      } catch (dbErr) {
        console.warn("[Draft save]", dbErr);
      }

      setDraft(result);
      setTypewriterActive(true);
      setTimeout(() => previewRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }), 100);
      toast.success("Document drafted successfully");
    } catch (err: any) {
      console.error(err);
      toast.error(err?.message || "Generation failed");
    } finally {
      setGenerating(false);
    }
  }

  function handleCopy() {
    if (!draft) return;
    navigator.clipboard.writeText(draft.content).then(() => {
      setCopied(true);
      toast.success("Copied to clipboard");
      setTimeout(() => setCopied(false), 2000);
    });
  }

  function handleDownloadPDF() {
    if (!draft) return;
    // Create a printable blob
    const blob = new Blob([draft.content], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${form.documentType.replace(/\s+/g, "_")}_${Date.now()}.txt`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("Document downloaded");
  }

  function handleNewDraft() {
    setDraft(null);
    setTypewriterActive(false);
    setForm({ documentType: "Legal Notice", partyA: "", partyB: "", jurisdiction: "", keyFacts: "" });
  }

  async function signOut() {
    await supabase.auth.signOut();
    navigate({ to: "/auth", replace: true });
  }

  const inputStyle = (field: string): React.CSSProperties => ({
    background: "#12121A",
    border: `1px solid ${focusedField === field ? "#7C6FFF" : "#1E1E2E"}`,
    borderRadius: 8,
    color: "#e4e1e9",
    outline: "none",
    boxShadow: focusedField === field ? "0 0 0 3px rgba(124,111,255,0.12)" : "none",
    transition: "border-color 0.2s, box-shadow 0.2s",
  });

  const labelStyle: React.CSSProperties = {
    color: "#7A7A8C",
    fontSize: 12,
    fontWeight: 600,
    textTransform: "uppercase",
    letterSpacing: "0.05em",
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
            const isActive = id === "drafting";
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
          style={{
            background: "rgba(13,13,22,0.85)",
            backdropFilter: "blur(20px)",
            borderBottom: "1px solid #1E1E2E",
          }}
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
            <span className="text-white font-medium">Drafting Agent</span>
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
          <div className="max-w-6xl mx-auto flex flex-col gap-6 lg:gap-8">

            {/* Page title */}
            <section>
              <span
                className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium mb-5"
                style={{ background: "rgba(167,139,255,0.1)", color: "#A78BFF", border: "1px solid rgba(167,139,255,0.2)" }}
              >
                <span className="h-1.5 w-1.5 rounded-full animate-pulse" style={{ background: "#A78BFF" }} />
                Drafting Agent Active
              </span>
              <h1 className="text-2xl md:text-4xl font-bold text-white mt-3">Legal Document Drafting</h1>
              <p className="mt-2 text-base" style={{ color: "#7A7A8C" }}>
                Configure your document — AI drafts it instantly in legal-grade language
              </p>
            </section>

            {/* Two-panel layout */}
            <div className="grid grid-cols-1 lg:grid-cols-[42fr_58fr] gap-6 lg:gap-8">

              {/* ── LEFT: Form ── */}
              <div
                className="rounded-xl p-5 sm:p-7 flex flex-col gap-6 lg:self-start lg:sticky lg:top-0"
                style={{ background: "#0D0D16", border: "1px solid #1E1E2E" }}
              >
                {/* Card header */}
                <div className="flex items-center justify-between">
                  <h2 className="text-base font-semibold text-white">Document Configuration</h2>
                  <span
                    className="text-[11px] font-semibold px-2.5 py-1 rounded-full"
                    style={{ background: "rgba(124,111,255,0.12)", color: "#A78BFF", border: "1px solid rgba(124,111,255,0.25)" }}
                  >
                    AI-Powered
                  </span>
                </div>

                <div className="flex flex-col gap-5">
                  {/* Document Type */}
                  <div className="flex flex-col gap-2">
                    <label style={labelStyle}>Document Type *</label>
                    <select
                      value={form.documentType}
                      onChange={(e) => setForm((f) => ({ ...f, documentType: e.target.value }))}
                      onFocus={() => setFocusedField("docType")}
                      onBlur={() => setFocusedField(null)}
                      className="w-full px-4 py-3 text-sm appearance-none cursor-pointer"
                      style={inputStyle("docType")}
                    >
                      {DOC_TYPES.map((t) => (
                        <option key={t} value={t} style={{ background: "#12121A" }}>{t}</option>
                      ))}
                    </select>
                  </div>

                  {/* Party A */}
                  <div className="flex flex-col gap-2">
                    <label style={labelStyle}>Party A — First Party *</label>
                    <input
                      type="text"
                      placeholder="Full name or company"
                      value={form.partyA}
                      onChange={(e) => setForm((f) => ({ ...f, partyA: e.target.value }))}
                      onFocus={() => setFocusedField("partyA")}
                      onBlur={() => setFocusedField(null)}
                      className="w-full px-4 py-3 text-sm"
                      style={inputStyle("partyA")}
                    />
                  </div>

                  {/* Party B */}
                  <div className="flex flex-col gap-2">
                    <label style={labelStyle}>Party B — Second Party *</label>
                    <input
                      type="text"
                      placeholder="Full name or company"
                      value={form.partyB}
                      onChange={(e) => setForm((f) => ({ ...f, partyB: e.target.value }))}
                      onFocus={() => setFocusedField("partyB")}
                      onBlur={() => setFocusedField(null)}
                      className="w-full px-4 py-3 text-sm"
                      style={inputStyle("partyB")}
                    />
                  </div>

                  {/* Jurisdiction */}
                  <div className="flex flex-col gap-2">
                    <label style={labelStyle}>Jurisdiction *</label>
                    <input
                      type="text"
                      placeholder="e.g. New York, USA"
                      value={form.jurisdiction}
                      onChange={(e) => setForm((f) => ({ ...f, jurisdiction: e.target.value }))}
                      onFocus={() => setFocusedField("jurisdiction")}
                      onBlur={() => setFocusedField(null)}
                      className="w-full px-4 py-3 text-sm"
                      style={inputStyle("jurisdiction")}
                    />
                  </div>

                  {/* Key Facts */}
                  <div className="flex flex-col gap-2">
                    <label style={labelStyle}>Key Facts & Context *</label>
                    <textarea
                      placeholder="Describe the key facts, circumstances, and specific requirements for this document..."
                      value={form.keyFacts}
                      onChange={(e) => setForm((f) => ({ ...f, keyFacts: e.target.value }))}
                      onFocus={() => setFocusedField("keyFacts")}
                      onBlur={() => setFocusedField(null)}
                      rows={5}
                      className="w-full px-4 py-3 text-sm resize-none"
                      style={inputStyle("keyFacts")}
                    />
                  </div>

                  {/* Generate button */}
                  <button
                    onClick={handleGenerate}
                    disabled={generating}
                    className="w-full py-3.5 rounded-lg text-sm font-semibold text-white flex items-center justify-center gap-2 transition-all duration-200"
                    style={{
                      background: generating
                        ? "rgba(124,111,255,0.5)"
                        : "linear-gradient(135deg, #7C6FFF, #A78BFF)",
                      boxShadow: generating ? "none" : "0 4px 20px rgba(124,111,255,0.3)",
                      cursor: generating ? "not-allowed" : "pointer",
                    }}
                  >
                    {generating ? (
                      <>
                        <span className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        Drafting your document...
                      </>
                    ) : (
                      <>
                        <Wand2 className="h-4 w-4" />
                        Generate Document
                      </>
                    )}
                  </button>

                  {/* Powered by */}
                  <div className="flex items-center justify-center gap-1.5">
                    <Sparkles className="h-3.5 w-3.5" style={{ color: "#7A7A8C" }} />
                    <span className="text-xs" style={{ color: "#7A7A8C" }}>Powered by Gemini 2.5 Flash</span>
                  </div>
                </div>
              </div>

              {/* ── RIGHT: Preview ── */}
              <div ref={previewRef}>
                {!draft && !generating && (
                  <div
                    className="rounded-xl flex flex-col items-center justify-center gap-4 text-center"
                    style={{
                        background: "#0D0D16",
                        border: "1px dashed #1E1E2E",
                        minHeight: 320,
                      }}
                  >
                    <div
                      className="flex h-16 w-16 items-center justify-center rounded-2xl"
                      style={{ background: "#12121A", border: "1px solid #1E1E2E" }}
                    >
                      <PenLine className="h-8 w-8" style={{ color: "#7A7A8C" }} strokeWidth={1.5} />
                    </div>
                    <div>
                      <p className="text-base font-semibold text-white">Ready to draft</p>
                      <p className="text-sm mt-1 max-w-xs" style={{ color: "#7A7A8C" }}>
                        Fill in the form and click "Generate Document" to draft your legal document with AI.
                      </p>
                    </div>
                    {/* Preview skeleton */}
                    <div className="w-64 flex flex-col gap-2 mt-2">
                      {[90, 75, 85, 60, 70].map((w, i) => (
                        <div
                          key={i}
                          className="h-2.5 rounded-full"
                          style={{ width: `${w}%`, background: "#1E1E2E", opacity: 0.5 }}
                        />
                      ))}
                    </div>
                  </div>
                )}

                {generating && (
                  <div
                    className="rounded-xl flex flex-col items-center justify-center gap-4"
                    style={{
                      background: "#0D0D16",
                      border: "1px solid rgba(124,111,255,0.3)",
                      boxShadow: "0 0 30px rgba(124,111,255,0.08)",
                      minHeight: 480,
                    }}
                  >
                    <style>{`
                      @keyframes legal-spin {
                        0% { transform: rotate(0deg); }
                        100% { transform: rotate(360deg); }
                      }
                      @keyframes legal-shimmer {
                        0%   { background-position: -200% 0; }
                        100% { background-position: 200% 0; }
                      }
                      .draft-shimmer {
                        background: linear-gradient(90deg, #1E1E2E 25%, #2a2a3e 50%, #1E1E2E 75%);
                        background-size: 200% 100%;
                        animation: legal-shimmer 1.5s infinite;
                        border-radius: 4px;
                      }
                    `}</style>
                    <div
                      className="h-12 w-12 rounded-full border-4 border-t-transparent"
                      style={{
                        borderColor: "rgba(124,111,255,0.2)",
                        borderTopColor: "#7C6FFF",
                        animation: "legal-spin 1s linear infinite",
                      }}
                    />
                    <div className="text-center">
                      <p className="text-sm font-semibold text-white">AI is drafting your document...</p>
                      <p className="text-xs mt-1" style={{ color: "#7A7A8C" }}>Applying legal language · Structuring clauses</p>
                    </div>
                    <div className="w-72 flex flex-col gap-3 mt-2">
                      {[95, 80, 88, 65, 75, 90, 70].map((w, i) => (
                        <div key={i} className="draft-shimmer h-3" style={{ width: `${w}%` }} />
                      ))}
                    </div>
                  </div>
                )}

                {draft && (
                  <div
                    className="rounded-xl overflow-hidden flex flex-col"
                    style={{
                      background: "#0D0D16",
                      border: "1px solid #1E1E2E",
                      boxShadow: "0 0 40px rgba(124,111,255,0.06)",
                    }}
                  >
                    {/* Panel header */}
                    <div
                      className="flex items-center justify-between px-6 py-4 shrink-0"
                      style={{ borderBottom: "1px solid #1E1E2E" }}
                    >
                      <div>
                        <p className="text-[11px] uppercase tracking-widest" style={{ color: "#7A7A8C" }}>
                          Document Preview
                        </p>
                        <p className="text-sm font-semibold text-white mt-0.5">
                          {form.documentType} — {form.partyA || "Party A"} vs. {form.partyB || "Party B"}
                        </p>
                      </div>
                      <div className="flex items-center gap-2 flex-wrap">
                        {/* New Draft */}
                        <button
                          onClick={handleNewDraft}
                          className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium transition-all duration-200"
                          style={{
                            background: "rgba(124,111,255,0.1)",
                            color: "#A78BFF",
                            border: "1px solid rgba(124,111,255,0.25)",
                          }}
                          onMouseEnter={(e) => (e.currentTarget as HTMLButtonElement).style.background = "rgba(124,111,255,0.18)"}
                          onMouseLeave={(e) => (e.currentTarget as HTMLButtonElement).style.background = "rgba(124,111,255,0.1)"}
                        >
                          <RefreshCw className="h-3.5 w-3.5" />
                          New Draft
                        </button>
                        {/* Copy */}
                        <button
                          onClick={handleCopy}
                          className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium transition-all duration-200"
                          style={{ background: "transparent", color: copied ? "#2DD4BF" : "#7A7A8C", border: "1px solid #1E1E2E" }}
                          onMouseEnter={(e) => { if (!copied) { (e.currentTarget as HTMLButtonElement).style.borderColor = "rgba(124,111,255,0.4)"; (e.currentTarget as HTMLButtonElement).style.color = "#A78BFF"; } }}
                          onMouseLeave={(e) => { if (!copied) { (e.currentTarget as HTMLButtonElement).style.borderColor = "#1E1E2E"; (e.currentTarget as HTMLButtonElement).style.color = "#7A7A8C"; } }}
                        >
                          {copied ? <CheckCircle2 className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
                          {copied ? "Copied!" : "Copy"}
                        </button>
                        {/* Download */}
                        <button
                          onClick={handleDownloadPDF}
                          className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium transition-all duration-200"
                          style={{ background: "transparent", color: "#7A7A8C", border: "1px solid #1E1E2E" }}
                          onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.borderColor = "rgba(124,111,255,0.4)"; (e.currentTarget as HTMLButtonElement).style.color = "#A78BFF"; }}
                          onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.borderColor = "#1E1E2E"; (e.currentTarget as HTMLButtonElement).style.color = "#7A7A8C"; }}
                        >
                          <Download className="h-3.5 w-3.5" />
                          Download
                        </button>
                      </div>
                    </div>

                    {/* Document area */}
                    <div
                      className="flex-1 p-8 overflow-auto"
                      style={{ background: "#0A0A0F", maxHeight: "calc(100vh - 360px)" }}
                    >
                      <TypewriterText text={draft.content} active={typewriterActive} />
                    </div>

                    {/* Footer bar */}
                    <div
                      className="flex items-center gap-3 px-6 py-3 shrink-0"
                      style={{
                        borderTop: "1px solid rgba(45,212,191,0.2)",
                        background: "rgba(45,212,191,0.04)",
                      }}
                    >
                      <CheckCircle2 className="h-4 w-4 shrink-0" style={{ color: "#2DD4BF" }} />
                      <p className="text-xs" style={{ color: "#2DD4BF" }}>
                        Document generated · {draft.wordCount} words · {form.documentType} · Reviewed by AI
                      </p>
                    </div>
                  </div>
                )}
              </div>

            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
