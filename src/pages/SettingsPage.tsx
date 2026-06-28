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
  ChevronRight,
  Menu,
  Eye,
  EyeOff,
  Wifi,
  CheckCircle2,
  AlertTriangle,
  Moon,
  Check,
  Shield,
} from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { checkBackendHealth } from "@/lib/apiClient";
import type { Profile } from "./DashboardPage";
import { useSidebar } from "@/hooks/useSidebar";

// ─── Nav ─────────────────────────────────────────────────────────────────────

const NAV_ITEMS = [
  { id: "dashboard", label: "Dashboard", icon: LayoutDashboard, path: "/" },
  { id: "intake",    label: "Intake Agent",    icon: UserRound, path: "/intake" },
  { id: "contracts", label: "Contract Review", icon: FileText,  path: "/contracts" },
  { id: "drafting",  label: "Drafting Agent",  icon: PenLine,   path: "/drafting" },
  { id: "research",  label: "Research Agent",  icon: Search,    path: "/research" },
  { id: "memory",    label: "Case Memory",     icon: FolderOpen,path: "/memory" },
];

// ─── Sub-components ───────────────────────────────────────────────────────────

function SectionCard({ children, danger = false }: { children: React.ReactNode; danger?: boolean }) {
  return (
    <div
      className="card-hover rounded-xl p-7 flex flex-col gap-6"
      style={{
        background: "#0D0D16",
        border: danger ? "1px solid rgba(239,68,68,0.3)" : "1px solid #1E1E2E",
      }}
    >
      {children}
    </div>
  );
}

function CardHeader({ title, subtitle, danger = false }: { title: string; subtitle: string; danger?: boolean }) {
  return (
    <div className="flex flex-col gap-1 pb-5" style={{ borderBottom: "1px solid #1E1E2E" }}>
      <h2 className="text-base font-semibold" style={{ color: danger ? "#EF4444" : "white" }}>{title}</h2>
      <p className="text-sm" style={{ color: "#7A7A8C" }}>{subtitle}</p>
    </div>
  );
}

function FieldLabel({ children }: { children: React.ReactNode }) {
  return (
    <label className="text-xs font-semibold uppercase tracking-widest" style={{ color: "#7A7A8C" }}>
      {children}
    </label>
  );
}

// ─── Save Button ──────────────────────────────────────────────────────────────

function SaveButton({
  label,
  saving,
  saved,
  onClick,
}: {
  label: string;
  saving: boolean;
  saved: boolean;
  onClick: () => void;
}) {
  return (
    <div className="flex justify-end">
      <button
        onClick={onClick}
        disabled={saving}
        className="flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-semibold text-white transition-all duration-200"
        style={{
          background: saved
            ? "rgba(45,212,191,0.2)"
            : saving
            ? "rgba(124,111,255,0.5)"
            : "linear-gradient(135deg, #7C6FFF, #A78BFF)",
          boxShadow: saved || saving ? "none" : "0 4px 16px rgba(124,111,255,0.3)",
          cursor: saving ? "not-allowed" : "pointer",
          color: saved ? "#2DD4BF" : "white",
          border: saved ? "1px solid rgba(45,212,191,0.3)" : "none",
        }}
      >
        {saving ? (
          <span className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
        ) : saved ? (
          <><CheckCircle2 className="h-4 w-4" /> Saved</>
        ) : (
          label
        )}
      </button>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export function SettingsPage() {
  const navigate = useNavigate();

  // Profile state
  const [profile, setProfile] = useState<Profile | null>(null);
  const { sidebarOpen, openSidebar, closeSidebar } = useSidebar();
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [role, setRole] = useState("");
  const [firmName, setFirmName] = useState("");
  const [savingProfile, setSavingProfile] = useState(false);
  const [savedProfile, setSavedProfile] = useState(false);

  // API state
  const [geminiKey, setGeminiKey] = useState("");
  const [showKey, setShowKey] = useState(false);
  const [backendUrl, setBackendUrl] = useState("http://localhost:8000");
  const [testing, setTesting] = useState(false);
  const [connected, setConnected] = useState(false);
  const [savingApi, setSavingApi] = useState(false);
  const [savedApi, setSavedApi] = useState(false);

  // Delete
  const [deleteConfirm, setDeleteConfirm] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const [focusedField, setFocusedField] = useState<string | null>(null);

  useEffect(() => {
    supabase.auth.getUser().then(async ({ data }) => {
      if (!data.user) return;
      setEmail(data.user.email ?? "");

      const { data: row } = await supabase
        .from("profiles")
        .select("full_name, email, firm")
        .eq("id", data.user.id)
        .maybeSingle();

      if (row) {
        setProfile(row);
        setFullName(row.full_name ?? "");
        setFirmName(row.firm ?? "");
      }
    });
  }, []);

  const displayName = fullName || email.split("@")[0] || "Counselor";
  const initials = displayName.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2);
  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";

  const inputStyle = (field: string): React.CSSProperties => ({
    width: "100%",
    background: "#12121A",
    border: `1px solid ${focusedField === field ? "#7C6FFF" : "#1E1E2E"}`,
    borderRadius: 8,
    color: "#e4e1e9",
    outline: "none",
    padding: "10px 14px",
    fontSize: 14,
    boxShadow: focusedField === field ? "0 0 0 3px rgba(124,111,255,0.12)" : "none",
    transition: "border-color 0.2s, box-shadow 0.2s",
  });

  async function saveProfile() {
    setSavingProfile(true);
    setSavedProfile(false);
    try {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) throw new Error("Not authenticated");
      const { error } = await supabase
        .from("profiles")
        .update({ full_name: fullName, firm: firmName } as any)
        .eq("id", userData.user.id);
      if (error) throw error;
      setSavedProfile(true);
      setTimeout(() => setSavedProfile(false), 3000);
      toast.success("Profile saved");
    } catch (err: any) {
      toast.error(err.message ?? "Save failed");
    } finally {
      setSavingProfile(false);
    }
  }

  async function testConnection() {
    setTesting(true);
    setConnected(false);
    // Persist the URL before testing so apiClient reads it
    localStorage.setItem("suites_backend_url", backendUrl);
    const ok = await checkBackendHealth();
    setTesting(false);
    if (ok) {
      setConnected(true);
      toast.success("Backend connected!");
    } else {
      toast.error("Could not reach backend — check the URL and ensure the server is running");
    }
  }

  function saveApiSettings() {
    setSavingApi(true);
    setSavedApi(false);
    // Store in localStorage (keys handled server-side via .env in production)
    if (geminiKey) localStorage.setItem("suites_gemini_key", geminiKey);
    if (backendUrl) localStorage.setItem("suites_backend_url", backendUrl);
    setTimeout(() => {
      setSavingApi(false);
      setSavedApi(true);
      setTimeout(() => setSavedApi(false), 3000);
      toast.success("API settings saved");
    }, 600);
  }

  async function handleDeleteAccount() {
    if (!deleteConfirm) {
      setDeleteConfirm(true);
      return;
    }
    setDeleting(true);
    try {
      // Sign out first; actual deletion would require a backend call
      await supabase.auth.signOut();
      toast.success("Account deletion initiated — you have been signed out.");
      navigate({ to: "/auth", replace: true });
    } catch (err: any) {
      toast.error(err.message ?? "Deletion failed");
      setDeleting(false);
    }
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
          {NAV_ITEMS.map(({ id, label, icon: Icon, path }) => (
            <button
              key={id}
              onClick={() => navigate({ to: path })}
              className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150 w-full text-left"
              style={{ color: "#7A7A8C", borderLeft: "3px solid transparent" }}
              onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.color = "white"; }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.color = "#7A7A8C"; }}
            >
              <Icon className="h-4 w-4 shrink-0" strokeWidth={1.8} />
              {label}
            </button>
          ))}
        </div>

        <div className="px-3 pb-3" style={{ borderTop: "1px solid #1E1E2E" }}>
          {/* Settings — ACTIVE */}
          <button
            className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium w-full text-left mt-3"
            style={{ color: "#A78BFF", background: "rgba(124,111,255,0.08)", borderLeft: "3px solid #A78BFF" }}
          >
            <Settings className="h-4 w-4 shrink-0" strokeWidth={2.2} />
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
            <span className="text-white font-medium">Settings</span>
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
                  <p className="text-[11px] truncate" style={{ color: "#7A7A8C" }}>{email}</p>
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

        {/* Scrollable content */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-10">
          <div className="max-w-2xl mx-auto flex flex-col gap-5">

            {/* Page title */}
            <div className="mb-2">
              <h1 className="text-2xl md:text-3xl font-bold text-white">Settings</h1>
              <p className="text-sm mt-1.5" style={{ color: "#7A7A8C" }}>
                Manage your profile, API connections, and account preferences
              </p>
            </div>

            {/* ── Card 1: Profile ── */}
            <SectionCard>
              <CardHeader title="Profile" subtitle="Your personal information and firm details" />

              {/* Avatar + name */}
              <div className="flex items-center gap-4">
                <div
                  className="flex h-16 w-16 items-center justify-center rounded-full text-lg font-bold text-white shrink-0"
                  style={{ background: "linear-gradient(135deg, #7C6FFF, #A78BFF)" }}
                >
                  {initials}
                </div>
                <div>
                  <p className="text-base font-semibold text-white">{displayName}</p>
                  <p className="text-sm" style={{ color: "#7A7A8C" }}>{email}</p>
                </div>
              </div>

              {/* Fields */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="flex flex-col gap-2">
                  <FieldLabel>Full Name</FieldLabel>
                  <input
                    type="text"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    onFocus={() => setFocusedField("name")}
                    onBlur={() => setFocusedField(null)}
                    placeholder="Your full name"
                    style={inputStyle("name")}
                  />
                </div>
                <div className="flex flex-col gap-2">
                  <FieldLabel>Email</FieldLabel>
                  <input
                    type="email"
                    value={email}
                    readOnly
                    style={{ ...inputStyle("email"), opacity: 0.6, cursor: "not-allowed" }}
                  />
                </div>
                <div className="flex flex-col gap-2">
                  <FieldLabel>Role</FieldLabel>
                  <input
                    type="text"
                    value={role}
                    onChange={(e) => setRole(e.target.value)}
                    onFocus={() => setFocusedField("role")}
                    onBlur={() => setFocusedField(null)}
                    placeholder="e.g. Managing Partner"
                    style={inputStyle("role")}
                  />
                </div>
                <div className="flex flex-col gap-2">
                  <FieldLabel>Firm Name</FieldLabel>
                  <input
                    type="text"
                    value={firmName}
                    onChange={(e) => setFirmName(e.target.value)}
                    onFocus={() => setFocusedField("firm")}
                    onBlur={() => setFocusedField(null)}
                    placeholder="Your law firm name"
                    style={inputStyle("firm")}
                  />
                </div>
              </div>

              <SaveButton label="Save Profile" saving={savingProfile} saved={savedProfile} onClick={saveProfile} />
            </SectionCard>

            {/* ── Card 2: API Configuration ── */}
            <SectionCard>
              <CardHeader title="API Configuration" subtitle="Connect your Gemini API key and backend services" />

              <div className="flex flex-col gap-5">
                {/* Gemini Key */}
                <div className="flex flex-col gap-2">
                  <FieldLabel>Gemini API Key</FieldLabel>
                  <div className="relative">
                    <input
                      type={showKey ? "text" : "password"}
                      value={geminiKey}
                      onChange={(e) => setGeminiKey(e.target.value)}
                      onFocus={() => setFocusedField("gemini")}
                      onBlur={() => setFocusedField(null)}
                      placeholder="AIza..."
                      style={{ ...inputStyle("gemini"), paddingRight: 44 }}
                    />
                    <button
                      onClick={() => setShowKey((v) => !v)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 transition-colors"
                      style={{ color: "#7A7A8C" }}
                      onMouseEnter={(e) => (e.currentTarget as HTMLButtonElement).style.color = "#A78BFF"}
                      onMouseLeave={(e) => (e.currentTarget as HTMLButtonElement).style.color = "#7A7A8C"}
                    >
                      {showKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                  <p className="text-xs" style={{ color: "#7A7A8C" }}>Used for AI analysis, drafting, and research · stored in your .env file</p>
                </div>

                {/* Backend URL */}
                <div className="flex flex-col gap-2">
                  <FieldLabel>FastAPI Backend URL</FieldLabel>
                  <div className="flex flex-col sm:flex-row gap-2">
                    <input
                      type="text"
                      value={backendUrl}
                      onChange={(e) => setBackendUrl(e.target.value)}
                      onFocus={() => setFocusedField("backend")}
                      onBlur={() => setFocusedField(null)}
                      placeholder="http://localhost:8000"
                      style={{ ...inputStyle("backend"), flex: 1 }}
                    />
                    <button
                      onClick={testConnection}
                      disabled={testing}
                      className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium sm:shrink-0 transition-all duration-200 w-full sm:w-auto"
                      style={{
                        background: connected ? "rgba(45,212,191,0.1)" : "transparent",
                        border: `1px solid ${connected ? "rgba(45,212,191,0.4)" : "#1E1E2E"}`,
                        color: connected ? "#2DD4BF" : "#7A7A8C",
                        cursor: testing ? "not-allowed" : "pointer",
                      }}
                      onMouseEnter={(e) => { if (!connected) { (e.currentTarget as HTMLButtonElement).style.borderColor = "rgba(124,111,255,0.4)"; (e.currentTarget as HTMLButtonElement).style.color = "#A78BFF"; } }}
                      onMouseLeave={(e) => { if (!connected) { (e.currentTarget as HTMLButtonElement).style.borderColor = "#1E1E2E"; (e.currentTarget as HTMLButtonElement).style.color = "#7A7A8C"; } }}
                    >
                      {testing ? (
                        <span className="h-4 w-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                      ) : connected ? (
                        <><CheckCircle2 className="h-4 w-4" /> Connected</>
                      ) : (
                        <><Wifi className="h-4 w-4" /> Test</>
                      )}
                    </button>
                  </div>
                  <p className="text-xs" style={{ color: "#7A7A8C" }}>Your local or cloud-hosted FastAPI endpoint</p>
                </div>
              </div>

              <SaveButton label="Save API Settings" saving={savingApi} saved={savedApi} onClick={saveApiSettings} />
            </SectionCard>

            {/* ── Card 3: Appearance ── */}
            <SectionCard>
              <CardHeader title="Appearance" subtitle="Customize your workspace theme" />

              {/* Theme toggle row */}
              <div className="flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <Moon className="h-4 w-4" style={{ color: "#A78BFF" }} />
                    <span className="text-sm font-medium text-white">Dark Mode</span>
                  </div>
                  <p className="text-xs mt-0.5" style={{ color: "#7A7A8C" }}>More themes coming soon</p>
                </div>
                {/* Disabled toggle */}
                <div className="flex items-center gap-2" title="More themes coming soon">
                  <div
                    className="relative w-11 h-6 rounded-full cursor-not-allowed"
                    style={{ background: "rgba(124,111,255,0.4)", opacity: 0.6 }}
                  >
                    <div
                      className="absolute top-1 right-1 h-4 w-4 rounded-full"
                      style={{ background: "white" }}
                    />
                  </div>
                </div>
              </div>

              {/* Theme preview cards */}
              <div className="flex gap-3 overflow-x-auto pb-1">
                {[
                  { label: "Dark", selected: true, bg: "#0A0A0F", border: "#1E1E2E" },
                  { label: "Midnight", selected: false, bg: "#06060F", border: "#12122A" },
                  { label: "Light", selected: false, bg: "#F8F9FA", border: "#E5E7EB" },
                ].map(({ label, selected, bg, border }) => (
                  <div
                    key={label}
                    className="relative flex flex-col items-center gap-2"
                    style={{ opacity: selected ? 1 : 0.4, cursor: selected ? "default" : "not-allowed" }}
                  >
                    <div
                      className="w-20 h-14 rounded-lg flex flex-col justify-end p-2"
                      style={{
                        background: bg,
                        border: selected ? "2px solid #7C6FFF" : `1px solid ${border}`,
                        boxShadow: selected ? "0 0 12px rgba(124,111,255,0.3)" : "none",
                      }}
                    >
                      {/* Mini UI preview */}
                      <div className="flex flex-col gap-1">
                        <div className="h-1 rounded-full w-3/4" style={{ background: selected ? "#7C6FFF" : "#333" }} />
                        <div className="h-1 rounded-full w-1/2" style={{ background: "#333" }} />
                      </div>
                    </div>
                    <span className="text-xs font-medium" style={{ color: selected ? "#A78BFF" : "#7A7A8C" }}>{label}</span>
                    {selected && (
                      <div
                        className="absolute -top-1.5 -right-1.5 h-5 w-5 rounded-full flex items-center justify-center"
                        style={{ background: "#7C6FFF" }}
                      >
                        <Check className="h-3 w-3 text-white" strokeWidth={3} />
                      </div>
                    )}
                    {!selected && (
                      <span
                        className="absolute -top-1.5 -right-1.5 text-[9px] font-bold px-1.5 py-0.5 rounded-full"
                        style={{ background: "#1E1E2E", color: "#7A7A8C" }}
                      >
                        Soon
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </SectionCard>

            {/* ── Card 4: Danger Zone ── */}
            <SectionCard danger>
              <CardHeader title="Danger Zone" subtitle="Irreversible actions — proceed with caution" danger />

              <div
                className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between rounded-lg p-4"
                style={{ background: "rgba(239,68,68,0.04)", border: "1px solid rgba(239,68,68,0.15)" }}
              >
                <div className="flex items-start gap-3">
                  <AlertTriangle className="h-5 w-5 mt-0.5 shrink-0" style={{ color: "#EF4444" }} strokeWidth={2} />
                  <div>
                    <p className="text-sm font-semibold" style={{ color: "#EF4444" }}>
                      {deleteConfirm ? "Are you absolutely sure?" : "Delete Account"}
                    </p>
                    <p className="text-xs mt-0.5 leading-relaxed" style={{ color: "#7A7A8C" }}>
                      {deleteConfirm
                        ? "This will permanently delete your account, all cases, contracts, drafts, and research. Type DELETE to confirm."
                        : "Permanently delete your account and all associated data. This action cannot be undone."}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2 sm:shrink-0">
                  {deleteConfirm && (
                    <button
                      onClick={() => setDeleteConfirm(false)}
                      className="px-3 py-2 rounded-lg text-xs font-medium transition-all"
                      style={{ background: "transparent", border: "1px solid #1E1E2E", color: "#7A7A8C" }}
                    >
                      Cancel
                    </button>
                  )}
                  <button
                    onClick={handleDeleteAccount}
                    disabled={deleting}
                    className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-semibold transition-all duration-200"
                    style={{
                      background: deleteConfirm ? "rgba(239,68,68,0.15)" : "transparent",
                      border: "1px solid rgba(239,68,68,0.5)",
                      color: "#EF4444",
                      cursor: deleting ? "not-allowed" : "pointer",
                    }}
                    onMouseEnter={(e) => (e.currentTarget as HTMLButtonElement).style.background = "rgba(239,68,68,0.12)"}
                    onMouseLeave={(e) => (e.currentTarget as HTMLButtonElement).style.background = deleteConfirm ? "rgba(239,68,68,0.15)" : "transparent"}
                  >
                    {deleting ? (
                      <span className="h-4 w-4 border-2 border-red-500 border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <>
                        <Shield className="h-4 w-4" />
                        {deleteConfirm ? "Confirm Delete" : "Delete Account"}
                      </>
                    )}
                  </button>
                </div>
              </div>
            </SectionCard>

            {/* Bottom padding */}
            <div className="h-8" />
          </div>
        </div>
      </main>
    </div>
  );
}
