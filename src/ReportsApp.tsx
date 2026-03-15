// @ts-nocheck
import { useState, useRef, useCallback } from "react";
import PptxGenJS from "pptxgenjs";

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
        // Only send first 4 sheets (summary/consolidated) — detail tabs explode token count
        const sheetsToProcess = workbook.SheetNames.slice(0, 4);
        sheetsToProcess.forEach(name => {
          const sheet = workbook.Sheets[name];
          const csv = XLSX.utils.sheet_to_csv(sheet);
          // Truncate to first 100 rows to stay within token limits
          const rows = csv.split("\n").slice(0, 100).join("\n");
          text += `\n\n=== Sheet: ${name} ===\n${rows}`;
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
      const NAVY="0D1B2A",GOLD="B79145",WHITE="FFFFFF",LIGHT="F7F5F1",GRAY="6B7280",GREEN="0B7A5E",RED="B91C1C",AMBER="B45309";
      const $M = n => `$${(n/1000).toFixed(1)}M`;
      const $K = n => `$${n?.toLocaleString()}K`;
      const fmtVar = n => n >= 0 ? `+${$K(n)}` : $K(n);
      const varColor = n => n >= 0 ? GREEN : RED;

      const pptx = new PptxGenJS();
      pptx.layout = "LAYOUT_WIDE";

      const addLabel = (s, t) => s.addText(t, {x:0.4,y:0.18,w:6,h:0.25,fontSize:9,bold:true,color:GOLD,charSpacing:3});
      const addTitle = (s, t, sub) => {
        s.addText(t, {x:0.4,y:0.45,w:12,h:0.6,fontSize:28,bold:true,color:NAVY,align:"left"});
        if(sub) s.addText(sub, {x:0.4,y:1.0,w:12,h:0.3,fontSize:13,color:GRAY,align:"left"});
      };
      const addKpi = (s,x,y,w,h,label,value,sub,vc=NAVY) => {
        s.addShape(pptx.ShapeType.roundRect,{x,y,w,h,rectRadius:0.08,fill:{color:LIGHT},line:{color:"E5E7EB",width:0.5}});
        s.addText(label,{x:x+0.15,y:y+0.12,w:w-0.3,h:0.25,fontSize:8,bold:true,color:GRAY,charSpacing:2});
        s.addText(value,{x:x+0.15,y:y+0.35,w:w-0.3,h:0.55,fontSize:24,bold:true,color:vc,fontFace:"Calibri"});
        s.addText(sub,{x:x+0.15,y:y+0.88,w:w-0.3,h:0.2,fontSize:9,color:GRAY});
      };

      // Slide 1 — Title
      const s1=pptx.addSlide();
      s1.addShape(pptx.ShapeType.rect,{x:0,y:0,w:"100%",h:"100%",fill:{color:NAVY}});
      s1.addShape(pptx.ShapeType.rect,{x:0,y:5.2,w:"100%",h:0.8,fill:{color:GOLD}});
      s1.addText(data.networkName??"Charter Schools",{x:0.6,y:1.0,w:11,h:0.6,fontSize:16,color:GOLD,bold:true,charSpacing:4,align:"left"});
      s1.addText("Finance & Audit\nCommittee Report",{x:0.6,y:1.7,w:11,h:2.0,fontSize:48,bold:true,color:WHITE,fontFace:"Calibri",align:"left",lineSpacingMultiple:1.1});
      s1.addText(data.reportingPeriod,{x:0.6,y:3.8,w:6,h:0.4,fontSize:18,color:"CADCFC",align:"left"});
      s1.addText(`${data.fiscalYear} · ${data.monthsElapsed} Months Elapsed`,{x:0.6,y:4.25,w:6,h:0.3,fontSize:13,color:GRAY,align:"left"});
      s1.addText("CONFIDENTIAL — BOARD USE ONLY",{x:0.6,y:5.35,w:8,h:0.3,fontSize:10,bold:true,color:NAVY,charSpacing:2});

      // Slide 2 — Executive Summary
      const s2=pptx.addSlide();
      s2.addShape(pptx.ShapeType.rect,{x:0,y:0,w:"100%",h:1.35,fill:{color:NAVY}});
      addLabel(s2,"EXECUTIVE SUMMARY");
      addTitle(s2,"At a Glance");
      s2.addText(data.overallAssessment,{x:0.4,y:0.85,w:12,h:0.4,fontSize:12,color:LIGHT,align:"left",italic:true});
      addKpi(s2,0.4,1.5,2.9,1.3,"OPERATIONAL SURPLUS",$M(data.revenueMinusExpenses?.actual),`${fmtVar(data.revenueMinusExpenses?.variance)} vs budget`,varColor(data.revenueMinusExpenses?.variance));
      addKpi(s2,3.52,1.5,2.9,1.3,"NET INCOME",$M(data.netIncome?.actual),`${fmtVar(data.netIncome?.variance)} vs budget`,varColor(data.netIncome?.variance));
      addKpi(s2,6.64,1.5,2.9,1.3,"DAYS CASH ON HAND",String(Math.round(data.daysOfCashOnHand||0)),"120 day covenant",data.daysOfCashOnHand>=120?GREEN:RED);
      addKpi(s2,9.76,1.5,2.85,1.3,"DSCR",data.dscr?`${Number(data.dscr).toFixed(2)}x`:"N/A",`${data.dscrCovenant}x covenant`,data.dscr>=data.dscrCovenant?GREEN:RED);
      s2.addText("KEY HIGHLIGHTS",{x:0.4,y:3.0,w:12,h:0.25,fontSize:8,bold:true,color:GOLD,charSpacing:3});
      (data.highlights??[]).slice(0,5).forEach((h,i)=>s2.addText(`• ${h}`,{x:0.4,y:3.3+i*0.38,w:12,h:0.32,fontSize:11,color:NAVY}));

      // Slide 3 — P&L
      const s3=pptx.addSlide();
      s3.addShape(pptx.ShapeType.rect,{x:0,y:0,w:"100%",h:1.35,fill:{color:NAVY}});
      addLabel(s3,"FINANCIAL PERFORMANCE");
      addTitle(s3,"Profit & Loss — YTD",`For the ${data.monthsElapsed} months ended ${data.reportingPeriod} ($000s)`);
      const mkRow=(label,m,bold=false,hdr=false)=>{
        const bg=hdr?NAVY:WHITE,col=hdr?WHITE:NAVY;
        return[
          {text:label,options:{bold:bold||hdr,color:col,fill:{color:bg},align:"left",fontSize:10,margin:[4,8,4,8]}},
          {text:hdr?"Actual":$K(m?.actual),options:{bold:bold||hdr,color:col,fill:{color:bg},align:"right",fontSize:10,margin:[4,8,4,8]}},
          {text:hdr?"Budget":$K(m?.budget),options:{bold:bold||hdr,color:col,fill:{color:bg},align:"right",fontSize:10,margin:[4,8,4,8]}},
          {text:hdr?"Variance":fmtVar(m?.variance),options:{bold:bold||hdr,color:hdr?WHITE:varColor(m?.variance),fill:{color:bg},align:"right",fontSize:10,margin:[4,8,4,8]}},
        ];
      };
      s3.addTable([
        mkRow("",null,false,true),
        mkRow("Operational Revenues",data.operationalRevenues,true),
        mkRow("Operational Expenses",data.operationalExpenses,true),
        mkRow("  Personnel",data.personnel),
        mkRow("  Non-Personnel",data.nonPersonnel),
        mkRow("Revenue Minus Expenses",data.revenueMinusExpenses,true),
        mkRow("Net Income / (Deficit)",data.netIncome,true),
      ],{x:0.4,y:1.5,w:7.5,colW:[3.8,1.2,1.2,1.2],fontSize:10,border:{type:"solid",color:"E5E7EB",pt:0.5},rowH:0.42});
      s3.addShape(pptx.ShapeType.roundRect,{x:8.1,y:1.5,w:4.5,h:2.0,rectRadius:0.08,fill:{color:"EFF6FF"},line:{color:"BFDBFE",width:0.5}});
      s3.addText("Revenue",{x:8.3,y:1.65,w:4.1,h:0.25,fontSize:9,bold:true,color:"1D4ED8",charSpacing:2});
      s3.addText(data.revenueNote,{x:8.3,y:1.95,w:4.1,h:1.1,fontSize:10,color:NAVY,wrap:true});
      s3.addShape(pptx.ShapeType.roundRect,{x:8.1,y:3.65,w:4.5,h:2.0,rectRadius:0.08,fill:{color:"FFFBEB"},line:{color:"FDE68A",width:0.5}});
      s3.addText("Expenses",{x:8.3,y:3.8,w:4.1,h:0.25,fontSize:9,bold:true,color:AMBER,charSpacing:2});
      s3.addText(data.expenseNote,{x:8.3,y:4.1,w:4.1,h:1.2,fontSize:10,color:NAVY,wrap:true});

      // Slide 4 — Balance Sheet
      const s4=pptx.addSlide();
      s4.addShape(pptx.ShapeType.rect,{x:0,y:0,w:"100%",h:1.35,fill:{color:NAVY}});
      addLabel(s4,"BALANCE SHEET");
      addTitle(s4,"Financial Position",`As of ${data.reportingPeriod} ($000s)`);
      addKpi(s4,0.4,1.5,3.8,1.3,"TOTAL ASSETS",$M(data.totalAssets),"Current + long-term");
      addKpi(s4,4.4,1.5,3.8,1.3,"TOTAL LIABILITIES",$M(data.totalLiabilities),"Current + long-term");
      addKpi(s4,8.4,1.5,4.2,1.3,"NET ASSETS",$M(data.netAssets),"Assets minus liabilities",data.netAssets>0?GREEN:RED);
      addKpi(s4,0.4,3.0,3.8,1.3,"CASH & INVESTMENTS",$M(data.cashAndInvestments),"Unrestricted + restricted");
      addKpi(s4,4.4,3.0,3.8,1.3,"DAYS CASH ON HAND",`${Math.round(data.daysOfCashOnHand||0)} days`,"120-day minimum",data.daysOfCashOnHand>=120?GREEN:RED);
      addKpi(s4,8.4,3.0,4.2,1.3,"CURRENT RATIO",`${data.currentRatio?.toFixed(2)}x`,`${data.currentRatioCovenant}x minimum`,data.currentRatio>=data.currentRatioCovenant?GREEN:RED);

      // Slide 5 — Covenants
      const s5=pptx.addSlide();
      s5.addShape(pptx.ShapeType.rect,{x:0,y:0,w:"100%",h:1.35,fill:{color:NAVY}});
      addLabel(s5,"COVENANT COMPLIANCE");
      addTitle(s5,"Bond Covenant Status",`As of ${data.reportingPeriod}`);
      const dp=data.dscr>=data.dscrCovenant;
      s5.addShape(pptx.ShapeType.roundRect,{x:0.4,y:1.5,w:5.5,h:2.2,rectRadius:0.1,fill:{color:dp?"ECFDF5":"FEF2F2"},line:{color:dp?"6EE7B7":"FCA5A5",width:1}});
      s5.addText("DEBT SERVICE COVERAGE RATIO",{x:0.65,y:1.7,w:5,h:0.25,fontSize:8,bold:true,color:dp?GREEN:RED,charSpacing:2});
      s5.addText(data.dscr?`${Number(data.dscr).toFixed(2)}x`:"N/A",{x:0.65,y:1.95,w:5,h:0.8,fontSize:48,bold:true,color:dp?GREEN:RED,fontFace:"Calibri"});
      s5.addText(`Required: ${data.dscrCovenant}x · ${dp?"✓ PASS":"✗ FAIL"}`,{x:0.65,y:2.85,w:5,h:0.3,fontSize:11,color:dp?GREEN:RED,bold:true});
      const cp=data.currentRatio>=data.currentRatioCovenant;
      s5.addShape(pptx.ShapeType.roundRect,{x:6.2,y:1.5,w:5.5,h:2.2,rectRadius:0.1,fill:{color:cp?"ECFDF5":"FEF2F2"},line:{color:cp?"6EE7B7":"FCA5A5",width:1}});
      s5.addText("CURRENT RATIO",{x:6.45,y:1.7,w:5,h:0.25,fontSize:8,bold:true,color:cp?GREEN:RED,charSpacing:2});
      s5.addText(`${data.currentRatio?.toFixed(2)}x`,{x:6.45,y:1.95,w:5,h:0.8,fontSize:48,bold:true,color:cp?GREEN:RED,fontFace:"Calibri"});
      s5.addText(`Required: ${data.currentRatioCovenant}x · ${cp?"✓ PASS":"✗ FAIL"}`,{x:6.45,y:2.85,w:5,h:0.3,fontSize:11,color:cp?GREEN:RED,bold:true});

      // Slide 6 — CFO Narrative
      const s6=pptx.addSlide();
      s6.addShape(pptx.ShapeType.rect,{x:0,y:0,w:"100%",h:1.35,fill:{color:NAVY}});
      addLabel(s6,"CFO NARRATIVE");
      addTitle(s6,"Financial Assessment",`Period ending ${data.reportingPeriod}`);
      s6.addShape(pptx.ShapeType.roundRect,{x:0.4,y:1.5,w:12.2,h:1.0,rectRadius:0.08,fill:{color:"F0F9FF"},line:{color:"BAE6FD",width:0.5}});
      s6.addText(data.overallAssessment,{x:0.65,y:1.65,w:11.7,h:0.72,fontSize:13,color:NAVY,italic:true});
      s6.addShape(pptx.ShapeType.roundRect,{x:0.4,y:2.7,w:5.9,h:2.8,rectRadius:0.08,fill:{color:LIGHT},line:{color:"E5E7EB",width:0.5}});
      s6.addText("REVENUE",{x:0.65,y:2.88,w:5.4,h:0.22,fontSize:8,bold:true,color:GOLD,charSpacing:2});
      s6.addText(data.revenueNote,{x:0.65,y:3.18,w:5.4,h:2.15,fontSize:11,color:NAVY,wrap:true});
      s6.addShape(pptx.ShapeType.roundRect,{x:6.7,y:2.7,w:5.9,h:2.8,rectRadius:0.08,fill:{color:LIGHT},line:{color:"E5E7EB",width:0.5}});
      s6.addText("EXPENSES",{x:6.95,y:2.88,w:5.4,h:0.22,fontSize:8,bold:true,color:GOLD,charSpacing:2});
      s6.addText(data.expenseNote,{x:6.95,y:3.18,w:5.4,h:2.15,fontSize:11,color:NAVY,wrap:true});

      // Slide 7 — Close
      const s7=pptx.addSlide();
      s7.addShape(pptx.ShapeType.rect,{x:0,y:0,w:"100%",h:"100%",fill:{color:NAVY}});
      s7.addShape(pptx.ShapeType.rect,{x:0,y:4.8,w:"100%",h:0.6,fill:{color:GOLD}});
      s7.addText("QUESTIONS & DISCUSSION",{x:0.6,y:1.8,w:11,h:0.5,fontSize:13,color:GOLD,bold:true,charSpacing:5,align:"center"});
      s7.addText(data.networkName,{x:0.6,y:2.4,w:11,h:1.0,fontSize:40,bold:true,color:WHITE,fontFace:"Calibri",align:"center"});
      s7.addText(`Finance & Audit Committee · ${data.reportingPeriod}`,{x:0.6,y:3.5,w:11,h:0.4,fontSize:14,color:"CADCFC",align:"center"});
      s7.addText("Generated by Slate Intelligence Platform",{x:0.6,y:4.88,w:11,h:0.3,fontSize:10,color:NAVY,bold:true,align:"center"});

      // Download
      const filename = `${(data.networkName??"Report").replace(/\s+/g,"_")}_Board_Deck_${(data.reportingPeriod??"").replace(/\s+/g,"_")}.pptx`;
      await pptx.writeFile({ fileName: filename });
      setCompleted(prev => [...prev, "Board Deck"]);
    } catch(err) { console.error(err); alert("Deck error: " + String(err)); }
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
        <KpiCard label="DSCR" value={data.dscr ? `${Number(data.dscr).toFixed(2)}x` : "N/A"} sub={`${data.dscrCovenant}x covenant`} color={data.dscr>=data.dscrCovenant?C.green:C.red} />
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
