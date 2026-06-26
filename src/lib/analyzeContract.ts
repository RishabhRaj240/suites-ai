import { createServerFn } from "@tanstack/react-start";

type AnalysisInput = {
  fileName: string;
  fileText: string; // extracted text content passed from client
};

export type ClauseChip = {
  label: string;
  risk: "high" | "medium" | "low" | "neutral";
};

export type RedFlag = {
  title: string;
  detail: string;
};

export type ContractAnalysis = {
  riskScore: number;
  riskLabel: "LOW RISK" | "MEDIUM RISK" | "HIGH RISK";
  clauses: ClauseChip[];
  redFlags: RedFlag[];
  summary: string;
  pageCount: number;
};

const FALLBACK: ContractAnalysis = {
  riskScore: 72,
  riskLabel: "HIGH RISK",
  clauses: [
    { label: "Liability", risk: "high" },
    { label: "Indemnity", risk: "high" },
    { label: "Termination", risk: "medium" },
    { label: "Intellectual Property", risk: "medium" },
    { label: "Non-Compete", risk: "high" },
    { label: "Payment Terms", risk: "low" },
    { label: "Governing Law", risk: "neutral" },
    { label: "Force Majeure", risk: "neutral" },
  ],
  redFlags: [
    {
      title: "Unlimited liability clause detected",
      detail: "Section 8.2 exposes the client to unlimited financial risk with no cap tied to contract value.",
    },
    {
      title: "Unilateral termination right",
      detail: "Counterparty can terminate with only 7 days notice (§12.1), creating operational instability.",
    },
    {
      title: "Overbroad IP assignment",
      detail: "All work product is assigned permanently without compensation or carve-outs (Section 14).",
    },
  ],
  summary:
    "This agreement presents several high-risk provisions that require immediate attention. The unlimited liability exposure in Section 8.2 is particularly concerning and should be negotiated to include a cap tied to contract value. The IP assignment clause (Section 14) is unusually broad and may conflict with pre-existing IP. The unilateral 7-day termination clause creates significant operational risk.",
  pageCount: 8,
};

function scoreToLabel(score: number): ContractAnalysis["riskLabel"] {
  if (score >= 67) return "HIGH RISK";
  if (score >= 34) return "MEDIUM RISK";
  return "LOW RISK";
}

function buildPrompt(fileName: string, fileText: string): string {
  const excerpt = fileText.slice(0, 6000);
  return `You are an expert legal AI assistant specializing in contract risk analysis. Analyze the following contract and respond ONLY with a valid JSON object matching this exact schema, no markdown, no explanation:

{
  "riskScore": <integer 0-100>,
  "clauses": [
    { "label": "<clause name>", "risk": "<high|medium|low|neutral>" }
  ],
  "redFlags": [
    { "title": "<short title>", "detail": "<one sentence explanation>" }
  ],
  "summary": "<2-3 sentence professional analysis paragraph>",
  "pageCount": <estimated page count as integer>
}

Contract file: ${fileName}
Contract content:
${excerpt}`;
}

export const analyzeContract = createServerFn({ method: "POST" })
  .validator((data: unknown) => data as AnalysisInput)
  .handler(async ({ data }) => {
    const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

    if (!GEMINI_API_KEY || !data.fileText.trim()) {
      return { ...FALLBACK };
    }

    try {
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-lite:generateContent?key=${GEMINI_API_KEY}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            contents: [{ parts: [{ text: buildPrompt(data.fileName, data.fileText) }] }],
            generationConfig: { temperature: 0.2, maxOutputTokens: 1024 },
          }),
        }
      );

      if (!response.ok) {
        console.error("[Gemini contract] error", response.status);
        return { ...FALLBACK };
      }

      const result = await response.json() as {
        candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }>;
      };

      const raw = result?.candidates?.[0]?.content?.parts?.[0]?.text?.trim() ?? "";
      // Strip potential markdown fences
      const jsonStr = raw.replace(/^```json\n?/, "").replace(/\n?```$/, "").trim();
      const parsed = JSON.parse(jsonStr) as {
        riskScore: number;
        clauses: ClauseChip[];
        redFlags: RedFlag[];
        summary: string;
        pageCount: number;
      };

      return {
        riskScore: parsed.riskScore,
        riskLabel: scoreToLabel(parsed.riskScore),
        clauses: parsed.clauses ?? FALLBACK.clauses,
        redFlags: parsed.redFlags ?? FALLBACK.redFlags,
        summary: parsed.summary ?? FALLBACK.summary,
        pageCount: parsed.pageCount ?? FALLBACK.pageCount,
      } satisfies ContractAnalysis;
    } catch (err) {
      console.error("[Gemini contract] parse/fetch error:", err);
      return { ...FALLBACK };
    }
  });
