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
  CheckCircle2,
  ChevronRight,
  AlertCircle,
  Menu,
  X,
} from "lucide-react";
import { toast } from "sonner";

import { supabase } from "@/integrations/supabase/client";
import { generateCaseSummary } from "@/lib/generateCaseSummary";
import { callIntake, isFastApiConfigured } from "@/lib/apiClient";
import type { Profile } from "./DashboardPage";
import { useSidebar } from "@/hooks/useSidebar";

// ─── Constants ───────────────────────────────────────────────────────────────

const NAV_ITEMS = [
  { id: "dashboard", label: "Dashboard", icon: LayoutDashboard, path: "/" },
  { id: "intake", label: "Intake Agent", icon: UserRound, path: "/intake" },
  { id: "contracts", label: "Contract Review", icon: FileText, path: "/" },
  { id: "drafting", label: "Drafting Agent", icon: PenLine, path: "/" },
  { id: "research", label: "Research Agent", icon: Search, path: "/" },
  { id: "memory", label: "Case Memory", icon: FolderOpen, path: "/" },
];

const CASE_TYPES = [
  "Civil Litigation",
  "Criminal Defense",
  "Contract Dispute",
  "Family Law",
  "Corporate",
  "IP / Patent",
  "Real Estate",
  "Other",
];

const RECOMMENDED_ACTIONS: Record<string, string[]> = {
  "Civil Litigation": [
    "Gather all relevant documentary evidence",
    "File initial complaint with the appropriate court",
    "Schedule a preliminary hearing",
    "Identify and prepare witnesses",
  ],
  "Criminal Defense": [
    "Review police reports and arrest records",
    "File bail hearing motion if applicable",
    "Request discovery from prosecution",
    "Identify potential character witnesses",
  ],
  "Contract Dispute": [
    "Obtain and review the original contract",
    "Document all breach of contract instances",
    "Send a formal demand letter",
    "Explore mediation or arbitration options",
  ],
  "Family Law": [
    "Compile financial disclosure documents",
    "Document custody and visitation history",
    "File petition with family court",
    "Schedule mediation session",
  ],
  Corporate: [
    "Review corporate governance documents",
    "Conduct due diligence investigation",
    "Prepare board resolution if required",
    "Identify regulatory compliance issues",
  ],
  "IP / Patent": [
    "Conduct prior art search",
    "Document invention timeline and evidence",
    "File provisional patent application",
    "Draft cease-and-desist letter if infringing",
  ],
  "Real Estate": [
    "Review title search and property records",
    "Obtain property appraisal report",
    "File lis pendens if applicable",
    "Schedule property inspection",
  ],
  Other: [
    "Conduct initial legal research",
    "Gather all available documentation",
    "Identify applicable statutes",
    "Assess legal standing and merit",
  ],
};

// ─── Shared sidebar/header shell (mirrors DashboardPage) ──────────────────────

function SidebarShell({
  displayName,
  initials,
  profile,
  onSignOut,
  onOpenSidebar,
  sidebarOpen,
  onCloseSidebar,
}: {
  displayName: string;
  initials: string;
  profile: Profile | null;
  onSignOut: () => void;
  onOpenSidebar: () => void;
  sidebarOpen: boolean;
  onCloseSidebar: () => void;
}) {
  const navigate = useNavigate();

  return (
    <>
      {sidebarOpen && (
        <div className="sidebar-overlay md:hidden" onClick={onCloseSidebar} />
      )}
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
              <span className="text-sm font-bold tracking-tight text-white block leading-tight">
                Suites AI
              </span>
              <span className="text-[10px] uppercase tracking-widest" style={{ color: "#7A7A8C" }}>
                Legal Intelligence
              </span>
            </div>
          </div>
        </div>

        {/* Nav */}
        <div className="flex flex-col gap-0.5 px-3 flex-1 overflow-y-auto mt-2">
          {NAV_ITEMS.map(({ id, label, icon: Icon, path }) => {
            const isActive = id === "intake";
            return (
              <button
                key={id}
                onClick={() => { navigate({ to: path }); onCloseSidebar(); }}
                className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150 w-full text-left"
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

        {/* Bottom */}
        <div className="px-3 pb-3" style={{ borderTop: "1px solid #1E1E2E" }}>
          <button
            onClick={() => navigate({ to: "/settings" })}
            className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150 w-full text-left mt-3"
            style={{ color: "#7A7A8C", borderLeft: "3px solid transparent" }}
          >
            <Settings className="h-4 w-4 shrink-0" strokeWidth={1.8} />
            Settings
          </button>
          <button
            className="mt-3 w-full flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-semibold text-white transition-opacity hover:opacity-90"
            style={{ background: "linear-gradient(135deg, #7C6FFF, #A78BFF)" }}
          >
            <Plus className="h-4 w-4" />
            New Case
          </button>
        </div>
      </nav>
    </>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

type FormState = {
  clientName: string;
  caseType: string;
  description: string;
  contactInfo: string;
  intakeDate: string;
};

type SummaryStatus = "idle" | "generating" | "complete" | "submitted";

export function IntakeAgentPage() {
  const navigate = useNavigate();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [form, setForm] = useState<FormState>({
    clientName: "",
    caseType: "",
    description: "",
    contactInfo: "",
    intakeDate: new Date().toISOString().split("T")[0],
  });
  const [summaryStatus, setSummaryStatus] = useState<SummaryStatus>("idle");
  const [aiSummary, setAiSummary] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [focusedField, setFocusedField] = useState<string | null>(null);
  const { sidebarOpen, openSidebar, closeSidebar } = useSidebar();
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Load profile
  useEffect(() => {
    supabase.auth.getUser().then(async ({ data }) => {
      if (!data.user) return;
      const { data: row } = await supabase
        .from("profiles")
        .select("full_name, email, firm")
        .eq("id", data.user.id)
        .maybeSingle();
      setProfile(
        row ?? { full_name: null, email: data.user.email ?? null, firm: null },
      );
    });
  }, []);

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

  // Trigger AI summary with debounce whenever key fields change
  useEffect(() => {
    const hasEnoughData =
      form.clientName.trim().length > 1 &&
      form.caseType.length > 0 &&
      form.description.trim().length > 10;

    if (!hasEnoughData) {
      setSummaryStatus("idle");
      setAiSummary("");
      return;
    }

    setSummaryStatus("generating");
    if (debounceRef.current) clearTimeout(debounceRef.current);

    debounceRef.current = setTimeout(async () => {
      try {
        let summary = "";

        // Try FastAPI backend first if configured
        if (isFastApiConfigured()) {
          try {
            const apiResult = await callIntake({
              client_name: form.clientName,
              case_type: form.caseType,
              description: form.description,
              contact_info: form.contactInfo,
              intake_date: form.intakeDate,
            });
            summary = apiResult.ai_summary;
          } catch (apiErr) {
            console.warn("[FastAPI /intake fallback]", apiErr);
          }
        }

        // Fall back to createServerFn if FastAPI not configured or failed
        if (!summary) {
          const result = await generateCaseSummary({
            data: {
              clientName: form.clientName,
              caseType: form.caseType,
              description: form.description,
              contactInfo: form.contactInfo,
              intakeDate: form.intakeDate,
            },
          });
          summary = result.summary || "";
        }

        setAiSummary(summary);
        setSummaryStatus("complete");
      } catch {
        // Fallback to local generation
        const fallback = generateLocalSummary(form);
        setAiSummary(fallback);
        setSummaryStatus("complete");
      }
    }, 900);

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [form.clientName, form.caseType, form.description]);

  function generateLocalSummary(f: FormState): string {
    return `This matter involves ${f.clientName}, seeking legal representation for a ${f.caseType} case. ${f.description.slice(0, 180)}${f.description.length > 180 ? "..." : ""} Client may be reached at ${f.contactInfo || "[contact pending]"}. Intake recorded on ${f.intakeDate}.`;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.clientName || !form.caseType || !form.description || !form.contactInfo) {
      toast.error("Please fill in all required fields");
      return;
    }

    setSubmitting(true);
    try {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) throw new Error("Not authenticated");

      const { error } = await supabase.from("cases").insert({
        user_id: userData.user.id,
        client_name: form.clientName,
        case_type: form.caseType,
        description: form.description,
        contact_info: form.contactInfo,
        intake_date: form.intakeDate,
        ai_summary: aiSummary,
        status: "active",
      });

      if (error) throw error;

      setSubmitted(true);
      setSummaryStatus("submitted");
      toast.success("Intake submitted successfully");
    } catch (err: any) {
      console.error(err);
      toast.error(err?.message || "Failed to submit intake");
    } finally {
      setSubmitting(false);
    }
  }

  function handleReset() {
    setForm({
      clientName: "",
      caseType: "",
      description: "",
      contactInfo: "",
      intakeDate: new Date().toISOString().split("T")[0],
    });
    setAiSummary("");
    setSummaryStatus("idle");
    setSubmitted(false);
  }

  async function signOut() {
    await supabase.auth.signOut();
    toast.success("Signed out");
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

  const actions = form.caseType
    ? RECOMMENDED_ACTIONS[form.caseType] ?? RECOMMENDED_ACTIONS["Other"]
    : RECOMMENDED_ACTIONS["Other"];

  return (
    <div className="flex h-screen overflow-hidden bg-[#0A0A0F] font-sans antialiased">
      {/* ── Sidebar ── */}
      <SidebarShell
        displayName={displayName}
        initials={initials}
        profile={profile}
        onSignOut={signOut}
        sidebarOpen={sidebarOpen}
        onOpenSidebar={openSidebar}
        onCloseSidebar={closeSidebar}
      />

      {/* ── Main ── */}
      <main className="flex-1 flex flex-col h-full overflow-hidden">
        {/* Header */}
        <header
          className="h-16 flex items-center justify-between px-4 md:px-8 shrink-0"
          style={{
            background: "rgba(13, 13, 22, 0.85)",
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
            <button
              onClick={() => navigate({ to: "/" })}
              className="hover:text-white transition-colors"
            >
              Dashboard
            </button>
            <ChevronRight className="h-3.5 w-3.5" />
            <span className="text-white font-medium">Intake Agent</span>
          </div>

          <div className="flex items-center gap-3">
            <p className="text-sm font-semibold text-white hidden lg:block">
              {greeting},{" "}
              <span style={{ color: "#A78BFF" }}>{displayName}</span>
            </p>
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
                  <p className="text-[11px] truncate" style={{ color: "#7A7A8C" }}>
                    {profile?.email}
                  </p>
                </div>
                <button
                  onClick={signOut}
                  className="flex w-full items-center gap-2 px-3 py-2.5 text-xs transition-colors rounded-b-xl"
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

        {/* Scrollable content */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-10">
          <div className="max-w-6xl mx-auto flex flex-col gap-6 lg:gap-8">

            {/* Page title */}
            <section>
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
                Intake Agent Active
              </span>
              <h1 className="text-2xl md:text-4xl font-bold text-white mt-3">New Client Intake</h1>
              <p className="mt-2 text-base" style={{ color: "#7A7A8C" }}>
                Fill in case details — AI generates a live summary on the right
              </p>
            </section>

            {/* Two-column layout */}
            <div className="grid grid-cols-1 lg:grid-cols-[55fr_45fr] gap-6 lg:gap-8">

              {/* ── LEFT: Form ── */}
              <div
                className="rounded-xl p-7 flex flex-col gap-6"
                style={{ background: "#0D0D16", border: "1px solid #1E1E2E" }}
              >
                {/* Card header */}
                <div className="flex items-center gap-3">
                  <span
                    className="text-[11px] font-bold uppercase tracking-widest px-2.5 py-1 rounded-full"
                    style={{
                      background: "rgba(124,111,255,0.12)",
                      color: "#A78BFF",
                      border: "1px solid rgba(124,111,255,0.25)",
                    }}
                  >
                    Step 1 of 1
                  </span>
                  <h2 className="text-lg font-semibold text-white">Client Information</h2>
                </div>

                <form onSubmit={handleSubmit} className="flex flex-col gap-5">

                  {/* Client Name */}
                  <div className="flex flex-col gap-2">
                    <label style={labelStyle}>Client Name *</label>
                    <input
                      id="clientName"
                      type="text"
                      placeholder="Full legal name"
                      value={form.clientName}
                      onChange={(e) => setForm((f) => ({ ...f, clientName: e.target.value }))}
                      onFocus={() => setFocusedField("clientName")}
                      onBlur={() => setFocusedField(null)}
                      className="w-full px-4 py-3 text-sm"
                      style={inputStyle("clientName")}
                      required
                      disabled={submitted}
                    />
                  </div>

                  {/* Case Type */}
                  <div className="flex flex-col gap-2">
                    <label style={labelStyle}>Case Type *</label>
                    <select
                      id="caseType"
                      value={form.caseType}
                      onChange={(e) => setForm((f) => ({ ...f, caseType: e.target.value }))}
                      onFocus={() => setFocusedField("caseType")}
                      onBlur={() => setFocusedField(null)}
                      className="w-full px-4 py-3 text-sm appearance-none cursor-pointer"
                      style={inputStyle("caseType")}
                      required
                      disabled={submitted}
                    >
                      <option value="" style={{ background: "#12121A" }}>
                        Select a case type…
                      </option>
                      {CASE_TYPES.map((t) => (
                        <option key={t} value={t} style={{ background: "#12121A" }}>
                          {t}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Description */}
                  <div className="flex flex-col gap-2">
                    <label style={labelStyle}>Case Description *</label>
                    <textarea
                      id="description"
                      placeholder="Describe the nature of the case, key facts, and any relevant context..."
                      value={form.description}
                      onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                      onFocus={() => setFocusedField("description")}
                      onBlur={() => setFocusedField(null)}
                      rows={5}
                      className="w-full px-4 py-3 text-sm resize-none"
                      style={inputStyle("description")}
                      required
                      disabled={submitted}
                    />
                  </div>

                  {/* Contact Info */}
                  <div className="flex flex-col gap-2">
                    <label style={labelStyle}>Contact Info *</label>
                    <input
                      id="contactInfo"
                      type="text"
                      placeholder="Email or phone number"
                      value={form.contactInfo}
                      onChange={(e) => setForm((f) => ({ ...f, contactInfo: e.target.value }))}
                      onFocus={() => setFocusedField("contactInfo")}
                      onBlur={() => setFocusedField(null)}
                      className="w-full px-4 py-3 text-sm"
                      style={inputStyle("contactInfo")}
                      required
                      disabled={submitted}
                    />
                  </div>

                  {/* Date */}
                  <div className="flex flex-col gap-2">
                    <label style={labelStyle}>Intake Date</label>
                    <input
                      id="intakeDate"
                      type="date"
                      value={form.intakeDate}
                      onChange={(e) => setForm((f) => ({ ...f, intakeDate: e.target.value }))}
                      onFocus={() => setFocusedField("intakeDate")}
                      onBlur={() => setFocusedField(null)}
                      className="w-full px-4 py-3 text-sm"
                      style={{
                        ...inputStyle("intakeDate"),
                        colorScheme: "dark",
                      }}
                      disabled={submitted}
                    />
                  </div>

                  {/* Submit button */}
                  {submitted ? (
                    <button
                      type="button"
                      onClick={handleReset}
                      className="w-full py-3.5 rounded-lg text-sm font-semibold transition-all duration-200 flex items-center justify-center gap-2"
                      style={{
                        background: "transparent",
                        border: "1px solid #1E1E2E",
                        color: "#7A7A8C",
                      }}
                      onMouseEnter={(e) => {
                        (e.currentTarget as HTMLButtonElement).style.borderColor = "#2DD4BF";
                        (e.currentTarget as HTMLButtonElement).style.color = "#2DD4BF";
                      }}
                      onMouseLeave={(e) => {
                        (e.currentTarget as HTMLButtonElement).style.borderColor = "#1E1E2E";
                        (e.currentTarget as HTMLButtonElement).style.color = "#7A7A8C";
                      }}
                    >
                      <Plus className="h-4 w-4" />
                      Start New Intake
                    </button>
                  ) : (
                    <button
                      type="submit"
                      disabled={submitting}
                      className="w-full py-3.5 rounded-lg text-sm font-semibold text-white transition-all duration-200 flex items-center justify-center gap-2"
                      style={{
                        background: submitting
                          ? "rgba(124,111,255,0.5)"
                          : "linear-gradient(135deg, #7C6FFF, #A78BFF)",
                        opacity: submitting ? 0.8 : 1,
                        boxShadow: "0 4px 20px rgba(124,111,255,0.3)",
                      }}
                    >
                      {submitting ? (
                        <>
                          <span
                            className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin"
                          />
                          Submitting...
                        </>
                      ) : (
                        <>
                          <UserRound className="h-4 w-4" />
                          Submit Intake
                        </>
                      )}
                    </button>
                  )}

                  {/* Powered by */}
                  <div className="flex items-center justify-center gap-1.5 pt-1">
                    <Sparkles className="h-3.5 w-3.5" style={{ color: "#7A7A8C" }} />
                    <span className="text-xs" style={{ color: "#7A7A8C" }}>
                      Powered by Gemini 2.5 Flash
                    </span>
                  </div>
                </form>
              </div>

              {/* ── RIGHT: AI Summary ── */}
              <div className="relative">
                <div
                  className="rounded-xl p-7 flex flex-col gap-5 sticky top-0"
                  style={{
                    background: "#0D0D16",
                    border: `1px solid ${submitted ? "rgba(45,212,191,0.3)" : "#1E1E2E"}`,
                    boxShadow: submitted ? "0 0 30px rgba(45,212,191,0.08)" : "none",
                    transition: "border-color 0.4s, box-shadow 0.4s",
                  }}
                >
                  {/* Card header */}
                  <div className="flex items-center justify-between">
                    <h2 className="text-base font-semibold text-white">AI Case Summary</h2>
                    <StatusBadge status={summaryStatus} />
                  </div>

                  {/* Content */}
                  {summaryStatus === "idle" && (
                    <div className="flex flex-col gap-3 py-2">
                      <EmptyState />
                    </div>
                  )}

                  {summaryStatus === "generating" && (
                    <div className="flex flex-col gap-3 py-2">
                      <SkeletonLines />
                    </div>
                  )}

                  {(summaryStatus === "complete" || summaryStatus === "submitted") && (
                    <SummaryContent
                      form={form}
                      aiSummary={aiSummary}
                      actions={actions}
                      submitted={submitted}
                    />
                  )}

                  {/* Disclaimer */}
                  <div
                    className="flex items-start gap-2 pt-4"
                    style={{ borderTop: "1px solid #1E1E2E" }}
                  >
                    <AlertCircle
                      className="h-3.5 w-3.5 mt-0.5 shrink-0"
                      style={{ color: "#7A7A8C" }}
                    />
                    <p className="text-[11px] leading-relaxed" style={{ color: "#7A7A8C" }}>
                      This summary is AI-generated and should be reviewed by a licensed attorney
                      before any legal action is taken.
                    </p>
                  </div>
                </div>
              </div>

            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function StatusBadge({ status }: { status: SummaryStatus }) {
  if (status === "submitted") {
    return (
      <span
        className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold"
        style={{
          background: "rgba(45,212,191,0.12)",
          color: "#2DD4BF",
          border: "1px solid rgba(45,212,191,0.3)",
          boxShadow: "0 0 12px rgba(45,212,191,0.15)",
        }}
      >
        <CheckCircle2 className="h-3.5 w-3.5" />
        Intake Complete ✓
      </span>
    );
  }
  if (status === "generating") {
    return (
      <span
        className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium"
        style={{
          background: "rgba(45,212,191,0.08)",
          color: "#2DD4BF",
          border: "1px solid rgba(45,212,191,0.2)",
        }}
      >
        <span
          className="h-1.5 w-1.5 rounded-full animate-pulse"
          style={{ background: "#2DD4BF" }}
        />
        Generating...
      </span>
    );
  }
  if (status === "complete") {
    return (
      <span
        className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium"
        style={{
          background: "rgba(167,139,255,0.1)",
          color: "#A78BFF",
          border: "1px solid rgba(167,139,255,0.2)",
        }}
      >
        <Sparkles className="h-3 w-3" />
        Ready
      </span>
    );
  }
  return (
    <span
      className="text-xs rounded-full px-3 py-1"
      style={{
        background: "#1E1E2E",
        color: "#7A7A8C",
      }}
    >
      Awaiting input
    </span>
  );
}

function EmptyState() {
  return (
    <div className="flex flex-col items-center gap-4 py-8 text-center">
      <div
        className="flex h-12 w-12 items-center justify-center rounded-xl"
        style={{ background: "#12121A", border: "1px solid #1E1E2E" }}
      >
        <Sparkles className="h-5 w-5" style={{ color: "#7A7A8C" }} />
      </div>
      <div>
        <p className="text-sm font-medium text-white">AI ready to generate</p>
        <p className="text-xs mt-1" style={{ color: "#7A7A8C" }}>
          Fill in the client name, case type, and description to generate a live case summary.
        </p>
      </div>
      {/* Placeholder skeleton lines */}
      <div className="w-full flex flex-col gap-2.5 mt-2">
        {[85, 70, 55].map((w, i) => (
          <div
            key={i}
            className="h-3 rounded-full"
            style={{ width: `${w}%`, background: "#1E1E2E", opacity: 0.5 }}
          />
        ))}
      </div>
    </div>
  );
}

function SkeletonLines() {
  return (
    <div className="flex flex-col gap-4">
      <style>{`
        @keyframes shimmer {
          0% { background-position: -200% 0; }
          100% { background-position: 200% 0; }
        }
        .shimmer-line {
          background: linear-gradient(90deg, #1E1E2E 25%, #2a2a3e 50%, #1E1E2E 75%);
          background-size: 200% 100%;
          animation: shimmer 1.5s infinite;
          border-radius: 4px;
        }
      `}</style>
      {/* Group label skeleton */}
      <div className="flex flex-col gap-2">
        <div className="shimmer-line h-3 w-20" />
        <div className="shimmer-line h-4 w-3/4" />
      </div>
      <div className="flex flex-col gap-2">
        <div className="shimmer-line h-3 w-16" />
        <div className="shimmer-line h-4 w-1/2" />
      </div>
      <div className="flex flex-col gap-2">
        <div className="shimmer-line h-3 w-24" />
        <div className="shimmer-line h-4 w-full" />
        <div className="shimmer-line h-4 w-5/6" />
        <div className="shimmer-line h-4 w-4/6" />
      </div>
    </div>
  );
}

function SummaryContent({
  form,
  aiSummary,
  actions,
  submitted,
}: {
  form: FormState;
  aiSummary: string;
  actions: string[];
  submitted: boolean;
}) {
  const rowLabel: React.CSSProperties = {
    fontSize: 11,
    fontWeight: 700,
    textTransform: "uppercase",
    letterSpacing: "0.06em",
    color: "#A78BFF",
    marginBottom: 2,
  };

  return (
    <div className="flex flex-col gap-5">
      {/* Client */}
      <div>
        <p style={rowLabel}>Client</p>
        <p className="text-sm text-white font-medium">
          {form.clientName || <span style={{ color: "#7A7A8C" }}>—</span>}
        </p>
      </div>

      {/* Case Type */}
      <div>
        <p style={rowLabel}>Case Type</p>
        <span
          className="inline-block text-xs font-medium px-2.5 py-1 rounded-md"
          style={{
            background: "rgba(124,111,255,0.1)",
            color: "#A78BFF",
            border: "1px solid rgba(124,111,255,0.2)",
          }}
        >
          {form.caseType || "—"}
        </span>
      </div>

      {/* AI Summary */}
      <div>
        <p style={rowLabel}>Summary</p>
        <p className="text-sm leading-relaxed" style={{ color: "#c8c4d7" }}>
          {aiSummary || "—"}
        </p>
      </div>

      {/* Recommended Actions */}
      <div>
        <p style={rowLabel}>Recommended Actions</p>
        <ol className="flex flex-col gap-2 mt-2">
          {actions.map((action, i) => (
            <li key={i} className="flex items-start gap-2.5">
              <span
                className="flex h-5 w-5 items-center justify-center rounded text-[10px] font-bold shrink-0 mt-0.5"
                style={{
                  background: submitted ? "rgba(45,212,191,0.15)" : "rgba(124,111,255,0.12)",
                  color: submitted ? "#2DD4BF" : "#A78BFF",
                  border: `1px solid ${submitted ? "rgba(45,212,191,0.3)" : "rgba(124,111,255,0.25)"}`,
                }}
              >
                {submitted ? <CheckCircle2 className="h-3 w-3" /> : i + 1}
              </span>
              <span className="text-sm" style={{ color: "#c8c4d7" }}>
                {action}
              </span>
            </li>
          ))}
        </ol>
      </div>

      {/* Contact & Date */}
      {(form.contactInfo || form.intakeDate) && (
        <div
          className="grid grid-cols-2 gap-4 pt-4"
          style={{ borderTop: "1px solid #1E1E2E" }}
        >
          {form.contactInfo && (
            <div>
              <p style={rowLabel}>Contact</p>
              <p className="text-xs" style={{ color: "#c8c4d7" }}>{form.contactInfo}</p>
            </div>
          )}
          {form.intakeDate && (
            <div>
              <p style={rowLabel}>Intake Date</p>
              <p className="text-xs" style={{ color: "#c8c4d7" }}>{form.intakeDate}</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
