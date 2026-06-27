import { useNavigate, useRouter } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

import { supabase } from "@/integrations/supabase/client";

export function AuthPage() {
  const navigate = useNavigate();
  const router = useRouter();
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [loading, setLoading] = useState(false);
  const [oauthLoading, setOauthLoading] = useState(false);

  // Redirect signed-in users away from /auth
  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (data.user) navigate({ to: "/", replace: true });
    });
  }, [navigate]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      if (mode === "signup") {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: window.location.origin,
            data: { full_name: fullName },
          },
        });
        if (error) throw error;
        // Email confirmation is disabled — navigate directly after signup.
        toast.success("Account created. Welcome to Suites AI.");
        router.invalidate();
        navigate({ to: "/", replace: true });
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) {
          // Supabase returns this error for users who signed up before
          // "Confirm email" was disabled in the project settings.
          // We surface a clear message directing them to sign up again
          // or contact support, since the account email is unverified.
          if (error.message === "Email not confirmed") {
            toast.error(
              "Your email address isn't verified yet. Please sign up again or contact support."
            );
            return;
          }
          throw error;
        }
        toast.success("Welcome back.");
        router.invalidate();
        navigate({ to: "/", replace: true });
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : "Something went wrong";
      toast.error(message);
    } finally {
      setLoading(false);
    }
  }

  async function handleGoogle() {
    setOauthLoading(true);
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: window.location.origin,
        },
      });
      if (error) {
        toast.error(error.message ?? "Google sign-in failed");
        setOauthLoading(false);
      }
      // On success the browser redirects — no further action needed here.
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Google sign-in failed");
      setOauthLoading(false);
    }
  }

  return (
    <div className="bg-aurora relative flex min-h-screen items-center justify-center overflow-hidden bg-background px-4 py-12">
      {/* Faint hairline grid */}
      <div className="bg-grid pointer-events-none absolute inset-0 opacity-[0.04]" />

      <div className="animate-fade-in relative w-full max-w-md">
        {/* Logo lockup */}
        <div className="mb-8 flex flex-col items-center text-center">
          <img
            src="/logo.png"
            alt="Suites AI Logo"
            className="mb-4 h-20 w-auto object-contain"
          />
          <h1 className="text-3xl text-foreground">Suites AI</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Your AI legal team, always on.
          </p>
        </div>

        {/* Card */}
        <div className="rounded-2xl border border-border bg-surface/80 p-8 shadow-elegant backdrop-blur-xl">
          <div className="mb-6">
            <h2 className="text-xl text-foreground">
              {mode === "signin" ? "Sign in" : "Create an account"}
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">
              {mode === "signin"
                ? "Welcome back. Pick up where you left off."
                : "Start your AI legal workspace in seconds."}
            </p>
          </div>

          <button
            onClick={handleGoogle}
            disabled={oauthLoading || loading}
            className="mb-5 flex h-11 w-full items-center justify-center gap-3 rounded-lg border border-border bg-background/60 text-sm font-medium text-foreground transition-colors hover:bg-secondary disabled:opacity-50"
          >
            {oauthLoading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <GoogleMark />
            )}
            Continue with Google
          </button>

          <div className="mb-5 flex items-center gap-3 text-xs uppercase tracking-wider text-muted-foreground">
            <div className="h-px flex-1 bg-border" />
            or
            <div className="h-px flex-1 bg-border" />
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {mode === "signup" && (
              <Field
                id="full_name"
                label="Full name"
                type="text"
                value={fullName}
                onChange={setFullName}
                placeholder="Ada Counsel"
                required
              />
            )}
            <Field
              id="email"
              label="Email"
              type="email"
              value={email}
              onChange={setEmail}
              placeholder="you@firm.com"
              required
            />
            <Field
              id="password"
              label="Password"
              type="password"
              value={password}
              onChange={setPassword}
              placeholder="••••••••"
              minLength={6}
              required
            />

            <button
              type="submit"
              disabled={loading || oauthLoading}
              className="bg-violet-gradient mt-2 inline-flex h-11 w-full items-center justify-center gap-2 rounded-lg text-sm font-semibold text-primary-foreground transition-shadow hover:shadow-violet-glow disabled:opacity-60"
            >
              {loading && <Loader2 className="h-4 w-4 animate-spin" />}
              {mode === "signin" ? "Sign in" : "Create account"}
            </button>
          </form>

          <p className="mt-6 text-center text-sm text-muted-foreground">
            {mode === "signin" ? "New to Suites AI?" : "Already have an account?"}{" "}
            <button
              type="button"
              onClick={() => setMode(mode === "signin" ? "signup" : "signin")}
              className="font-medium text-primary-glow hover:underline"
            >
              {mode === "signin" ? "Create an account" : "Sign in"}
            </button>
          </p>
        </div>

        <p className="mt-6 text-center text-xs text-muted-foreground">
          By continuing you agree to our Terms &amp; Privacy.
        </p>
      </div>
    </div>
  );
}

function Field({
  id,
  label,
  type,
  value,
  onChange,
  placeholder,
  required,
  minLength,
}: {
  id: string;
  label: string;
  type: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  required?: boolean;
  minLength?: number;
}) {
  return (
    <div className="space-y-1.5">
      <label
        htmlFor={id}
        className="text-xs font-medium uppercase tracking-wider text-muted-foreground"
      >
        {label}
      </label>
      <input
        id={id}
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        required={required}
        minLength={minLength}
        className="h-11 w-full rounded-lg border border-border bg-transparent px-3.5 text-sm text-foreground placeholder:text-muted-foreground/60 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/30"
      />
    </div>
  );
}

function GoogleMark() {
  return (
    <svg width="16" height="16" viewBox="0 0 48 48" aria-hidden>
      <path
        fill="#FFC107"
        d="M43.6 20.5H42V20H24v8h11.3c-1.6 4.7-6.1 8-11.3 8-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.9 1.2 8 3.1l5.7-5.7C34 6.1 29.3 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.2-.1-2.3-.4-3.5z"
      />
      <path
        fill="#FF3D00"
        d="M6.3 14.7l6.6 4.8C14.7 16 19 13 24 13c3.1 0 5.9 1.2 8 3.1l5.7-5.7C34 6.1 29.3 4 24 4 16.3 4 9.7 8.3 6.3 14.7z"
      />
      <path
        fill="#4CAF50"
        d="M24 44c5.2 0 9.9-2 13.4-5.2l-6.2-5.2C29.2 35.4 26.7 36 24 36c-5.2 0-9.6-3.3-11.3-8l-6.5 5C9.6 39.6 16.2 44 24 44z"
      />
      <path
        fill="#1976D2"
        d="M43.6 20.5H42V20H24v8h11.3c-.8 2.3-2.2 4.2-4.1 5.6l6.2 5.2C41 35.8 44 30.4 44 24c0-1.2-.1-2.3-.4-3.5z"
      />
    </svg>
  );
}
