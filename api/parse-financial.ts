// api/parse-financial.ts
// Receives base64 PDF, sends to Claude, returns structured financial data
// Add to your Slate api/ folder

import type { VercelRequest, VercelResponse } from "@vercel/node";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  res.setHeader("Access-Control-Allow-Origin", "*");

  const { pdfBase64, fileType } = req.body as { pdfBase64: string; fileType: string; networkName: string };

  if (!pdfBase64) return res.status(400).json({ error: "No file provided" });

  const isExcel = fileType?.includes("excel") || fileType?.includes("spreadsheet") || fileType?.includes("xlsx");

  const prompt = `You are a charter school financial analyst. Extract ALL financial data from this monthly close report and return it as structured JSON.

Extract:
- reportingPeriod: the month/period covered (e.g. "February 28, 2026")
- fiscalYear: e.g. "FY26"
- networkName: the school network name
- monthsElapsed: number of months in the fiscal year to date

P&L (all in thousands $000s):
- operationalRevenues: { actual, budget, variance }
- operationalExpenses: { actual, budget, variance }
- revenueMinusExpenses: { actual, budget, variance }
- netIncome: { actual, budget, variance }
- personnel: { actual, budget, variance }
- nonPersonnel: { actual, budget, variance }

Balance sheet:
- totalAssets: current value
- totalLiabilities: current value  
- netAssets: current value
- cashAndInvestments: current value
- daysOfCashOnHand: number

Key metrics:
- dscr: debt service coverage ratio (number)
- dscrCovenant: the required minimum (usually 1.0)
- currentRatio: number
- currentRatioCovenant: required minimum (usually 1.1)
- netAssetRatio: percentage as number (e.g. 62 not 0.62)

Bond covenant compliance (array of objects):
- covenants: [{ name, actual, required, status: "PASS" | "FAIL" | "WATCH" }]

Executive highlights (array of strings):
- highlights: up to 5 key takeaways from the report

CFO narrative context:
- revenueNote: brief note on revenue performance
- expenseNote: brief note on expense drivers
- overallAssessment: one sentence overall financial health assessment

Return ONLY valid JSON. No markdown, no backticks, no explanation.`;

  try {
    const baseUrl = process.env.VERCEL_URL
      ? `https://${process.env.VERCEL_URL}`
      : "http://localhost:5173";

    const response = await fetch(`${baseUrl}/api/anthropic-proxy`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "claude-sonnet-4-20250514",
        max_tokens: 4000,
        messages: [
          {
            role: "user",
            content: [
              {
                type: "document",
                source: {
                  type: "base64",
                  media_type: isExcel ? "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" : "application/pdf",
                  data: pdfBase64,
                },
              },
              {
                type: "text",
                text: prompt,
              },
            ],
          },
        ],
      }),
    });

    if (!response.ok) {
      const err = await response.text();
      return res.status(500).json({ error: "Claude API error", detail: err });
    }

    const data = await response.json() as { content: Array<{ type: string; text: string }> };
    const raw = data.content?.[0]?.text ?? "";

    // Strip any markdown fences just in case
    const clean = raw.replace(/```json\s*|```\s*/g, "").trim();

    let parsed: unknown;
    try {
      parsed = JSON.parse(clean);
    } catch {
      return res.status(500).json({ error: "Failed to parse Claude response", raw: raw.slice(0, 500) });
    }

    return res.json({ success: true, data: parsed });

  } catch (err) {
    return res.status(500).json({ error: String(err) });
  }
}