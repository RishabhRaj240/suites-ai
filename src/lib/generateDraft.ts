import { createServerFn } from "@tanstack/react-start";

export type DraftInput = {
  documentType: string;
  partyA: string;
  partyB: string;
  jurisdiction: string;
  keyFacts: string;
};

export type DraftResult = {
  content: string;
  wordCount: number;
};

const TEMPLATES: Record<string, (d: DraftInput) => string> = {
  "Legal Notice": (d) => `LEGAL NOTICE
${"─".repeat(52)}
Date: ${new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}
From: ${d.partyA}
To:   ${d.partyB}
Jurisdiction: ${d.jurisdiction}
${"─".repeat(52)}

RE: FORMAL LEGAL NOTICE

Dear Sir/Madam,

This letter constitutes formal legal notice from ${d.partyA} ("Notifying Party") to ${d.partyB} ("Respondent").

BACKGROUND:
${d.keyFacts}

DEMAND:
You are hereby formally notified and required to take immediate corrective action within fourteen (14) calendar days of receipt of this notice.

CONSEQUENCE OF NON-COMPLIANCE:
Failure to comply will result in the Notifying Party pursuing all available legal remedies, including but not limited to civil litigation, injunctive relief, and recovery of all costs and attorney's fees.

This notice is issued without prejudice to any other rights or remedies available under the laws of ${d.jurisdiction}.

Respectfully,
${d.partyA}

────────────────────────────────────────
This document is a formal legal notice. Retain for your records.`,

  "Non-Disclosure Agreement (NDA)": (d) => `NON-DISCLOSURE AGREEMENT
${"─".repeat(52)}
Date: ${new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}
Parties: ${d.partyA} ("Disclosing Party")
         ${d.partyB} ("Receiving Party")
Jurisdiction: ${d.jurisdiction}
${"─".repeat(52)}

This Non-Disclosure Agreement ("Agreement") is entered into as of the date written above between the parties identified herein.

1. CONFIDENTIAL INFORMATION
   "Confidential Information" means any data or information, oral or written, that relates to the business of either party and is not generally known to the public. Context: ${d.keyFacts}

2. OBLIGATIONS
   The Receiving Party agrees to: (a) hold all Confidential Information in strict confidence; (b) not disclose to third parties without prior written consent; (c) use Confidential Information solely for the purpose of evaluating a potential business relationship.

3. TERM
   This Agreement shall remain in effect for a period of two (2) years from the date of execution.

4. GOVERNING LAW
   This Agreement shall be governed by the laws of ${d.jurisdiction}.

5. REMEDIES
   Each party acknowledges that breach of this Agreement would cause irreparable harm for which monetary damages would be an inadequate remedy.

IN WITNESS WHEREOF, the parties have executed this Agreement as of the date first written above.

${d.partyA}                    ${d.partyB}
Signature: _______________    Signature: _______________
Date: ________________        Date: ________________`,

  "Cease & Desist Letter": (d) => `CEASE AND DESIST LETTER
${"─".repeat(52)}
Date: ${new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}
From: ${d.partyA}
To:   ${d.partyB}
Jurisdiction: ${d.jurisdiction}
${"─".repeat(52)}

VIA CERTIFIED MAIL — RETURN RECEIPT REQUESTED

Dear ${d.partyB},

This Cease and Desist letter is sent on behalf of ${d.partyA} ("Client"). You are hereby formally demanded to IMMEDIATELY CEASE AND DESIST all activities described herein.

NATURE OF VIOLATION:
${d.keyFacts}

DEMAND:
You must immediately: (1) cease all infringing activities; (2) provide written confirmation of compliance within ten (10) days; (3) preserve all evidence related to the above matters.

CONSEQUENCES:
If you fail to comply with this demand, our client will pursue all available legal remedies under the laws of ${d.jurisdiction}, including injunctive relief, damages, and attorney's fees.

This letter is not an exhaustive statement of our client's rights or remedies, all of which are expressly reserved.

Sincerely,
Counsel for ${d.partyA}

────────────────────────────────────────
IMPORTANT LEGAL DOCUMENT — IMMEDIATE RESPONSE REQUIRED`,

  "Demand Letter": (d) => `DEMAND LETTER
${"─".repeat(52)}
Date: ${new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}
From: ${d.partyA}
To:   ${d.partyB}
Jurisdiction: ${d.jurisdiction}
${"─".repeat(52)}

RE: DEMAND FOR PAYMENT / PERFORMANCE

Dear ${d.partyB},

This letter is a formal demand from ${d.partyA} ("Claimant") addressed to ${d.partyB} ("Respondent").

STATEMENT OF CLAIM:
${d.keyFacts}

AMOUNT/ACTION DEMANDED:
Claimant demands full satisfaction of the above claim within thirty (30) days of receipt of this letter.

FAILURE TO RESPOND:
Should you fail to respond satisfactorily within the time stated, Claimant will, without further notice, commence legal proceedings in the appropriate court of ${d.jurisdiction} and will seek all available remedies including costs and interest.

Yours faithfully,
${d.partyA}

────────────────────────────────────────
Please be advised this matter will be escalated if unresolved.`,

  default: (d) => `LEGAL DOCUMENT — ${d.documentType.toUpperCase()}
${"─".repeat(52)}
Date: ${new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}
Party A: ${d.partyA}
Party B: ${d.partyB}
Jurisdiction: ${d.jurisdiction}
${"─".repeat(52)}

${d.keyFacts}

────────────────────────────────────────
Generated by Suites AI · Powered by Gemini 2.5 Flash`,
};

function buildPrompt(d: DraftInput): string {
  return `You are a senior legal drafting AI. Draft a professional, complete ${d.documentType} document using formal legal language appropriate for ${d.jurisdiction} jurisdiction.

Document Type: ${d.documentType}
Party A (First Party): ${d.partyA}
Party B (Second Party): ${d.partyB}
Jurisdiction: ${d.jurisdiction}
Key Facts / Context: ${d.keyFacts}

Requirements:
- Use formal legal language and standard document structure
- Include proper headers, sections, and signature blocks
- Use plain text formatting with ASCII dividers (─ characters)
- Include today's date: ${new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}
- Output ONLY the document text, no explanations or markdown

Draft the complete ${d.documentType} document now:`;
}

export const generateDraft = createServerFn({ method: "POST" })
  .validator((data: unknown) => data as DraftInput)
  .handler(async ({ data }) => {
    const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

    if (!GEMINI_API_KEY) {
      // Use local template fallback
      const templateFn = TEMPLATES[data.documentType] ?? TEMPLATES["default"];
      const content = templateFn(data);
      const wordCount = content.trim().split(/\s+/).length;
      return { content, wordCount } satisfies DraftResult;
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
              temperature: 0.3,
              maxOutputTokens: 2048,
            },
          }),
        }
      );

      if (!response.ok) {
        console.error("[Gemini draft] error", response.status);
        const fallback = (TEMPLATES[data.documentType] ?? TEMPLATES["default"])(data);
        return { content: fallback, wordCount: fallback.split(/\s+/).length };
      }

      const result = await response.json() as {
        candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }>;
      };

      const content =
        result?.candidates?.[0]?.content?.parts?.[0]?.text?.trim() ??
        (TEMPLATES[data.documentType] ?? TEMPLATES["default"])(data);

      const wordCount = content.trim().split(/\s+/).length;
      return { content, wordCount } satisfies DraftResult;
    } catch (err) {
      console.error("[Gemini draft] error:", err);
      const fallback = (TEMPLATES[data.documentType] ?? TEMPLATES["default"])(data);
      return { content: fallback, wordCount: fallback.split(/\s+/).length };
    }
  });
