// @ts-nocheck
import { useState, useRef, useCallback } from "react";

const C = {
  carbon: "#121315", navy: "#0D1B2A", brass: "#B79145", paper: "#F7F5F1",
  border: "#E5E7EB", gray: "#6B7280", green: "#0B7A5E", red: "#B91C1C",
  amber: "#B45309", white: "#FFFFFF", blue: "#1D4ED8",
};

const $M = (n) => `$${(n/1000).toFixed(1)}M`;
const $K = (n) => `$${n?.toLocaleString()}K`;
const fmtVar = (n) => n >= 0 ? `+${$K(n)}` : $K(n);
const varColor = (n) => n >= 0 ? C.green : C.red;

function MetricRow({ label, metric, bold = false }) {
  return (
    <div style={{ display:"grid", gridTemplateColumns:"2fr 1fr 1fr 1fr", padding:"8px 12px", background: bold ? C.paper : C.white, borderBottom:`1px solid ${C.border}` }}>
      <div style={{ fontSize:13, fontWeight: bold?700:400, color:C.navy }}>{label}</div>
      <div style={{ fontSize:13, textAlign:"right", fontFamily:"monospace", color:C.navy }}>{$K(metric.actual)}</div>
      <div style={{ fontSize:13, textAlign:"right", fontFamily:"monospace", color:C.gray }}>{$K(metric.budget)}</div>
      <div style={{ fontSize:13, textAlign:"right", fontFamily:"monospace", fontWeight:600, color:varColor(metric.variance) }}>{fmtVar(metric.variance)}</div>
    </div>
  );
}

function KpiCard({ label, value, sub, color = C.navy }) {
  return (
    <div style={{ background:C.paper, borderRadius:10, padding:"16px 18px", border:`1px solid ${C.border}`, flex:1 }}>
      <div style={{ fontSize:10, fontWeight:700, color:C.gray, letterSpacing:"0.1em", textTransform:"uppercase", marginBottom:6 }}>{label}</div>
      <div style={{ fontSize:28, fontWeight:900, color, fontFamily:"monospace", marginBottom:4 }}>{value}</div>
      <div style={{ fontSize:11, color:C.gray }}>{sub}</div>
    </div>
  );
}

function OutputButton({ label, sub, icon, loading, onClick }) {
  return (
    <button onClick={onClick} disabled={loading} style={{ flex:1, padding:"18px 16px", borderRadius:12, border:`1.5px solid ${loading ? C.border : C.brass}`, background: loading ? C.paper : C.white, cursor: loading ? "default" : "pointer", textAlign:"left" }}>
      <div style={{ fontSize:22, marginBottom:6 }}>{icon}</div>
      <div style={{ fontSize:14, fontWeight:700, color:C.navy, marginBottom:3 }}>{loading ? "Generating..." : label}</div>
      <div style={{ fontSize:11, color:C.gray }}>{sub}</div>
    </button>
  );
}

export default function ReportsApp() {
  const [stage, setStage] = useState("upload");
  const [dragOver, setDragOver] = useState(false);
  const [fileName, setFileName] = useState("");
  const [parseError, setParseError] = useState("");
  const [data, setData] = useState(null);
  const [generatingPptx, setGeneratingPptx] = useState(false);
  const [generatingDocx, setGeneratingDocx] = useState(false);
  const [generatingTalking, setGeneratingTalking] = useState(false);
  const [completed, setCompleted] = useState([]);
  const [parseLog, setParseLog] = useState([]);
  const fileRef = useRef(null);

  const processFile = useCallback(async (file) => {
    const isPdf = file.type.includes("pdf"); const isExcel = file.type.includes("spreadsheet") || file.type.includes("excel") || file.name.endsWith(".xlsx") || file.name.endsWith(".xls"); if (!isPdf && !isExcel) { setParseError("Please upload a PDF or Excel file."); return; }
    setFileName(file.name);
    setStage("parsing");
    setParseError("");
    setParseLog(["Reading PDF...", "Sending to Slate AI..."]);
    setParseLog(prev => [...prev, "Extracting financial data (this takes ~20 seconds)..."]);
    try {
      let body;
      if (isExcel) {
        // For Excel: extract text with SheetJS, send as plain text
        const XLSX = await import("https://cdn.sheetjs.com/xlsx-0.20.1/package/xlsx.mjs");
        const arrayBuffer = await file.arrayBuffer();
        const workbook = XLSX.read(arrayBuffer, { type: "array" });
        let text = "";
        workbook.SheetNames.forEach(name => {
          const sheet = workbook.Sheets[name];
          text += `\n\n=== Sheet: ${name} ===\n`;
          text += XLSX.utils.sheet_to_csv(sheet);
        });
        body = JSON.stringify({ textContent: text, fileType: file.type, fileName: file.name });
      } else {
        const base64 = await new Promise((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => resolve(reader.result.split(",")[1]);
          reader.onerror = reject;
          reader.readAsDataURL(file);
        });
        body = JSON.stringify({ pdfBase64: base64, fileType: file.type });
      }
      const res = await fetch("/api/parse-financial", { method:"POST", headers:{"Content-Type":"application/json"}, body });
      const json = await res.json();
      if (!json.success || !json.data) { setParseError(json.error + (json.detail ? ": " + JSON.stringify(json.detail).slice(0,200) : "") ?? "Failed to extract data."); setStage("upload"); return; }
      setParseLog(prev => [...prev, `✓ Extracted ${Object.keys(json.data).length} data points`, "Ready for review."]);
      setData(json.data);
      setTimeout(() => setStage("review"), 800);
    } catch(err) { setParseError(`Error: ${String(err)}`); setStage("upload"); }
  }, []);

  const handleDrop = useCallback((e) => { e.preventDefault(); setDragOver(false); const f = e.dataTransfer.files[0]; if(f) processFile(f); }, [processFile]);
  const handleInput = useCallback((e) => { const f = e.target.files?.[0]; if(f) processFile(f); }, [processFile]);

  const generatePptx = useCallback(async () => {
    if (!data) return;
    setGeneratingPptx(true);
    try {
      const res = await fetch("/api/generate-board-deck", { method:"POST", headers:{"Content-Type":"application/json"}, body: JSON.stringify({ data }) });
      const json = await res.json();
      if (json.success && json.base64) {
        const bytes = Uint8Array.from(atob(json.base64), c => c.charCodeAt(0));
        const blob = new Blob([bytes], { type:"application/vnd.openxmlformats-officedocument.presentationml.presentation" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a"); a.href = url; a.download = json.filename; a.click();
        URL.revokeObjectURL(url);
        setCompleted(prev => [...prev, "Board Deck"]);
      }
    } catch(err) { console.error(err); }
    finally { setGeneratingPptx(false); }
  }, [data]);

  const generateDocx = useCallback(async () => {
    if (!data) return;
    setGeneratingDocx(true);
    try {
      const res = await fetch("/api/anthropic-proxy", { method:"POST", headers:{"Content-Type":"application/json"}, body: JSON.stringify({
        model:"claude-sonnet-4-20250514", max_tokens:3000,
        system:"Write a professional CFO executive summary memo for a charter school board. Clear prose, no bullets, no markdown. Sections: Date/To/From/Re, then paragraphs on overall performance, revenue, expenses, balance sheet, outlook.",
        messages:[{ role:"user", content:`Write for ${data.networkName}, period ending ${data.reportingPeriod}. Revenue: actual $${data.operationalRevenues?.actual}K vs budget $${data.operationalRevenues?.budget}K. Expenses: actual $${data.operationalExpenses?.actual}K vs budget $${data.operationalExpenses?.budget}K. Net income: $${data.netIncome?.actual}K vs budget $${data.netIncome?.budget}K. DSCR: ${data.dscr}x. Days cash: ${data.daysOfCashOnHand}. ${data.overallAssessment}. Revenue: ${data.revenueNote}. Expenses: ${data.expenseNote}.` }],
      })});
      const json = await res.json();
      const text = json.content?.map(c => c.text||"").join("\n")||"";
      const blob = new Blob([text], { type:"text/plain" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a"); a.href = url; a.download = `${data.networkName?.replace(/\s+/g,"_")}_Executive_Summary.txt`; a.click();
      URL.revokeObjectURL(url);
      setCompleted(prev => [...prev, "Executive Summary"]);
    } catch(err) { console.error(err); }
    finally { setGeneratingDocx(false); }
  }, [data]);

  const generateTalking = useCallback(async () => {
    if (!data) return;
    setGeneratingTalking(true);
    try {
      const res = await fetch("/api/anthropic-proxy", { method:"POST", headers:{"Content-Type":"application/json"}, body: JSON.stringify({
        model:"claude-sonnet-4-20250514", max_tokens:2000,
        system:"Write CFO talking points for a board meeting. Punchy bullet points grouped by slide. Plain text only.",
        messages:[{ role:"user", content:`Talking points for ${data.networkName} ${data.reportingPeriod} board presentation. Revenue ${fmtVar(data.operationalRevenues?.variance)} vs budget. Expenses ${fmtVar(data.operationalExpenses?.variance)} vs budget. Net income ${fmtVar(data.netIncome?.variance)} vs budget. DSCR ${data.dscr}x. Days cash ${data.daysOfCashOnHand}. ${data.highlights?.join(". ")}. Sections: Opening, Revenue, Expenses, Balance Sheet, Covenants, Outlook.` }],
      })});
      const json = await res.json();
      const text = json.content?.map(c => c.text||"").join("\n")||"";
      await navigator.clipboard.writeText(text);
      setCompleted(prev => [...prev, "Talking Points"]);
      alert("Talking points copied to clipboard!");
    } catch(err) { console.error(err); }
    finally { setGeneratingTalking(false); }
  }, [data]);

  if (stage === "upload") return (
    <div style={{ fontFamily:"'Inter',system-ui,sans-serif", maxWidth:800, margin:"0 auto", paddingBottom:40 }}>
      <div style={{ background:`linear-gradient(135deg,${C.navy} 0%,#1C2B3A 100%)`, borderRadius:16, padding:"32px 36px", marginBottom:28 }}>
        <div style={{ fontSize:11, fontWeight:700, color:C.brass, letterSpacing:"0.12em", textTransform:"uppercase", marginBottom:8 }}>Slate Reports</div>
        <div style={{ fontSize:24, fontWeight:800, color:C.white, marginBottom:6 }}>Financial Close Generator</div>
        <div style={{ fontSize:13, color:"rgba(183,145,69,0.8)", lineHeight:1.6 }}>Upload your monthly financial close PDF. Slate extracts every figure and generates a board-ready presentation, executive summary, and CFO talking points in under 60 seconds.</div>
      </div>
      <div onDragOver={(e)=>{e.preventDefault();setDragOver(true);}} onDragLeave={()=>setDragOver(false)} onDrop={handleDrop} onClick={()=>fileRef.current?.click()} style={{ border:`2px dashed ${dragOver?C.brass:C.border}`, borderRadius:16, padding:"60px 40px", textAlign:"center", cursor:"pointer", background:dragOver?"#FEFCE8":C.paper, marginBottom:20 }}>
        <div style={{ fontSize:40, marginBottom:16 }}>📄</div>
        <div style={{ fontSize:18, fontWeight:700, color:C.navy, marginBottom:8 }}>Drop your financial close PDF here</div>
        <div style={{ fontSize:13, color:C.gray, marginBottom:20 }}>Monthly close PDF, Excel (.xlsx), or financial summary</div>
        <div style={{ display:"inline-block", padding:"10px 28px", borderRadius:8, background:C.navy, color:C.white, fontSize:13, fontWeight:600 }}>Browse Files</div>
        <input ref={fileRef} type="file" accept=".pdf,.xlsx,.xls" onChange={handleInput} style={{ display:"none" }} />
      </div>
      {parseError && <div style={{ padding:"12px 16px", background:"#FEF2F2", border:"1px solid #FCA5A5", borderRadius:8, color:C.red, fontSize:13, marginBottom:16 }}>{parseError}</div>}
      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:12 }}>
        {[{icon:"📊",label:"Board Presentation",desc:"7-slide PPTX · Finance & Audit Committee ready"},{icon:"📝",label:"Executive Summary",desc:"CFO narrative memo · paste into Google Docs"},{icon:"🎤",label:"Talking Points",desc:"CFO script · copied to clipboard"}].map(i=>(
          <div key={i.label} style={{ padding:16, background:C.white, border:`1px solid ${C.border}`, borderRadius:10 }}>
            <div style={{ fontSize:20, marginBottom:8 }}>{i.icon}</div>
            <div style={{ fontSize:13, fontWeight:700, color:C.navy, marginBottom:4 }}>{i.label}</div>
            <div style={{ fontSize:11, color:C.gray }}>{i.desc}</div>
          </div>
        ))}
      </div>
    </div>
  );

  if (stage === "parsing") return (
    <div style={{ fontFamily:"'Inter',system-ui,sans-serif", maxWidth:800, margin:"0 auto", padding:"80px 0", textAlign:"center" }}>
      <div style={{ fontSize:40, marginBottom:24 }}>⚙️</div>
      <div style={{ fontSize:20, fontWeight:700, color:C.navy, marginBottom:8 }}>Reading {fileName}</div>
      <div style={{ fontSize:13, color:C.gray, marginBottom:32 }}>Claude is extracting every financial figure</div>
      <div style={{ textAlign:"left", maxWidth:400, margin:"0 auto" }}>
        {parseLog.map((log,i)=>(
          <div key={i} style={{ fontSize:13, color:i===parseLog.length-1?C.brass:C.gray, padding:"6px 0", display:"flex", gap:10 }}>
            <span>{i===parseLog.length-1?"→":"✓"}</span>{log}
          </div>
        ))}
      </div>
    </div>
  );

  if (stage === "review" && data) return (
    <div style={{ fontFamily:"'Inter',system-ui,sans-serif", maxWidth:900, margin:"0 auto", paddingBottom:40 }}>
      <div style={{ background:`linear-gradient(135deg,${C.navy} 0%,#1C2B3A 100%)`, borderRadius:16, padding:"24px 28px", marginBottom:24, display:"flex", justifyContent:"space-between", alignItems:"center" }}>
        <div>
          <div style={{ fontSize:11, color:C.brass, fontWeight:700, letterSpacing:"0.1em", textTransform:"uppercase", marginBottom:4 }}>Data Extracted — Ready to Generate</div>
          <div style={{ fontSize:20, fontWeight:800, color:C.white }}>{data.networkName} · {data.reportingPeriod}</div>
        </div>
        <button onClick={()=>{setStage("upload");setData(null);setCompleted([]);}} style={{ padding:"8px 16px", borderRadius:8, border:"1px solid rgba(255,255,255,0.2)", background:"transparent", color:C.white, cursor:"pointer", fontSize:12 }}>Upload New File</button>
      </div>
      <div style={{ display:"flex", gap:12, marginBottom:20 }}>
        <KpiCard label="Operational Surplus" value={$M(data.revenueMinusExpenses?.actual)} sub={`${fmtVar(data.revenueMinusExpenses?.variance)} vs budget`} color={varColor(data.revenueMinusExpenses?.variance)} />
        <KpiCard label="Net Income" value={$M(data.netIncome?.actual)} sub={`${fmtVar(data.netIncome?.variance)} vs budget`} color={varColor(data.netIncome?.variance)} />
        <KpiCard label="DSCR" value={`${data.dscr?.toFixed(2)}x`} sub={`${data.dscrCovenant}x covenant`} color={data.dscr>=data.dscrCovenant?C.green:C.red} />
        <KpiCard label="Days Cash" value={String(Math.round(data.daysOfCashOnHand))} sub="120-day minimum" color={data.daysOfCashOnHand>=120?C.green:C.red} />
      </div>
      <div style={{ background:C.white, border:`1px solid ${C.border}`, borderRadius:12, overflow:"hidden", marginBottom:20 }}>
        <div style={{ padding:"12px 16px", background:C.paper, borderBottom:`1px solid ${C.border}` }}>
          <div style={{ fontSize:11, fontWeight:700, color:C.gray, letterSpacing:"0.1em", textTransform:"uppercase" }}>Profit & Loss — YTD ($000s)</div>
        </div>
        <div style={{ display:"grid", gridTemplateColumns:"2fr 1fr 1fr 1fr", padding:"8px 12px", background:C.navy }}>
          {["","Actual","Budget","Variance"].map(h=><div key={h} style={{ fontSize:10, fontWeight:700, color:C.white, textAlign:h===""?"left":"right", letterSpacing:"0.06em" }}>{h}</div>)}
        </div>
        <MetricRow label="Operational Revenues" metric={data.operationalRevenues} bold />
        <MetricRow label="Operational Expenses" metric={data.operationalExpenses} bold />
        <MetricRow label="  Personnel" metric={data.personnel} />
        <MetricRow label="  Non-Personnel" metric={data.nonPersonnel} />
        <MetricRow label="Revenue Minus Expenses" metric={data.revenueMinusExpenses} bold />
        <MetricRow label="Net Income / (Deficit)" metric={data.netIncome} bold />
      </div>
      <div style={{ padding:"16px 20px", background:"#F0F9FF", border:"1px solid #BAE6FD", borderRadius:12, marginBottom:20 }}>
        <div style={{ fontSize:10, fontWeight:700, color:"#0369A1", letterSpacing:"0.1em", textTransform:"uppercase", marginBottom:6 }}>AI Assessment</div>
        <div style={{ fontSize:13, color:C.navy, lineHeight:1.6, fontStyle:"italic" }}>{data.overallAssessment}</div>
      </div>
      <div style={{ marginBottom:16 }}>
        <div style={{ fontSize:11, fontWeight:700, color:C.gray, letterSpacing:"0.1em", textTransform:"uppercase", marginBottom:12 }}>Generate Outputs</div>
        <div style={{ display:"flex", gap:12 }}>
          <OutputButton icon="📊" label="Download Board Deck" sub="7-slide PPTX · Finance & Audit Committee ready" loading={generatingPptx} onClick={generatePptx} />
          <OutputButton icon="📝" label="Download Executive Summary" sub="CFO narrative memo · paste into Google Docs" loading={generatingDocx} onClick={generateDocx} />
          <OutputButton icon="🎤" label="Copy Talking Points" sub="CFO script for each slide · to clipboard" loading={generatingTalking} onClick={generateTalking} />
        </div>
      </div>
      {completed.length > 0 && (
        <div style={{ padding:"12px 16px", background:"#ECFDF5", border:"1px solid #6EE7B7", borderRadius:8, fontSize:13, color:C.green }}>
          ✓ Generated: {completed.join(", ")}
        </div>
      )}
    </div>
  );

  return null;
}
