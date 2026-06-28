import { useNavigate } from "@tanstack/react-router";
import { useEffect, useRef, useState, useCallback } from "react";
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
  Upload,
  X,
  AlertTriangle,
  ChevronRight,
  Menu,
  FileCheck,
  FileWarning,
} from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { analyzeContract } from "@/lib/analyzeContract";
import type { ContractAnalysis, ClauseChip } from "@/lib/analyzeContract";
import { callContractReview, isFastApiConfigured } from "@/lib/apiClient";
import type { Profile } from "./DashboardPage";
import { useSidebar } from "@/hooks/useSidebar";
import { useRipple } from "@/hooks/useRipple";

// ─── Nav ─────────────────────────────────────────────────────────────────────

const NAV_ITEMS = [
  { id: "dashboard", label: "Dashboard", icon: LayoutDashboard, path: "/" },
  { id: "intake", label: "Intake Agent", icon: UserRound, path: "/intake" },
  { id: "contracts", label: "Contract Review", icon: FileText, path: "/contracts" },
  { id: "drafting", label: "Drafting Agent", icon: PenLine, path: "/" },
  { id: "research", label: "Research Agent", icon: Search, path: "/" },
  { id: "memory", label: "Case Memory", icon: FolderOpen, path: "/" },
];

// ─── Risk Gauge ──────────────────────────────────────────────────────────────

function RiskGauge({ score }: { score: number }) {
  const radius = 80;
  const strokeW = 14;
  const cx = 110;
  const cy = 110;
  // Semi-circle: full arc = Math.PI * radius = ~251
  const arcLen = Math.PI * radius;
  const filled = (score / 100) * arcLen;
  const color =
    score >= 67 ? "#EF4444" : score >= 34 ? "#F59E0B" : "#22C55E";
  const label =
    score >= 67 ? "HIGH RISK" : score >= 34 ? "MEDIUM RISK" : "LOW RISK";

  // SVG path for a semi-circle arc (left to right, top half)
  // Start at (cx - radius, cy), end at (cx + radius, cy)
  const startX = cx - radius;
  const endX = cx + radius;

  return (
    <div className="flex flex-col items-center gap-3">
      <div className="relative" style={{ width: 220, height: 120 }}>
        <svg width={220} height={120} style={{ overflow: "visible" }}>
          {/* Track arc */}
          <path
            d={`M ${startX} ${cy} A ${radius} ${radius} 0 0 1 ${endX} ${cy}`}
            fill="none"
            stroke="#1E1E2E"
            strokeWidth={strokeW}
            strokeLinecap="round"
          />
          {/* Filled arc — use stroke-dasharray trick */}
          <path
            d={`M ${startX} ${cy} A ${radius} ${radius} 0 0 1 ${endX} ${cy}`}
            fill="none"
            stroke={color}
            strokeWidth={strokeW}
            strokeLinecap="round"
            strokeDasharray={`${filled} ${arcLen}`}
            style={{
              filter: `drop-shadow(0 0 6px ${color}88)`,
              transition: "stroke-dasharray 1.2s cubic-bezier(.4,0,.2,1)",
            }}
          />
        </svg>
        {/* Center label */}
        <div
          className="absolute inset-0 flex flex-col items-center justify-end pb-1"
        >
          <span
            className="text-5xl font-bold leading-none"
            style={{ color }}
          >
            {score}
          </span>
        </div>
      </div>
      <span
        className="text-sm font-bold tracking-widest uppercase"
        style={{ color }}
      >
        {label}
      </span>
    </div>
  );
}

// ─── Clause chip color ────────────────────────────────────────────────────────

function clauseStyle(risk: ClauseChip["risk"]): React.CSSProperties {
  switch (risk) {
    case "high":
      return {
        background: "rgba(239,68,68,0.1)",
        color: "#EF4444",
        border: "1px solid rgba(239,68,68,0.25)",
      };
    case "medium":
      return {
        background: "rgba(245,158,11,0.1)",
        color: "#F59E0B",
        border: "1px solid rgba(245,158,11,0.25)",
      };
    case "low":
      return {
        background: "rgba(34,197,94,0.1)",
        color: "#22C55E",
        border: "1px solid rgba(34,197,94,0.25)",
      };
    default:
      return {
        background: "rgba(255,255,255,0.05)",
        color: "#7A7A8C",
        border: "1px solid #1E1E2E",
      };
  }
}

// ─── Legal Pulse Scan animation ───────────────────────────────────────────────

function LegalPulseScan() {
  return (
    <div
      className="rounded-xl overflow-hidden relative"
      style={{
        background: "#12121A",
        border: "1px solid #1E1E2E",
        minHeight: 220,
      }}
    >
      <style>{`
        @keyframes scan-line {
          0%   { top: 0%; opacity: 1; }
          90%  { top: 100%; opacity: 1; }
          100% { top: 100%; opacity: 0; }
        }
        @keyframes scan-trail {
          0%   { height: 0%; opacity: 0.08; }
          90%  { height: 100%; opacity: 0.08; }
          100% { height: 100%; opacity: 0; }
        }
        .pulse-scan-line {
          animation: scan-line 2.4s ease-in-out infinite;
        }
        .pulse-scan-trail {
          animation: scan-trail 2.4s ease-in-out infinite;
        }
      `}</style>

      {/* Fake doc lines */}
      <div className="p-5 flex flex-col gap-2.5">
        {[100, 85, 92, 60, 78, 88, 45, 70, 96, 55].map((w, i) => (
          <div
            key={i}
            className="h-2.5 rounded-full"
            style={{ width: `${w}%`, background: "#1E1E2E" }}
          />
        ))}
      </div>

      {/* Violet trail */}
      <div
        className="pulse-scan-trail absolute top-0 left-0 w-full pointer-events-none"
        style={{ background: "rgba(124,111,255,0.08)" }}
      />
      {/* Scan line */}
      <div
        className="pulse-scan-line absolute left-0 w-full pointer-events-none"
        style={{
          height: 2,
          background: "linear-gradient(90deg, transparent, #7C6FFF, transparent)",
          boxShadow: "0 0 16px 4px rgba(124,111,255,0.5)",
        }}
      />
    </div>
  );
}

// ─── Page states ──────────────────────────────────────────────────────────────

type PageState = "idle" | "scanning" | "results";

// ─── Main Page ────────────────────────────────────────────────────────────────

export function ContractReviewPage() {
  const navigate = useNavigate();
  const [profile, setProfile] = useState<Profile | null>(null);
  const { sidebarOpen, openSidebar, closeSidebar } = useSidebar();
  const ripple = useRipple();
  const [pageState, setPageState] = useState<PageState>("idle");
  const [dragOver, setDragOver] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [analysis, setAnalysis] = useState<ContractAnalysis | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

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

  // File selection
  const handleFile = useCallback((f: File) => {
    const ok = f.type === "application/pdf" ||
      f.type === "application/vnd.openxmlformats-officedocument.wordprocessingml.document" ||
      f.name.endsWith(".pdf") || f.name.endsWith(".docx");
    if (!ok) { toast.error("Please upload a PDF or DOCX file"); return; }
    if (f.size > 50 * 1024 * 1024) { toast.error("File must be under 50 MB"); return; }
    setFile(f);
    setPageState("idle");
    setAnalysis(null);
  }, []);

  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const f = e.dataTransfer.files[0];
    if (f) handleFile(f);
  }, [handleFile]);

  async function handleAnalyze() {
    if (!file) return;
    setUploading(true);
    setPageState("scanning");

    try {
      // 1. Upload to Supabase Storage
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) throw new Error("Not authenticated");

      const path = `${userData.user.id}/${Date.now()}_${file.name}`;
      const { error: uploadErr } = await supabase.storage
        .from("contracts")
        .upload(path, file, { upsert: false });

      if (uploadErr) {
        // Storage bucket might not exist yet — log but continue with analysis
        console.warn("[Storage upload]", uploadErr.message);
      }

      // 2. Extract text (best effort for PDF — read as text, works for text-based PDFs)
      let fileText = "";
      try {
        fileText = await file.text();
      } catch {
        fileText = "";
      }

      // 3. Get public URL from Supabase Storage (for FastAPI backend)
      const { data: publicUrlData } = supabase.storage
        .from("contracts")
        .getPublicUrl(path);
      const filePublicUrl = publicUrlData?.publicUrl ?? "";

      // 4. Try FastAPI /contract-review first, fall back to createServerFn
      let result: ContractAnalysis;
      if (isFastApiConfigured() && filePublicUrl) {
        try {
          const apiRes = await callContractReview({
            file_url: filePublicUrl,
            file_name: file.name,
            file_size: file.size,
          });
          result = {
            riskScore: apiRes.risk_score,
            riskLabel: apiRes.risk_score >= 67 ? "HIGH RISK" : apiRes.risk_score >= 34 ? "MEDIUM RISK" : "LOW RISK",
            clauses: apiRes.key_clauses.map((c) => ({
              label: c.name,
              risk: c.risk,
            })),
            redFlags: apiRes.red_flags,
            summary: apiRes.ai_summary,
            pageCount: 1,
          };
        } catch (apiErr) {
          console.warn("[FastAPI /contract-review fallback]", apiErr);
          result = await analyzeContract({
            data: { fileName: file.name, fileText },
          });
        }
      } else {
        result = await analyzeContract({
          data: { fileName: file.name, fileText },
        });
      }

      // 4. Save to contracts table
      try {
        await supabase.from("contracts" as any).insert({
          user_id: userData.user.id,
          file_name: file.name,
          file_path: path,
          file_size: file.size,
          risk_score: result.riskScore,
          key_clauses: result.clauses,
          red_flags: result.redFlags,
          ai_summary: result.summary,
          status: "complete",
        });
      } catch (dbErr) {
        console.warn("[DB save]", dbErr);
      }

      setAnalysis(result);
      setPageState("results");
      toast.success("Contract analyzed successfully");
    } catch (err: any) {
      console.error(err);
      toast.error(err?.message || "Analysis failed");
      setPageState("idle");
    } finally {
      setUploading(false);
    }
  }

  async function signOut() {
    await supabase.auth.signOut();
    navigate({ to: "/auth", replace: true });
  }

  const sectionLabel: React.CSSProperties = {
    fontSize: 11,
    fontWeight: 700,
    textTransform: "uppercase",
    letterSpacing: "0.1em",
    color: "#7A7A8C",
    marginBottom: 12,
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
            const isActive = id === "contracts";
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
            <button onClick={() => navigate({ to: "/" })} className="hover:text-white transition-colors">
              Dashboard
            </button>
            <ChevronRight className="h-3.5 w-3.5" />
            <span className="text-white font-medium">Contract Review</span>
          </div>
          <div className="flex items-center gap-3">
            <p className="text-sm font-semibold text-white hidden lg:block">
              {greeting}, <span style={{ color: "#A78BFF" }}>{displayName}</span>
            </p>
            <button className="p-2 rounded-lg transition-colors" style={{ color: "#7A7A8C" }}>
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
                  className="flex w-full items-center gap-2 px-3 py-2.5 text-xs rounded-b-xl transition-colors"
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

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-10">
          <div className="max-w-6xl mx-auto flex flex-col gap-6 lg:gap-8">

            {/* Page title */}
            <section>
              <span
                className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium mb-5"
                style={{
                  background: "rgba(167,139,255,0.1)",
                  color: "#A78BFF",
                  border: "1px solid rgba(167,139,255,0.2)",
                }}
              >
                <span className="h-1.5 w-1.5 rounded-full animate-pulse" style={{ background: "#A78BFF" }} />
                Contract Review Active
              </span>
              <h1 className="text-2xl md:text-4xl font-bold text-white mt-3">Contract Review</h1>
              <p className="mt-2 text-base" style={{ color: "#7A7A8C" }}>
                Upload a contract — AI analyzes risk, clauses, and red flags instantly
              </p>
            </section>

            {/* Two-column */}
            <div className="grid grid-cols-1 lg:grid-cols-[40fr_60fr] gap-6 lg:gap-8">

              {/* ── LEFT: Upload + Scan ── */}
              <div className="flex flex-col gap-6">
                <div
                  className="rounded-xl p-7 flex flex-col gap-5"
                  style={{ background: "#0D0D16", border: "1px solid #1E1E2E" }}
                >
                  {/* Drop zone */}
                  <div
                    onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                    onDragLeave={() => setDragOver(false)}
                    onDrop={onDrop}
                    onClick={() => fileInputRef.current?.click()}
                    className="flex flex-col items-center justify-center gap-3 cursor-pointer rounded-xl transition-all duration-200 py-10 px-6 text-center"
                    style={{
                      border: dragOver
                        ? "2px solid #7C6FFF"
                        : "2px dashed rgba(124,111,255,0.35)",
                      background: dragOver
                        ? "rgba(124,111,255,0.06)"
                        : "rgba(124,111,255,0.02)",
                      boxShadow: dragOver ? "0 0 24px rgba(124,111,255,0.18)" : "none",
                    }}
                  >
                    <div
                      className="flex h-14 w-14 items-center justify-center rounded-xl"
                      style={{ background: "rgba(124,111,255,0.12)", border: "1px solid rgba(124,111,255,0.2)" }}
                    >
                      <Upload className="h-7 w-7" style={{ color: "#A78BFF" }} strokeWidth={1.5} />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-white">
                        {dragOver ? "Release to upload" : "Drop your contract here"}
                      </p>
                      <p className="text-xs mt-1" style={{ color: "#7A7A8C" }}>
                        PDF or DOCX · up to 50 MB
                      </p>
                    </div>
                    <button
                      onClick={(e) => { e.stopPropagation(); fileInputRef.current?.click(); }}
                      className="px-4 py-2 rounded-lg text-xs font-medium transition-all duration-200"
                      style={{
                        border: "1px solid #1E1E2E",
                        color: "#e4e1e9",
                        background: "transparent",
                      }}
                      onMouseEnter={(e) => {
                        (e.currentTarget as HTMLButtonElement).style.borderColor = "rgba(124,111,255,0.5)";
                        (e.currentTarget as HTMLButtonElement).style.color = "#A78BFF";
                        (e.currentTarget as HTMLButtonElement).style.boxShadow = "0 0 12px rgba(124,111,255,0.15)";
                      }}
                      onMouseLeave={(e) => {
                        (e.currentTarget as HTMLButtonElement).style.borderColor = "#1E1E2E";
                        (e.currentTarget as HTMLButtonElement).style.color = "#e4e1e9";
                        (e.currentTarget as HTMLButtonElement).style.boxShadow = "none";
                      }}
                    >
                      Browse Files
                    </button>
                  </div>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".pdf,.docx"
                    className="hidden"
                    onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f); }}
                  />

                  {/* Uploaded file pill */}
                  {file && (
                    <div
                      className="flex items-center gap-3 px-4 py-3 rounded-lg"
                      style={{ background: "#12121A", border: "1px solid #1E1E2E" }}
                    >
                      <FileCheck className="h-5 w-5 shrink-0" style={{ color: "#A78BFF" }} strokeWidth={1.8} />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-white truncate">{file.name}</p>
                        <p className="text-xs" style={{ color: "#7A7A8C" }}>
                          {(file.size / (1024 * 1024)).toFixed(1)} MB
                        </p>
                      </div>
                      <button
                        onClick={() => { setFile(null); setPageState("idle"); setAnalysis(null); }}
                        className="p-1 rounded transition-colors"
                        style={{ color: "#7A7A8C" }}
                        onMouseEnter={(e) => (e.currentTarget as HTMLButtonElement).style.color = "#EF4444"}
                        onMouseLeave={(e) => (e.currentTarget as HTMLButtonElement).style.color = "#7A7A8C"}
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  )}

                  {/* Analyze button */}
                  <button
                    onClick={handleAnalyze}
                    disabled={!file || uploading}
                    className="w-full py-3.5 rounded-lg text-sm font-semibold text-white flex items-center justify-center gap-2 transition-all duration-200"
                    style={{
                      background: file && !uploading
                        ? "linear-gradient(135deg, #7C6FFF, #A78BFF)"
                        : "rgba(124,111,255,0.3)",
                      opacity: file && !uploading ? 1 : 0.6,
                      boxShadow: file && !uploading ? "0 4px 20px rgba(124,111,255,0.3)" : "none",
                      cursor: file && !uploading ? "pointer" : "not-allowed",
                    }}
                  >
                    {uploading ? (
                      <>
                        <span className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        Analyzing...
                      </>
                    ) : (
                      <>
                        <FileText className="h-4 w-4" />
                        Analyze Contract
                      </>
                    )}
                  </button>

                  {/* Powered by */}
                  <div className="flex items-center justify-center gap-1.5">
                    <Sparkles className="h-3.5 w-3.5" style={{ color: "#7A7A8C" }} />
                    <span className="text-xs" style={{ color: "#7A7A8C" }}>Powered by Gemini 2.5 Flash</span>
                  </div>
                </div>

                {/* Legal Pulse Scan panel */}
                {pageState === "scanning" && (
                  <div
                    className="rounded-xl p-5 flex flex-col gap-4"
                    style={{ background: "#0D0D16", border: "1px solid #1E1E2E" }}
                  >
                    <LegalPulseScan />
                    <div className="flex items-center gap-3">
                      <span
                        className="h-2 w-2 rounded-full animate-pulse shrink-0"
                        style={{ background: "#7C6FFF" }}
                      />
                      <div>
                        <p className="text-sm font-medium text-white">Analyzing contract...</p>
                        <p className="text-xs" style={{ color: "#7A7A8C" }}>
                          Extracting clauses · Scoring risk · Identifying red flags
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* ── RIGHT: Results ── */}
              <div>
                {!analysis && pageState !== "scanning" && (
                  <div
                    className="rounded-xl p-10 flex flex-col items-center justify-center gap-4 text-center h-full"
                    style={{
                      background: "#0D0D16",
                      border: "1px dashed #1E1E2E",
                      minHeight: 400,
                    }}
                  >
                    <div
                      className="flex h-16 w-16 items-center justify-center rounded-2xl"
                      style={{ background: "#12121A", border: "1px solid #1E1E2E" }}
                    >
                      <FileWarning className="h-8 w-8" style={{ color: "#7A7A8C" }} strokeWidth={1.5} />
                    </div>
                    <div>
                      <p className="text-base font-semibold text-white">No contract analyzed yet</p>
                      <p className="text-sm mt-1" style={{ color: "#7A7A8C" }}>
                        Upload a PDF or DOCX file and click "Analyze Contract" to see results.
                      </p>
                    </div>
                  </div>
                )}

                {analysis && (
                  <div
                    className="rounded-xl overflow-hidden flex flex-col"
                    style={{ background: "#0D0D16", border: "1px solid #1E1E2E" }}
                  >

                    {/* Risk Score */}
                    <div className="p-7 flex flex-col items-center gap-5" style={{ borderBottom: "1px solid #1E1E2E" }}>
                      <p style={{ ...sectionLabel, marginBottom: 0 }}>Risk Score</p>
                      <RiskGauge score={analysis.riskScore} />
                      {/* Stats row */}
                      <div className="flex gap-3 flex-wrap justify-center">
                        {[
                          { label: "Clauses Found", value: analysis.clauses.length },
                          { label: "Red Flags", value: analysis.redFlags.length },
                          { label: "Pages", value: analysis.pageCount },
                        ].map(({ label, value }) => (
                          <div
                            key={label}
                            className="flex flex-col items-center px-4 py-2 rounded-lg"
                            style={{ background: "#12121A", border: "1px solid #1E1E2E" }}
                          >
                            <span className="text-lg font-bold text-white">{value}</span>
                            <span className="text-[11px]" style={{ color: "#7A7A8C" }}>{label}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Key Clauses */}
                    <div className="p-7" style={{ borderBottom: "1px solid #1E1E2E" }}>
                      <p style={sectionLabel}>Key Clauses</p>
                      <div className="flex flex-wrap gap-2">
                        {analysis.clauses.map((c) => (
                          <span
                            key={c.label}
                            className="px-3 py-1.5 rounded-full text-xs font-medium"
                            style={clauseStyle(c.risk)}
                          >
                            {c.label}
                          </span>
                        ))}
                      </div>
                    </div>

                    {/* Red Flags */}
                    <div className="p-7" style={{ borderBottom: "1px solid #1E1E2E" }}>
                      <p style={{ ...sectionLabel, color: "#EF4444" }}>
                        ⚠ Red Flags
                      </p>
                      <div
                        className="rounded-xl overflow-hidden flex flex-col"
                        style={{
                          background: "rgba(239,68,68,0.05)",
                          border: "1px solid rgba(239,68,68,0.2)",
                        }}
                      >
                        {analysis.redFlags.map((flag, i) => (
                          <div
                            key={i}
                            className="flex items-start gap-3 p-4"
                            style={i > 0 ? { borderTop: "1px solid rgba(239,68,68,0.12)" } : {}}
                          >
                            <AlertTriangle
                              className="h-4 w-4 mt-0.5 shrink-0"
                              style={{ color: "#EF4444" }}
                              strokeWidth={2}
                            />
                            <div>
                              <p className="text-sm font-semibold" style={{ color: "#EF4444" }}>
                                {flag.title}
                              </p>
                              <p className="text-xs mt-0.5 leading-relaxed" style={{ color: "#c8c4d7" }}>
                                {flag.detail}
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* AI Summary */}
                    <div className="p-7">
                      <p style={sectionLabel}>AI Analysis</p>
                      <p className="text-sm leading-relaxed" style={{ color: "#c8c4d7" }}>
                        {analysis.summary}
                      </p>
                      <button
                        className="mt-5 w-full py-3 rounded-lg text-sm font-medium transition-all duration-200"
                        style={{
                          background: "transparent",
                          border: "1px solid #1E1E2E",
                          color: "#7A7A8C",
                        }}
                        onMouseEnter={(e) => {
                          (e.currentTarget as HTMLButtonElement).style.borderColor = "rgba(124,111,255,0.5)";
                          (e.currentTarget as HTMLButtonElement).style.color = "#A78BFF";
                          (e.currentTarget as HTMLButtonElement).style.boxShadow = "0 0 12px rgba(124,111,255,0.12)";
                        }}
                        onMouseLeave={(e) => {
                          (e.currentTarget as HTMLButtonElement).style.borderColor = "#1E1E2E";
                          (e.currentTarget as HTMLButtonElement).style.color = "#7A7A8C";
                          (e.currentTarget as HTMLButtonElement).style.boxShadow = "none";
                        }}
                      >
                        Generate Full Report
                      </button>
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
