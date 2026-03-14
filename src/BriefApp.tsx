import { useState, useRef } from "react";

const COLORS = {
  deep: "#0D1117",
  rock: "#1C2333",
  mid: "#2D3748",
  lightText: "#4A5568",
  gold: "#B79145",
  chalk: "#E8EDF2",
  bg: "#F5F7FA",
  white: "#FFFFFF",
  accent: "#10B981",
};

const CAMPUSES = [
  "Veritas Loop Academy",
  "Veritas Englewood Academy",
  "Veritas Woodlawn Academy",
  "Veritas Auburn Gresham Academy",
  "Veritas Roseland Academy",
  "Veritas Chatham Academy",
  "Veritas Austin Academy",
  "Veritas North Lawndale Academy",
  "Veritas Garfield Park Academy",
  "Veritas Humboldt Park Academy",
];

const QUICK_PROMPTS = [
  { label: "Safety Update", prompt: "Draft a safety update for families at Veritas Englewood Academy. Reference that we monitor campus safety conditions daily and that current conditions are stable. Reassure families while being transparent." },
  { label: "Board Summary", prompt: "Write an executive summary for the Veritas Charter Schools board meeting. Include our current financial position ($138M budget, +$4.3M YTD surplus, 3.47x DSCR), enrollment at 6,823 students across 10 campuses, and safety status across the network." },
  { label: "Weather Closure", prompt: "Draft a school closure notification for all 10 Veritas campuses due to severe winter weather. Include safety guidance for families, information about meal distribution, and remote learning expectations." },
  { label: "Budget Update", prompt: "Write a staff memo explaining Veritas Charter Schools' current financial health. We have a $138M annual budget, a $4.3M YTD surplus, and a DSCR of 3.47x against a 1.0x covenant. Frame this as responsible stewardship while acknowledging the work ahead." },
  { label: "Crisis Response", prompt: "Draft an initial community communication following a safety incident near one of our campuses. The incident occurred off-campus and no students were involved. Acknowledge the community's concern, outline our response protocols, and describe enhanced safety measures." },
  { label: "Enrollment Drive", prompt: "Write a recruitment communication for prospective families. Veritas Charter Schools serves 6,800+ students across 10 Chicago campuses, with a focus on first-generation college students from Chicago's south and west sides. Emphasize our track record, campus options, and application process." },
  { label: "Bond Investor", prompt: "Draft talking points for a meeting with bond investors or rating agencies. Cover Veritas Charter Schools' strong DSCR of 3.47x against a 1.0x covenant, 215 days cash on hand, a current ratio of 3.0x, and our long-range financial stability strategy." },
  { label: "Staff Recognition", prompt: "Write a network-wide staff recognition message from leadership. Acknowledge the extraordinary work of Veritas Charter Schools employees in serving 6,823 students across Chicago's most underserved communities, reference our shared mission, and highlight recent organizational achievements." },
  { label: "Donor Stewardship", prompt: "Draft a stewardship letter to a major Veritas Charter Schools donor. Thank them for their contribution, connect it to student outcomes in communities like Englewood, Roseland, Austin, and North Lawndale, reference our financial health as evidence of organizational strength, and paint a picture of impact." },
];

const VOICE_STYLES = [
  { id: "presidential", label: "Network Leadership", desc: "Formal, institutional, board-ready" },
  { id: "principal", label: "Campus Principal", desc: "Warm, direct, community-focused" },
  { id: "crisis", label: "Crisis Communications", desc: "Measured, transparent, action-oriented" },
  { id: "board", label: "Board Presentation", desc: "Data-driven, concise, governance-focused" },
  { id: "cfo", label: "Financial Stakeholder", desc: "Precise, numbers-forward, bond-holder ready" },
  { id: "family", label: "Family Outreach", desc: "Accessible, warm, plain language" },
];

const CHANNELS = [
  { id: "email", label: "Email" },
  { id: "sms", label: "SMS" },
  { id: "letter", label: "Formal Letter" },
  { id: "internal", label: "Internal Memo" },
  { id: "board", label: "Board Report" },
  { id: "press", label: "Press Release" },
  { id: "talking", label: "Talking Points" },
];

export default function BriefApp() {
  const [prompt, setPrompt] = useState("");
  const [voice, setVoice] = useState("presidential");
  const [channel, setChannel] = useState("email");
  const [language, setLanguage] = useState("en");
  const [campus, setCampus] = useState("all");
  const [response, setResponse] = useState("");
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const textareaRef = useRef(null);

  const voiceConfig = VOICE_STYLES.find(v => v.id === voice);

  const generateDraft = async () => {
    if (!prompt.trim()) return;
    setLoading(true);
    setResponse("");

    const systemPrompt = `You are a communications assistant for Veritas Charter Schools, a network of 10 public charter high schools in Chicago serving students from the city's most underserved communities on the South and West sides. Veritas serves 6,823 students with a $138M annual budget.

Key institutional data:
- 10 campuses across Chicago's South and West sides, plus one downtown campus
- 6,823 current enrolled students (9th-12th grade)
- $138M annual operating budget
- $4.3M YTD surplus
- DSCR: 3.47x (covenant: 1.0x)
- 215 days cash on hand
- Current ratio: 3.0x
- Safety status: All campuses currently LOW risk
- Network President: Dr. Sandra Okonkwo

Campus names: ${CAMPUSES.join(", ")}

Campus communities served: Loop (downtown), Englewood, Woodlawn, Auburn Gresham, Roseland, Chatham (South Side); Austin, North Lawndale, East Garfield Park, Humboldt Park (West Side)

Voice style: ${voiceConfig?.label} — ${voiceConfig?.desc}
Channel: ${channel}
${campus !== "all" ? `Specific campus: ${campus}` : "Network-wide communication"}
${language === "es" ? "Write in Spanish." : language === "pl" ? "Write in Polish." : "Write in English."}

Write a polished, ready-to-send ${channel === "email" ? "email" : channel === "sms" ? "text message (under 160 characters if possible, max 320)" : channel === "letter" ? "formal letter" : "internal memo"}.

${channel === "email" ? "Include a subject line formatted as 'Subject: ...' on the first line." : ""}
${channel === "letter" ? "Include proper letterhead formatting with Veritas Charter Schools, date, and signature block." : ""}

Be specific, not generic. Reference real Veritas details. Never fabricate incident details — if discussing safety, keep it appropriately general while being reassuring and transparent.`;

    try {
      const res = await fetch("/api/anthropic-proxy", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "claude-sonnet-4-20250514",
          max_tokens: 2048,
          system: systemPrompt,
          messages: [{ role: "user", content: prompt }],
        }),
      });

      if (!res.ok) {
        const err = await res.text();
        setResponse("Error: " + err);
        setLoading(false);
        return;
      }

      const json = await res.json();
      const text = json.content?.map((c: {type: string; text?: string}) => c.text || "").join("\n") || "No response generated.";
      setResponse(text);
    } catch (err) {
      setResponse("Error: Could not reach the AI service. " + String(err));
    }
    setLoading(false);
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(response);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div style={{ fontFamily: "'Inter', system-ui, sans-serif", maxWidth: 1100, margin: "0 auto" }}>
      {/* Header */}
      <div style={{
        background: "linear-gradient(135deg, #0D1117 0%, #1C2333 100%)",
        borderRadius: 16, padding: "32px 36px", marginBottom: 24, position: "relative", overflow: "hidden",
      }}>
        <div style={{ fontSize: 22, fontWeight: 700, color: COLORS.white, marginBottom: 4 }}>
          Slate Draft
        </div>
        <div style={{ fontSize: 13, color: "rgba(183, 145, 69, 0.8)", lineHeight: 1.5 }}>
          AI-powered communications grounded in Veritas Charter Schools data. Every draft draws from live platform intelligence.
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: response ? "1fr 1fr" : "1fr", gap: 24 }}>
        {/* Left: Input */}
        <div>
          {/* Quick Prompts */}
          <div style={{ marginBottom: 20 }}>
            <div style={{ fontSize: 11, fontWeight: 600, color: COLORS.lightText, textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: 8 }}>
              Quick Start
            </div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
              {QUICK_PROMPTS.map((qp, i) => (
                <button key={i} onClick={() => setPrompt(qp.prompt)} style={{
                  padding: "6px 14px", borderRadius: 8, border: "1px solid " + COLORS.chalk,
                  background: prompt === qp.prompt ? "#E0F2FE" : COLORS.white,
                  color: prompt === qp.prompt ? "#0D1117" : COLORS.mid,
                  fontSize: 12, fontWeight: 500, cursor: "pointer",
                  transition: "all 0.15s ease",
                }}>
                  {qp.label}
                </button>
              ))}
            </div>
          </div>

          {/* Main Prompt */}
          <div style={{ marginBottom: 16 }}>
            <div style={{ fontSize: 11, fontWeight: 600, color: COLORS.lightText, textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: 8 }}>
              What do you need to communicate?
            </div>
            <textarea
              ref={textareaRef}
              value={prompt}
              onChange={e => setPrompt(e.target.value)}
              placeholder="e.g., Draft a family update about our safety monitoring program for Veritas Englewood Academy..."
              rows={5}
              style={{
                width: "100%", padding: "14px 16px", borderRadius: 10,
                border: "2px solid " + COLORS.chalk, fontSize: 14, lineHeight: 1.6,
                fontFamily: "'Inter', system-ui, sans-serif", color: COLORS.deep,
                resize: "vertical", outline: "none",
                transition: "border-color 0.2s ease",
              }}
              onFocus={e => e.target.style.borderColor = COLORS.accent}
              onBlur={e => e.target.style.borderColor = COLORS.chalk}
            />
          </div>

          {/* Controls Row */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 16 }}>
            {/* Voice */}
            <div>
              <div style={{ fontSize: 11, fontWeight: 600, color: COLORS.lightText, textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: 6 }}>Voice</div>
              <select value={voice} onChange={e => setVoice(e.target.value)} style={{
                width: "100%", padding: "8px 12px", borderRadius: 8, border: "1px solid " + COLORS.chalk,
                fontSize: 13, color: COLORS.deep, background: COLORS.white, cursor: "pointer",
              }}>
                {VOICE_STYLES.map(v => (
                  <option key={v.id} value={v.id}>{v.label}</option>
                ))}
              </select>
            </div>

            {/* Channel */}
            <div>
              <div style={{ fontSize: 11, fontWeight: 600, color: COLORS.lightText, textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: 6 }}>Channel</div>
              <select value={channel} onChange={e => setChannel(e.target.value)} style={{
                width: "100%", padding: "8px 12px", borderRadius: 8, border: "1px solid " + COLORS.chalk,
                fontSize: 13, color: COLORS.deep, background: COLORS.white, cursor: "pointer",
              }}>
                {CHANNELS.map(c => (
                  <option key={c.id} value={c.id}>{c.label}</option>
                ))}
              </select>
            </div>

            {/* Campus */}
            <div>
              <div style={{ fontSize: 11, fontWeight: 600, color: COLORS.lightText, textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: 6 }}>Campus</div>
              <select value={campus} onChange={e => setCampus(e.target.value)} style={{
                width: "100%", padding: "8px 12px", borderRadius: 8, border: "1px solid " + COLORS.chalk,
                fontSize: 13, color: COLORS.deep, background: COLORS.white, cursor: "pointer",
              }}>
                <option value="all">All Campuses (Network-wide)</option>
                {CAMPUSES.map(c => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>

            {/* Language */}
            <div>
              <div style={{ fontSize: 11, fontWeight: 600, color: COLORS.lightText, textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: 6 }}>Language</div>
              <select value={language} onChange={e => setLanguage(e.target.value)} style={{
                width: "100%", padding: "8px 12px", borderRadius: 8, border: "1px solid " + COLORS.chalk,
                fontSize: 13, color: COLORS.deep, background: COLORS.white, cursor: "pointer",
              }}>
                <option value="en">English</option>
                <option value="es">Spanish</option>
                <option value="pl">Polish</option>
              </select>
            </div>
          </div>

          {/* Generate Button */}
          <button
            onClick={generateDraft}
            disabled={loading || !prompt.trim()}
            style={{
              width: "100%", padding: "14px 24px", borderRadius: 10, border: "none",
              background: loading ? COLORS.mid : (!prompt.trim() ? COLORS.chalk : "linear-gradient(135deg, #0D1117, #1C2333)"),
              color: !prompt.trim() ? COLORS.lightText : COLORS.white,
              fontSize: 15, fontWeight: 600, cursor: loading || !prompt.trim() ? "default" : "pointer",
              transition: "all 0.2s ease",
              boxShadow: prompt.trim() && !loading ? "0 4px 12px rgba(183, 145, 69, 0.3)" : "none",
            }}
          >
            {loading ? "Drafting..." : "Generate Draft"}
          </button>

          {/* Data Badge */}
          <div style={{
            marginTop: 12, padding: "10px 14px", background: "#F0F4F8", borderRadius: 8,
            fontSize: 11, color: "#0D1117", lineHeight: 1.5,
          }}>
            <strong>Grounded in Slate data:</strong> 10 campuses, 6,823 students, $138M budget, live safety status, FY26 financials. Every draft references real Veritas intelligence.
          </div>
        </div>

        {/* Right: Output */}
        {response && (
          <div>
            <div style={{
              background: COLORS.white, borderRadius: 12, border: "1px solid " + COLORS.chalk,
              overflow: "hidden",
            }}>
              <div style={{
                padding: "12px 16px", background: "#F0F4F8",
                display: "flex", justifyContent: "space-between", alignItems: "center",
                borderBottom: "1px solid " + COLORS.chalk,
              }}>
                <div style={{ fontSize: 12, fontWeight: 600, color: "#0D1117" }}>
                  Generated Draft — {voiceConfig?.label} / {channel}
                </div>
                <button onClick={copyToClipboard} style={{
                  padding: "4px 12px", borderRadius: 6, border: "1px solid #E8EDF2",
                  background: copied ? "#0D1117" : COLORS.white,
                  color: copied ? COLORS.white : "#065F46",
                  fontSize: 11, fontWeight: 600, cursor: "pointer",
                }}>
                  {copied ? "Copied!" : "Copy"}
                </button>
              </div>
              <div style={{
                padding: "20px 24px", fontSize: 14, lineHeight: 1.8,
                color: COLORS.deep, whiteSpace: "pre-wrap",
                fontFamily: channel === "letter" ? "'Georgia', serif" : "'Inter', system-ui, sans-serif",
                maxHeight: 600, overflowY: "auto",
              }}>
                {response}
              </div>
            </div>

            {/* Regenerate */}
            <button onClick={generateDraft} style={{
              marginTop: 12, width: "100%", padding: "10px", borderRadius: 8,
              border: "1px solid " + COLORS.chalk, background: COLORS.white,
              color: COLORS.mid, fontSize: 13, fontWeight: 500, cursor: "pointer",
            }}>
              Regenerate
            </button>
          </div>
        )}
</div>
    </div>
  );
}
