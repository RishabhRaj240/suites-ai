/**
 * FastAPI Backend Client
 *
 * Centralized HTTP client that:
 *  1. Reads the backend URL from localStorage (configured in Settings)
 *  2. Attaches the Supabase Bearer token to every request
 *  3. Provides typed wrappers for all 4 backend endpoints
 *  4. Throws on failure so callers can fall back to createServerFn
 */

import { supabase } from "@/integrations/supabase/client";

// ─── Config ───────────────────────────────────────────────────────────────────

const DEFAULT_URL = import.meta.env.VITE_FASTAPI_URL ?? "http://localhost:8000";

export function getBackendUrl(): string {
  if (typeof window === "undefined") return DEFAULT_URL;
  return localStorage.getItem("suites_backend_url")?.replace(/\/$/, "") ?? DEFAULT_URL;
}

export async function getAuthHeaders(): Promise<HeadersInit> {
  const { data } = await supabase.auth.getSession();
  const token = data.session?.access_token;
  return {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

// ─── Generic request helper ───────────────────────────────────────────────────

async function post<T>(path: string, body: unknown, timeoutMs = 15_000): Promise<T> {
  const url = `${getBackendUrl()}${path}`;
  const headers = await getAuthHeaders();

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const res = await fetch(url, {
      method: "POST",
      headers,
      body: JSON.stringify(body),
      signal: controller.signal,
    });

    if (!res.ok) {
      const text = await res.text().catch(() => "");
      throw new Error(`FastAPI ${path} → ${res.status}: ${text}`);
    }

    return res.json() as Promise<T>;
  } finally {
    clearTimeout(timer);
  }
}

async function get<T>(path: string, timeoutMs = 10_000): Promise<T> {
  const url = `${getBackendUrl()}${path}`;
  const headers = await getAuthHeaders();

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const res = await fetch(url, { method: "GET", headers, signal: controller.signal });
    if (!res.ok) throw new Error(`FastAPI ${path} → ${res.status}`);
    return res.json() as Promise<T>;
  } finally {
    clearTimeout(timer);
  }
}

// ─── Health check ─────────────────────────────────────────────────────────────

export async function checkBackendHealth(): Promise<boolean> {
  try {
    await get<unknown>("/health", 5_000);
    return true;
  } catch {
    return false;
  }
}

// ─── Endpoint Types ───────────────────────────────────────────────────────────

// POST /intake
export type IntakePayload = {
  client_name: string;
  case_type: string;
  description: string;
  contact_info: string;
  intake_date: string;
};
export type IntakeResponse = {
  ai_summary: string;
  case_id?: string;
};

// POST /contract-review
export type ContractReviewPayload = {
  file_url: string;       // Supabase Storage public URL
  file_name: string;
  file_size: number;
};
export type ContractReviewResponse = {
  risk_score: number;
  key_clauses: Array<{ name: string; risk: "high" | "medium" | "low" | "neutral"; text: string }>;
  red_flags: Array<{ title: string; detail: string }>;
  ai_summary: string;
};

// POST /draft
export type DraftPayload = {
  document_type: string;
  party_a: string;
  party_b: string;
  jurisdiction: string;
  key_facts: string;
};
export type DraftResponse = {
  content: string;
  word_count: number;
};

// POST /research
export type ResearchPayload = {
  query: string;
};
export type ResearchResponse = {
  results: Array<{
    id: string;
    title: string;
    source: string;
    jurisdiction: string;
    relevance_score: number;
    excerpt: string;
    category: "case_law" | "statute" | "academic" | "regulation";
  }>;
};

// ─── Endpoint Wrappers ────────────────────────────────────────────────────────

/**
 * POST /intake
 * Saves client data and returns an AI-generated case summary.
 */
export async function callIntake(payload: IntakePayload): Promise<IntakeResponse> {
  return post<IntakeResponse>("/intake", payload);
}

/**
 * POST /contract-review
 * Accepts a Supabase Storage file URL and returns contract analysis.
 */
export async function callContractReview(
  payload: ContractReviewPayload
): Promise<ContractReviewResponse> {
  return post<ContractReviewResponse>("/contract-review", payload);
}

/**
 * POST /draft
 * Accepts form inputs and returns a generated legal document.
 */
export async function callDraft(payload: DraftPayload): Promise<DraftResponse> {
  return post<DraftResponse>("/draft", payload);
}

/**
 * POST /research
 * Accepts a search query and returns structured legal research results.
 */
export async function callResearch(payload: ResearchPayload): Promise<ResearchResponse> {
  return post<ResearchResponse>("/research", payload);
}

// ─── Availability flag ────────────────────────────────────────────────────────

/**
 * Returns true if the user has configured a non-default backend URL.
 * Used by pages to decide whether to attempt FastAPI first.
 */
export function isFastApiConfigured(): boolean {
  const url = getBackendUrl();
  return Boolean(url && url !== "http://localhost:8000");
}
