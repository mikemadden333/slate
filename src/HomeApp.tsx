// @ts-nocheck
import { useState, useEffect, useCallback } from "react";
import LocalNewsBlock from "./LocalNewsBlock";

const C = {
  carbon:"#0D1B2A",brass:"#B79145",brassLight:"#D4AF6A",brassGlow:"rgba(183,145,69,0.12)",
  warm:"#F5F0EB",warmDark:"#EDE5DA",midGray:"#6B7280",border:"#E5DDD5",white:"#FFFFFF",
  green:"#16A34A",amber:"#D97706",red:"#DC2626",blue:"#1D4ED8",
};

const MODULES = [
  { id:"sentinel",label:"Watch",icon:"🔍",color:"#D45B4F",domain:"Safety" },
  { id:"ledger",label:"Ledger",icon:"📊",color:"#C79D39",domain:"Finance" },
  { id:"roster",label:"Roster",icon:"👥",color:"#4F78D6",domain:"Enrollment" },
  { id:"brief",label:"Draft",icon:"✉️",color:"#4EA27A",domain:"Communications" },
  { id:"shield",label:"Guard",icon:"🛡️",color:"#7B63E1",domain:"Risk & Compliance" },
  { id:"grounds",label:"Grounds",icon:"🏫",color:"#C66C3D",domain:"Operations" },
  { id:"capitol",label:"Civic",icon:"🏛️",color:"#1D4ED8",domain:"Gov. Affairs" },
  { id:"raise",label:"Raise",icon:"🤝",color:"#B79145",domain:"Philanthropy" },
];

// ─── Admin bridge ──────────────────────────────────────────────────────────
function slateRead(key) {
  try { const r = localStorage.getItem(key); return r ? JSON.parse(r) : null; } catch { return null; }
}

const buildNetworkSnapshot = () => {
  const adminEnroll  = slateRead('slate_enrollment');
  const adminFin     = slateRead('slate_financials');
  const adminStaff   = slateRead('slate_staff');
  const adminRisks   = slateRead('slate_risks');
  const adminNetwork = slateRead('slate_network');

  const networkName  = adminNetwork?.name           ?? 'Veritas Charter Schools';
  const campusCount  = adminNetwork?.campusCount    ?? 10;
  const studentCount = adminEnroll?.networkTotal    ?? adminNetwork?.studentCount ?? 6823;
  const targetEnroll = adminEnroll?.targetEnrollment ?? 6823;
  const currentEnroll= adminEnroll?.networkTotal    ?? 6823;
  const enrollGap    = currentEnroll - targetEnroll;
  const rpp          = adminNetwork?.revenuePerPupil ?? 16345;
  const revenueAtRisk= Math.abs(enrollGap) * rpp;

  const ytdExpActual = adminFin?.ytdExpActual  ?? 75500000;
  const ytdExpBudget = adminFin?.ytdExpBudget  ?? 74200000;
  const ytdSurplus   = adminFin?.ytdSurplus    ?? 5300000;
  const dscr         = adminFin?.dscr          ?? 3.47;
  const daysCash     = adminFin?.daysCashOnHand ?? 62;
  const budgetVar    = ytdExpBudget > 0
    ? parseFloat(((ytdExpActual - ytdExpBudget) / ytdExpBudget * 100).toFixed(1))
    : -3.8;
  const budgetVarDir = budgetVar <= 0 ? 'under' : 'over';

  const riskCampuses     = adminRisks?.campuses ?? [];
  const elevatedCampuses = riskCampuses.filter(c => c.alertLevel === 'high').map(c => c.name);
  const atRiskCount      = elevatedCampuses.length;
  const retalCampus      = elevatedCampuses[0] ?? 'Garfield Park';

  return {
    generatedAt: new Date().toISOString(),
    network: networkName, campusCount, studentCount,
    watch: {
      networksAtRisk: atRiskCount,
      criticalCampuses: [],
      elevatedCampuses: elevatedCampuses.length > 0 ? elevatedCampuses : ["Garfield Park","Englewood"],
      clearCampuses: campusCount - atRiskCount,
      activeRetaliationWindows: 1,
      retaliationCampus: retalCampus,
      retaliationPhase: "WATCH",
      retaliationHoursRemaining: 52,
      lastIncident: `Weapons arrest 0.4mi from ${retalCampus} at 11:42pm`,
      overallStatus: atRiskCount >= 2 ? "ELEVATED" : atRiskCount >= 1 ? "WATCH" : "CLEAR",
    },
    ledger: {
      budgetVariance: Math.abs(budgetVar),
      budgetVarianceDirection: budgetVarDir,
      cashDaysOnHand: daysCash,
      covenantStatus: dscr >= 1.0 ? "COMPLIANT" : "BREACH",
      dscrProjected: dscr,
      personnelOverBudget: false,
      topVarianceItem: "Substitute costs tracking 12% above trend",
      ytdExpenses: ytdExpActual,
      ytdBudget: ytdExpBudget,
      quarterlyStatus: ytdSurplus >= 0 ? "On Track" : "Watch",
    },
    roster: {
      enrollmentVsProjection: enrollGap,
      enrollmentProjection: targetEnroll,
      currentEnrollment: currentEnroll,
      revenueAtRisk,
      atRiskCampuses: ["North Lawndale","Roseland"],
      yieldTracking: "8% below last year in 9th grade",
      attritionFlags: 3,
      octCountDaysOut: 22,
    },
    guard: {
      deadlinesNext30Days: 3, overdueItems: 0,
      urgentDeadlines: [
        { item:"Annual Title I Compliance Report",          daysOut:7,  owner:"COO"       },
        { item:"Authorizer Financial Benchmark Submission", daysOut:14, owner:"CFO"       },
        { item:"Board Governance Self-Assessment",          daysOut:28, owner:"President" },
      ],
      auditReadiness: 78, openPolicies: 4,
    },
    grounds: {
      openWorkOrders:9, urgentWorkOrders:2,
      urgentItems:["HVAC failure - Austin 3rd floor","Water main leak - Loop campus"],
      capitalProjectsActive:3, capitalProjectsOnBudget:2, vendorContractsExpiring:1,
    },
    civic: {
      billsInCommittee:2,
      pendingBills:[
        {name:"HB 4821",summary:"Charter authorization renewal process changes",risk:"WATCH"},
        {name:"SB 2907",summary:"Per-pupil funding equity adjustment",risk:"POSITIVE"},
      ],
      upcomingHearings:1, hearingDate:"March 18",
      hearingTopic:"Charter Funding Equity Subcommittee",
      staleStakeholderRelationships:3,
      mediaMonitoring:"No active coverage. One pending Chalkbeat inquiry.",
    },
    raise: {
      pipelineWeighted:4200000, pipelineGoal:10000000, pipelineGoalPct:42,
      closedYTD:1850000, proposalsSubmitted:4, proposalsDueSoon:2,
      dueSoonItems:[
        {funder:"MacArthur Foundation",amount:250000,daysOut:6},
        {funder:"ISBE Innovation Grant",amount:175000,daysOut:11},
      ],
      overdueReports:0, grantScanLastRun:"Today", newOpportunitiesFound:3,
    },
  };
};

const generateBriefing = async (snapshot, userName="Mike") => {
  const hour = new Date().getHours();
  const timeOfDay = hour < 12 ? "morning" : hour < 17 ? "afternoon" : "evening";
  const dayOfWeek = new Date().toLocaleDateString("en-US",{weekday:"long"});
  const today = new Date().toLocaleDateString("en-US",{month:"long",day:"numeric",year:"numeric"});

  // Fetch national charter context via web search
  let nationalContext = "";
  try {
    const searches = await Promise.allSettled([
      fetch("/api/anthropic-proxy", {method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({
        model:"claude-sonnet-4-20250514",max_tokens:300,
        messages:[{role:"user",content:"In 3 sentences, what are the most important things happening RIGHT NOW in 2026 regarding: (1) federal charter school funding and policy, (2) Illinois charter school legislation, (3) Chicago enrollment trends. Be specific and current."}]
      })}).then(r=>r.json()).then(d=>d.content?.find((b)=>b.type==="text")?.text||"")
    ]);
    nationalContext = searches[0].status === "fulfilled" ? searches[0].value : "";
  } catch(e) { nationalContext = ""; }

  const systemPrompt = `You are Slate Intelligence — the AI brain of a decision support system for charter school networks. You are not a dashboard. You are not a summary tool. You are a genius-level strategic advisor who thinks and researches 24 hours a day, synthesizing everything happening inside and outside this organization.

Your voice: Direct. Precise. Warm but serious. No corporate language. No filler. No hedging. Every sentence earns its place or it does not appear.

You see things no human could see — patterns across safety, finance, enrollment, compliance, operations, philanthropy, and the external environment simultaneously. You do the critical thinking so the leader does not have to. When they open Slate, they feel powerful, informed, and ready to move.

You are generating a CEO Intelligence Brief for ${userName} at Veritas Charter Schools — 10 public charter high schools, 6,823 students, Chicago South Side, West Side, and downtown Loop.

Today is ${today}, ${dayOfWeek} ${timeOfDay}.

Return ONLY valid JSON — no preamble, no markdown:
{
  "headline": "One sentence max 18 words — the single most important thing right now",
  "executiveSummary": "3-4 sentences. True state of affairs. Specific numbers. No softening.",
  "crossModuleSignals": [
    { "signal": "Pattern connecting 2+ modules", "modules": ["module1","module2"], "significance": "Why this matters", "urgency": "HIGH|MEDIUM|LOW" },
    { "signal": "Pattern", "modules": ["module1","module2"], "significance": "Why this matters", "urgency": "HIGH|MEDIUM|LOW" },
    { "signal": "Pattern", "modules": ["module1","module2"], "significance": "Why this matters", "urgency": "HIGH|MEDIUM|LOW" }
  ],
  "topPriorities": [
    { "priority": 1, "module": "module name", "action": "Specific action", "urgency": "HIGH|MEDIUM|LOW" },
    { "priority": 2, "module": "module name", "action": "Specific action", "urgency": "HIGH|MEDIUM|LOW" },
    { "priority": 3, "module": "module name", "action": "Specific action", "urgency": "HIGH|MEDIUM|LOW" }
  ],
  "moduleInsights": {
    "watch": "Safety picture — specific",
    "ledger": "Financial health — specific",
    "roster": "Enrollment — specific",
    "guard": "Compliance — specific",
    "grounds": "Operations — specific",
    "civic": "Legislative — specific",
    "raise": "Philanthropy — specific"
  },
  "nationalContext": "2-3 sentences on national and Illinois charter landscape relevant to Veritas today",
  "questionsToSitWith": [
    "First profound strategic question the CEO should think about today",
    "Second profound strategic question",
    "Third profound strategic question"
  ],
  "watchItem": "One thing not yet urgent but Slate is watching and why",
  "closing": "One grounding sentence specific to today"
}`;

  const userPrompt = `Generate a ${timeOfDay} CEO Intelligence Brief for ${dayOfWeek}, ${today}.

LIVE NETWORK SNAPSHOT:
${JSON.stringify(snapshot,null,2)}

NATIONAL & ILLINOIS CHARTER CONTEXT:
${nationalContext || "Use your training knowledge of the 2026 national charter landscape."}

See what others miss. Connect the dots. Ask the questions that matter.`;

  const response = await fetch("/api/anthropic-proxy",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({model:"claude-sonnet-4-20250514",max_tokens:2000,system:systemPrompt,messages:[{role:"user",content:userPrompt}]})});
  const data = await response.json();
  const text = data.content?.find((b:any)=>b.type==="text")?.text||"";
  try { return JSON.parse(text.replace(/```json|```/g,"").trim()); } catch { return null; }
};

const Spinner = () => (
  <div style={{display:"flex",flexDirection:"column",alignItems:"center",gap:16,padding:"48px 0"}}>
    <div style={{width:40,height:40,borderRadius:"50%",border:`3px solid ${C.brassGlow}`,borderTop:`3px solid ${C.brass}`,animation:"spin 1s linear infinite"}}/>
    <div style={{fontFamily:"Inter,system-ui,sans-serif",fontSize:13,color:C.midGray,letterSpacing:"0.08em"}}>SYNTHESIZING NETWORK DATA</div>
    <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
  </div>
);

const UrgencyBadge = ({urgency}) => {
  const map={HIGH:[C.red,"#FEF2F2"],MEDIUM:[C.amber,"#FFFBEB"],LOW:[C.green,"#F0FDF4"]};
  const [color,bg]=map[urgency]||[C.midGray,C.warm];
  return <span style={{fontSize:10,fontWeight:800,letterSpacing:"0.1em",padding:"2px 8px",borderRadius:4,background:bg,color,textTransform:"uppercase"}}>{urgency}</span>;
};

const ModuleInsightRow = ({mod,insight}) => {
  const m=MODULES.find(x=>x.id===mod||x.label.toLowerCase()===mod);
  if(!m)return null;
  return (
    <div style={{display:"flex",alignItems:"flex-start",gap:12,padding:"12px 0",borderBottom:`1px solid ${C.border}`}}>
      <div style={{width:32,height:32,borderRadius:8,background:m.color+"18",display:"flex",alignItems:"center",justifyContent:"center",fontSize:14,flexShrink:0}}>{m.icon}</div>
      <div>
        <div style={{fontSize:10,fontWeight:700,color:m.color,letterSpacing:"0.1em",textTransform:"uppercase",marginBottom:2}}>{m.label}</div>
        <div style={{fontSize:13,color:"#374151",lineHeight:1.6}}>{insight}</div>
      </div>
    </div>
  );
};

const PriorityCard = ({item}) => {
  const m=MODULES.find(x=>x.label.toLowerCase()===item.module?.toLowerCase()||x.id===item.module?.toLowerCase());
  const color=m?.color||C.brass;
  return (
    <div style={{display:"flex",gap:16,padding:"16px 20px",background:C.white,borderRadius:10,border:`1px solid ${C.border}`,boxShadow:"0 1px 4px rgba(0,0,0,0.04)"}}>
      <div style={{width:28,height:28,borderRadius:"50%",background:color+"18",color,fontWeight:800,fontSize:13,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>{item.priority}</div>
      <div style={{flex:1}}>
        <div style={{fontSize:13,color:C.carbon,lineHeight:1.6,marginBottom:6}}>{item.action}</div>
        <div style={{display:"flex",gap:8,alignItems:"center"}}>
          {m&&<span style={{fontSize:11,color:m.color,fontWeight:600}}>{m.label}</span>}
          <UrgencyBadge urgency={item.urgency}/>
        </div>
      </div>
    </div>
  );
};

const MetricPill = ({label,value,color=C.brass}) => (
  <div style={{padding:"8px 16px",borderRadius:8,background:C.warm,border:`1px solid ${C.border}`,textAlign:"center"}}>
    <div style={{fontSize:20,fontWeight:800,color,letterSpacing:"-0.02em"}}>{value}</div>
    <div style={{fontSize:11,color:C.midGray,marginTop:2}}>{label}</div>
  </div>
);

const SectionHeader = ({title,sub}) => (
  <div style={{marginBottom:16}}>
    <div style={{fontSize:11,fontWeight:800,color:C.brass,letterSpacing:"0.12em",textTransform:"uppercase"}}>{title}</div>
    {sub&&<div style={{fontSize:12,color:C.midGray,marginTop:2}}>{sub}</div>}
  </div>
);

export default function HomeApp() {
  const [briefing,setBriefing]=useState(null);
  const [snapshot,setSnapshot]=useState(null);
  const [loading,setLoading]=useState(false);
  const [error,setError]=useState(null);
  const [lastGenerated,setLastGenerated]=useState(null);
  const [userName]=useState("Mike");
  const [expanded,setExpanded]=useState(false);
  const hour=new Date().getHours();
  const greeting=hour<12?"Good morning":hour<17?"Good afternoon":"Good evening";
  const dateStr=new Date().toLocaleDateString("en-US",{weekday:"long",month:"long",day:"numeric"});

  const runBriefing=useCallback(async()=>{
    setLoading(true);setError(null);
    try {
      const snap=buildNetworkSnapshot();setSnapshot(snap);
      const result=await generateBriefing(snap,userName);
      if(result){setBriefing(result);setLastGenerated(new Date());}
      else setError("Could not parse briefing response.");
    } catch(e){setError("Briefing generation failed. Check your connection.");}
    finally{setLoading(false);}
  },[userName]);

  useEffect(()=>{runBriefing();},[]);
  const snap=snapshot;

  return (
    <div style={{fontFamily:"'Inter',system-ui,sans-serif",background:C.warm,minHeight:"100vh",padding:"32px 40px",maxWidth:1100,margin:"0 auto"}}>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:32}}>
        <div>
          <div style={{fontSize:24,fontWeight:800,color:C.carbon,letterSpacing:"-0.02em"}}>{greeting}, {userName}.</div>
          <div style={{fontSize:13,color:C.midGray,marginTop:4}}>{dateStr}</div>
        </div>
        <div style={{display:"flex",flexDirection:"column",alignItems:"flex-end",gap:8}}>
          {lastGenerated&&<div style={{fontSize:11,color:C.midGray}}>Briefing generated {lastGenerated.toLocaleTimeString([],{hour:"2-digit",minute:"2-digit"})}</div>}
          <button onClick={runBriefing} disabled={loading} style={{padding:"8px 20px",borderRadius:8,background:loading?C.warm:C.carbon,color:loading?C.midGray:C.white,border:`1px solid ${loading?C.border:C.carbon}`,fontSize:12,fontWeight:700,cursor:loading?"not-allowed":"pointer",letterSpacing:"0.04em"}}>
            {loading?"Generating...":"↻  Refresh Briefing"}
          </button>
        </div>
      </div>

      {loading&&<Spinner/>}
      {error&&<div style={{padding:"16px 20px",background:"#FEF2F2",border:"1px solid #FECACA",borderRadius:10,color:C.red,fontSize:13,marginBottom:24}}>{error}</div>}

      {briefing&&snap&&!loading&&(
        <div style={{display:"flex",flexDirection:"column",gap:0}}>

          {/* ── HERO — dark, commanding ── */}
          <div style={{background:C.carbon,borderRadius:16,padding:"36px 44px",position:"relative",overflow:"hidden",marginBottom:40}}>
            <div style={{position:"absolute",top:0,right:0,width:300,height:300,background:`radial-gradient(circle at 100% 0%, ${C.brassGlow} 0%, transparent 65%)`,pointerEvents:"none"}}/>
            <div style={{fontSize:10,fontWeight:700,color:C.brass,letterSpacing:"0.2em",textTransform:"uppercase",marginBottom:16}}>Intelligence Brief · {dateStr}</div>
            <div style={{fontSize:26,fontWeight:800,color:C.white,lineHeight:1.3,marginBottom:20,letterSpacing:"-0.02em",maxWidth:720}}>{briefing.headline}</div>
            <div style={{fontSize:15,color:"#C9D1D9",lineHeight:1.8,maxWidth:680,marginBottom:28}}>{briefing.executiveSummary}</div>
            {/* Pulse strip */}
            <div style={{display:"flex",gap:24,paddingTop:24,borderTop:"1px solid rgba(255,255,255,0.08)"}}>
              <div style={{display:"flex",flexDirection:"column",gap:3}}>
                <div style={{fontSize:9,fontWeight:700,color:"rgba(255,255,255,0.35)",letterSpacing:"0.14em",textTransform:"uppercase"}}>Safety</div>
                <div style={{fontSize:14,fontWeight:700,color:snap.watch.networksAtRisk>0?C.amber:C.green}}>{snap.watch.overallStatus}</div>
              </div>
              <div style={{width:1,background:"rgba(255,255,255,0.08)"}}/>
              <div style={{display:"flex",flexDirection:"column",gap:3}}>
                <div style={{fontSize:9,fontWeight:700,color:"rgba(255,255,255,0.35)",letterSpacing:"0.14em",textTransform:"uppercase"}}>Budget</div>
                <div style={{fontSize:14,fontWeight:700,color:snap.ledger.budgetVarianceDirection==="under"?C.green:C.amber}}>{snap.ledger.budgetVarianceDirection==="under"?"-":"+"}${snap.ledger.budgetVariance}%</div>
              </div>
              <div style={{width:1,background:"rgba(255,255,255,0.08)"}}/>
              <div style={{display:"flex",flexDirection:"column",gap:3}}>
                <div style={{fontSize:9,fontWeight:700,color:"rgba(255,255,255,0.35)",letterSpacing:"0.14em",textTransform:"uppercase"}}>Enrollment Gap</div>
                <div style={{fontSize:14,fontWeight:700,color:snap.roster.enrollmentVsProjection<0?C.amber:C.green}}>{snap.roster.enrollmentVsProjection}</div>
              </div>
              <div style={{width:1,background:"rgba(255,255,255,0.08)"}}/>
              <div style={{display:"flex",flexDirection:"column",gap:3}}>
                <div style={{fontSize:9,fontWeight:700,color:"rgba(255,255,255,0.35)",letterSpacing:"0.14em",textTransform:"uppercase"}}>Deadlines</div>
                <div style={{fontSize:14,fontWeight:700,color:snap.guard.deadlinesNext30Days>2?C.amber:C.green}}>{snap.guard.deadlinesNext30Days} next 30d</div>
              </div>
              <div style={{width:1,background:"rgba(255,255,255,0.08)"}}/>
              <div style={{display:"flex",flexDirection:"column",gap:3}}>
                <div style={{fontSize:9,fontWeight:700,color:"rgba(255,255,255,0.35)",letterSpacing:"0.14em",textTransform:"uppercase"}}>Pipeline</div>
                <div style={{fontSize:14,fontWeight:700,color:C.brass}}>${(snap.raise.pipelineWeighted/1000000).toFixed(1)}M</div>
              </div>
            </div>
          </div>

          {/* ── MEMO BODY — white, airy, narrative ── */}
          <div style={{background:C.white,borderRadius:16,padding:"44px 52px",border:`1px solid ${C.border}`}}>

            {/* Priorities */}
            <div style={{marginBottom:44}}>
              <div style={{fontSize:9,fontWeight:700,color:C.midGray,letterSpacing:"0.18em",textTransform:"uppercase",marginBottom:20}}>Today's Priorities</div>
              <div style={{display:"flex",flexDirection:"column",gap:0}}>
                {briefing.topPriorities?.map((p,i)=>(
                  <div key={p.priority} style={{display:"flex",gap:20,padding:"18px 0",borderBottom:i<(briefing.topPriorities.length-1)?`1px solid ${C.border}`:"none",alignItems:"flex-start"}}>
                    <div style={{flexShrink:0,width:24,height:24,borderRadius:"50%",background:p.urgency==="HIGH"?"#FEF2F2":p.urgency==="MEDIUM"?"#FFFBEB":"#F3F4F6",display:"flex",alignItems:"center",justifyContent:"center",marginTop:1}}>
                      <span style={{fontSize:11,fontWeight:800,color:p.urgency==="HIGH"?C.red:p.urgency==="MEDIUM"?C.amber:C.midGray}}>{p.priority}</span>
                    </div>
                    <div style={{flex:1}}>
                      <div style={{fontSize:14,fontWeight:600,color:C.carbon,lineHeight:1.5,marginBottom:4}}>{p.action}</div>
                      <div style={{fontSize:11,color:C.midGray,letterSpacing:"0.06em",textTransform:"uppercase",fontWeight:600}}>{p.module} · <span style={{color:p.urgency==="HIGH"?C.red:p.urgency==="MEDIUM"?C.amber:C.green}}>{p.urgency}</span></div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Cross-Module Signals */}
            {briefing.crossModuleSignals?.length>0&&(
              <div style={{marginBottom:44}}>
                <div style={{fontSize:9,fontWeight:700,color:C.midGray,letterSpacing:"0.18em",textTransform:"uppercase",marginBottom:6}}>Cross-Module Intelligence</div>
                <div style={{fontSize:12,color:C.midGray,marginBottom:20,fontStyle:"italic"}}>Patterns Slate sees that no single department would catch</div>
                <div style={{display:"flex",flexDirection:"column",gap:0}}>
                  {briefing.crossModuleSignals.map((s,i)=>(
                    <div key={i} style={{display:"flex",gap:20,padding:"18px 0",borderBottom:i<(briefing.crossModuleSignals.length-1)?`1px solid ${C.border}`:"none",alignItems:"flex-start"}}>
                      <div style={{flexShrink:0,marginTop:6}}>
                        <div style={{width:7,height:7,borderRadius:"50%",background:s.urgency==="HIGH"?C.red:s.urgency==="MEDIUM"?C.amber:C.green}}/>
                      </div>
                      <div style={{flex:1}}>
                        <div style={{fontSize:14,fontWeight:600,color:C.carbon,lineHeight:1.5,marginBottom:4}}>{s.signal}</div>
                        <div style={{fontSize:13,color:"#555",lineHeight:1.6,marginBottom:8}}>{s.significance}</div>
                        <div style={{display:"flex",gap:6}}>
                          {s.modules?.map((m,j)=>(
                            <span key={j} style={{fontSize:9,fontWeight:700,padding:"2px 8px",borderRadius:3,background:C.warm,color:C.brass,letterSpacing:"0.08em",textTransform:"uppercase",border:`1px solid ${C.border}`}}>{m}</span>
                          ))}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Questions to Sit With */}
            {briefing.questionsToSitWith?.length>0&&(
              <div style={{marginBottom:44}}>
                <div style={{fontSize:9,fontWeight:700,color:C.midGray,letterSpacing:"0.18em",textTransform:"uppercase",marginBottom:6}}>Questions to Sit With</div>
                <div style={{fontSize:12,color:C.midGray,marginBottom:24,fontStyle:"italic"}}>Slate poses these for your consideration today</div>
                <div style={{display:"flex",flexDirection:"column",gap:16}}>
                  {briefing.questionsToSitWith.map((q,i)=>(
                    <div key={i} style={{paddingLeft:20,borderLeft:`2px solid ${C.brass}`,paddingTop:2,paddingBottom:2}}>
                      <div style={{fontSize:15,color:C.carbon,lineHeight:1.7,fontStyle:"italic",fontWeight:400}}>{q}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* National Context */}
            {briefing.nationalContext&&(
              <div style={{marginBottom:44}}>
                <div style={{fontSize:9,fontWeight:700,color:C.midGray,letterSpacing:"0.18em",textTransform:"uppercase",marginBottom:20}}>National & Illinois Context</div>
                <div style={{fontSize:14,color:"#444",lineHeight:1.85}}>{briefing.nationalContext}</div>
              </div>
            )}

            {/* Module Snapshot */}
            <div style={{marginBottom:44}}>
              <div style={{fontSize:9,fontWeight:700,color:C.midGray,letterSpacing:"0.18em",textTransform:"uppercase",marginBottom:20}}>Network Status</div>
              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:0}}>
                {Object.entries(briefing.moduleInsights||{}).map(([mod,insight],i)=>(
                  <div key={mod} style={{display:"flex",gap:14,padding:"12px 0",borderBottom:`1px solid ${C.border}`,alignItems:"flex-start"}}>
                    <div style={{fontSize:9,fontWeight:700,color:C.brass,letterSpacing:"0.1em",textTransform:"uppercase",minWidth:60,paddingTop:2}}>{mod}</div>
                    <div style={{fontSize:13,color:"#444",lineHeight:1.55}}>{insight as string}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Watch Item + Closing */}
            <div style={{marginBottom:44}}>
              <div style={{fontSize:9,fontWeight:700,color:C.midGray,letterSpacing:"0.18em",textTransform:"uppercase",marginBottom:20}}>Keep an Eye On</div>
              <div style={{fontSize:14,color:C.carbon,lineHeight:1.8,paddingLeft:20,borderLeft:`2px solid ${C.border}`}}>{briefing.watchItem}</div>
              {briefing.closing&&<div style={{marginTop:28,fontSize:13,color:C.midGray,lineHeight:1.7,fontStyle:"italic"}}>{briefing.closing}</div>}
            </div>

            {/* Deadlines */}
            {(snap.guard.urgentDeadlines?.length>0||snap.raise.proposalsDueSoon>0)&&(
              <div>
                <div style={{fontSize:9,fontWeight:700,color:C.midGray,letterSpacing:"0.18em",textTransform:"uppercase",marginBottom:20}}>Upcoming Deadlines</div>
                <div style={{display:"flex",flexDirection:"column",gap:0}}>
                  {snap.guard.urgentDeadlines.map((d,i)=>(
                    <div key={i} style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"12px 0",borderBottom:`1px solid ${C.border}`}}>
                      <div style={{fontSize:13,color:C.carbon,fontWeight:500}}>{d.item}</div>
                      <div style={{display:"flex",gap:12,alignItems:"center"}}>
                        <div style={{fontSize:11,color:C.midGray}}>{d.owner}</div>
                        <div style={{fontSize:11,fontWeight:700,color:d.daysOut<=7?C.red:C.amber,background:d.daysOut<=7?"#FEF2F2":"#FFFBEB",padding:"2px 10px",borderRadius:4}}>{d.daysOut}d</div>
                      </div>
                    </div>
                  ))}
                  {snap.raise.dueSoonItems?.map((d,i)=>(
                    <div key={i} style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"12px 0",borderBottom:`1px solid ${C.border}`}}>
                      <div style={{fontSize:13,color:C.carbon,fontWeight:500}}>{d.funder} <span style={{color:C.midGray,fontWeight:400}}>— proposal</span></div>
                      <div style={{display:"flex",gap:12,alignItems:"center"}}>
                        <div style={{fontSize:11,color:C.midGray}}>${(d.amount/1000).toFixed(0)}K</div>
                        <div style={{fontSize:11,fontWeight:700,color:d.daysOut<=7?C.red:C.amber,background:d.daysOut<=7?"#FEF2F2":"#FFFBEB",padding:"2px 10px",borderRadius:4}}>{d.daysOut}d</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

          </div>
        </div>
      )}

          <div style={{display:"grid",gridTemplateColumns:"2fr 1fr",gap:24}}>
            <div style={{background:C.white,borderRadius:16,padding:"24px 28px",border:`1px solid ${C.border}`}}>
              <SectionHeader title="Keep an Eye On"/>
              <div style={{padding:"16px 20px",borderRadius:10,background:C.brassGlow,border:`1px solid ${C.brass}30`}}>
                <div style={{fontSize:22,marginBottom:8}}>👁️</div>
                <div style={{fontSize:14,color:C.carbon,lineHeight:1.7}}>{briefing.watchItem}</div>
              </div>
              {briefing.closing&&<div style={{marginTop:16,paddingTop:16,borderTop:`1px solid ${C.border}`,fontSize:13,color:C.midGray,lineHeight:1.7,fontStyle:"italic"}}>{briefing.closing}</div>}
            </div>
            <div style={{background:C.white,borderRadius:16,padding:"24px 28px",border:`1px solid ${C.border}`}}>
              <SectionHeader title="Upcoming Deadlines" sub="Next 30 days"/>
              <div style={{display:"flex",flexDirection:"column",gap:10}}>
                {snap.guard.urgentDeadlines.map((d,i)=>(
                  <div key={i} style={{padding:"12px 14px",borderRadius:8,background:d.daysOut<=7?"#FEF2F2":C.warm,border:`1px solid ${d.daysOut<=7?"#FECACA":C.border}`}}>
                    <div style={{fontSize:12,fontWeight:700,color:d.daysOut<=7?C.red:C.carbon,marginBottom:2}}>{d.item}</div>
                    <div style={{fontSize:11,color:C.midGray}}>{d.daysOut} days · {d.owner}</div>
                  </div>
                ))}
                {snap.raise.proposalsDueSoon>0&&<>
                  <div style={{fontSize:10,fontWeight:700,color:C.brass,letterSpacing:"0.1em",textTransform:"uppercase",marginTop:4}}>Proposals Due</div>
                  {snap.raise.dueSoonItems.map((d,i)=>(
                    <div key={i} style={{padding:"12px 14px",borderRadius:8,background:d.daysOut<=7?"#FFFBEB":C.warm,border:`1px solid ${d.daysOut<=7?"#FDE68A":C.border}`}}>
                      <div style={{fontSize:12,fontWeight:700,color:C.carbon,marginBottom:2}}>{d.funder}</div>
                      <div style={{fontSize:11,color:C.midGray}}>${(d.amount/1000).toFixed(0)}K · {d.daysOut} days</div>
                    </div>
                  ))}
                </>}
              </div>
            </div>
          </div>

          <div>
            <button onClick={()=>setExpanded(e=>!e)} style={{width:"100%",padding:"14px",borderRadius:10,background:"transparent",border:`1px dashed ${C.border}`,color:C.midGray,fontSize:12,fontWeight:600,cursor:"pointer",letterSpacing:"0.04em"}}>
              {expanded?"▲  Hide Network Detail":"▼  Show Full Network Detail"}
            </button>
            {expanded&&(
              <div style={{marginTop:16,display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:16}}>
                <div style={{background:C.white,borderRadius:14,padding:"20px 22px",border:`1px solid ${C.border}`}}>
                  <div style={{fontSize:11,fontWeight:800,color:"#D45B4F",letterSpacing:"0.12em",textTransform:"uppercase",marginBottom:12}}>🔍 Watch</div>
                  <div style={{fontSize:12,color:C.midGray,lineHeight:1.8}}>
                    <div><span style={{fontWeight:600,color:C.carbon}}>Clear:</span> {snap.watch.clearCampuses} campuses</div>
                    <div><span style={{fontWeight:600,color:C.carbon}}>Elevated:</span> {snap.watch.elevatedCampuses.join(", ")}</div>
                    {snap.watch.activeRetaliationWindows>0&&<div style={{marginTop:6,padding:"8px 10px",background:"#FEF2F2",borderRadius:6,fontSize:11}}>⚠️ {snap.watch.retaliationCampus}: {snap.watch.retaliationPhase} phase · {snap.watch.retaliationHoursRemaining}h remaining</div>}
                    <div style={{marginTop:8,fontSize:11,color:"#9CA3AF",fontStyle:"italic"}}>{snap.watch.lastIncident}</div>
                  </div>
                </div>
                <div style={{background:C.white,borderRadius:14,padding:"20px 22px",border:`1px solid ${C.border}`}}>
                  <div style={{fontSize:11,fontWeight:800,color:"#C79D39",letterSpacing:"0.12em",textTransform:"uppercase",marginBottom:12}}>📊 Ledger</div>
                  <div style={{fontSize:12,color:C.midGray,lineHeight:1.8}}>
                    <div><span style={{fontWeight:600,color:C.carbon}}>YTD Spend:</span> ${(snap.ledger.ytdExpenses/1000000).toFixed(1)}M vs ${(snap.ledger.ytdBudget/1000000).toFixed(1)}M</div>
                    <div><span style={{fontWeight:600,color:C.carbon}}>Variance:</span> {snap.ledger.budgetVariance}% {snap.ledger.budgetVarianceDirection}</div>
                    <div><span style={{fontWeight:600,color:C.carbon}}>Cash on Hand:</span> {snap.ledger.cashDaysOnHand} days</div>
                    <div><span style={{fontWeight:600,color:C.carbon}}>Covenants:</span> {snap.ledger.covenantStatus}</div>
                    <div style={{marginTop:6,fontSize:11,color:C.amber,fontStyle:"italic"}}>{snap.ledger.topVarianceItem}</div>
                  </div>
                </div>
                <div style={{background:C.white,borderRadius:14,padding:"20px 22px",border:`1px solid ${C.border}`}}>
                  <div style={{fontSize:11,fontWeight:800,color:"#4F78D6",letterSpacing:"0.12em",textTransform:"uppercase",marginBottom:12}}>👥 Roster</div>
                  <div style={{fontSize:12,color:C.midGray,lineHeight:1.8}}>
                    <div><span style={{fontWeight:600,color:C.carbon}}>Enrollment:</span> {snap.roster.currentEnrollment.toLocaleString()} of {snap.roster.enrollmentProjection.toLocaleString()}</div>
                    <div><span style={{fontWeight:600,color:C.carbon}}>Gap:</span> {snap.roster.enrollmentVsProjection} students</div>
                    <div><span style={{fontWeight:600,color:C.carbon}}>Revenue at Risk:</span> ${(snap.roster.revenueAtRisk/1000).toFixed(0)}K</div>
                    <div><span style={{fontWeight:600,color:C.carbon}}>Oct Count:</span> {snap.roster.octCountDaysOut} days out</div>
                    <div style={{marginTop:6,fontSize:11,color:C.amber,fontStyle:"italic"}}>At-risk: {snap.roster.atRiskCampuses.join(", ")}</div>
                  </div>
                </div>
                <div style={{background:C.white,borderRadius:14,padding:"20px 22px",border:`1px solid ${C.border}`}}>
                  <div style={{fontSize:11,fontWeight:800,color:"#1D4ED8",letterSpacing:"0.12em",textTransform:"uppercase",marginBottom:12}}>🏛️ Civic</div>
                  <div style={{fontSize:12,color:C.midGray,lineHeight:1.8}}>
                    <div><span style={{fontWeight:600,color:C.carbon}}>Bills in Committee:</span> {snap.civic.billsInCommittee}</div>
                    {snap.civic.pendingBills.map((b,i)=><div key={i} style={{marginTop:4}}><span style={{fontWeight:600,color:C.carbon}}>{b.name}:</span> {b.summary} <span style={{marginLeft:6,fontSize:10,fontWeight:700,color:b.risk==="POSITIVE"?C.green:C.amber}}>[{b.risk}]</span></div>)}
                    <div style={{marginTop:6}}><span style={{fontWeight:600,color:C.carbon}}>Next Hearing:</span> {snap.civic.hearingDate}</div>
                    <div style={{marginTop:4,fontSize:11,color:C.midGray,fontStyle:"italic"}}>{snap.civic.mediaMonitoring}</div>
                  </div>
                </div>
                <div style={{background:C.white,borderRadius:14,padding:"20px 22px",border:`1px solid ${C.border}`}}>
                  <div style={{fontSize:11,fontWeight:800,color:"#B79145",letterSpacing:"0.12em",textTransform:"uppercase",marginBottom:12}}>🤝 Raise</div>
                  <div style={{fontSize:12,color:C.midGray,lineHeight:1.8}}>
                    <div><span style={{fontWeight:600,color:C.carbon}}>Pipeline:</span> ${(snap.raise.pipelineWeighted/1000000).toFixed(1)}M of ${(snap.raise.pipelineGoal/1000000).toFixed(0)}M ({snap.raise.pipelineGoalPct}%)</div>
                    <div><span style={{fontWeight:600,color:C.carbon}}>Closed YTD:</span> ${(snap.raise.closedYTD/1000000).toFixed(1)}M</div>
                    <div><span style={{fontWeight:600,color:C.carbon}}>New Opps:</span> {snap.raise.newOpportunitiesFound} found by AI scan</div>
                    {snap.raise.dueSoonItems.map((d,i)=><div key={i} style={{marginTop:4,fontSize:11,color:d.daysOut<=7?C.amber:C.midGray}}>⏰ {d.funder} due in {d.daysOut}d</div>)}
                  </div>
                </div>
                <div style={{background:C.white,borderRadius:14,padding:"20px 22px",border:`1px solid ${C.border}`}}>
                  <div style={{fontSize:11,fontWeight:800,color:"#C66C3D",letterSpacing:"0.12em",textTransform:"uppercase",marginBottom:12}}>🏫 Grounds</div>
                  <div style={{fontSize:12,color:C.midGray,lineHeight:1.8}}>
                    <div><span style={{fontWeight:600,color:C.carbon}}>Open Work Orders:</span> {snap.grounds.openWorkOrders}</div>
                    <div><span style={{fontWeight:600,color:C.carbon}}>Urgent:</span> {snap.grounds.urgentWorkOrders}</div>
                    {snap.grounds.urgentItems.map((item,i)=><div key={i} style={{marginTop:4,fontSize:11,color:C.red}}>⚠️ {item}</div>)}
                    <div style={{marginTop:6}}><span style={{fontWeight:600,color:C.carbon}}>Capital Projects:</span> {snap.grounds.capitalProjectsActive} active, {snap.grounds.capitalProjectsOnBudget} on budget</div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {!loading&&!briefing&&!error&&(
        <div style={{textAlign:"center",padding:"80px 40px",background:C.white,borderRadius:16,border:`1px solid ${C.border}`}}>
          <div style={{fontSize:40,marginBottom:16}}>🧠</div>
          <div style={{fontSize:18,fontWeight:700,color:C.carbon,marginBottom:8}}>Intelligence Briefing</div>
          <div style={{fontSize:13,color:C.midGray,marginBottom:24}}>Synthesizes live data across all Slate modules into a single morning briefing.</div>
          <button onClick={runBriefing} style={{padding:"12px 32px",borderRadius:8,background:C.carbon,color:C.white,fontSize:13,fontWeight:700,border:"none",cursor:"pointer"}}>Generate My Briefing</button>
  </div>
      )}
      <LocalNewsBlock />
    </div>
  );
}
