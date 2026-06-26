import { createServerFn } from "@tanstack/react-start";

type SummaryInput = {
  clientName: string;
  caseType: string;
  description: string;
  contactInfo: string;
  intakeDate: string;
};

function buildPrompt(data: SummaryInput): string {
  return `You are a concise legal intake assistant. Write a professional 2-3 sentence case summary for a law firm's records.

Client Name: ${data.clientName}
Case Type: ${data.caseType}
Description: ${data.description}
Contact: ${data.contactInfo}
Intake Date: ${data.intakeDate}

Write only the summary paragraph. Be specific, professional, and concise. Do not include bullet points or headings.`;
}

function generateFallbackSummary(data: SummaryInput): string {
  const desc = data.description.slice(0, 200);
  const ellipsis = data.description.length > 200 ? "..." : "";
  return `This matter involves ${data.clientName || "the client"}, seeking legal representation for a ${data.caseType || "legal"} case. ${desc}${ellipsis} The client can be reached at ${data.contactInfo || "[contact pending]"}. Intake was recorded on ${data.intakeDate || "the current date"}.`;
}

export const generateCaseSummary = createServerFn({ method: "POST" })
  .validator((data: unknown) => data as SummaryInput)
  .handler(async ({ data }) => {
    const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

    if (!GEMINI_API_KEY) {
      return { summary: generateFallbackSummary(data) };
    }

    try {
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-lite:generateContent?key=${GEMINI_API_KEY}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            contents: [{ parts: [{ text: buildPrompt(data) }] }],
            generationConfig: {
              temperature: 0.4,
              maxOutputTokens: 512,
            },
          }),
        }
      );

      if (!response.ok) {
        console.error("[Gemini] API error:", response.status, await response.text());
        return { summary: generateFallbackSummary(data) };
      }

      const result = await response.json() as {
        candidates?: Array<{
          content?: { parts?: Array<{ text?: string }> };
        }>;
      };

      const summary =
        result?.candidates?.[0]?.content?.parts?.[0]?.text?.trim() ??
        generateFallbackSummary(data);

      return { summary };
    } catch (err) {
      console.error("[Gemini] Fetch error:", err);
      return { summary: generateFallbackSummary(data) };
    }
  });
