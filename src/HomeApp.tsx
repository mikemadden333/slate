// @ts-nocheck
import { buildNetworkSnapshot } from './networkSnapshot';
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
    <div style={{fontFamily:"'Inter',system-ui,sans-serif",background:C.warm,minHeight:"100vh",padding:"32px 24px"}}>
      <div style={{display:"flex",justifyContent:"flex-end",marginBottom:16}}>
        <button onClick={runBriefing} disabled={loading} style={{padding:"8px 20px",borderRadius:8,background:loading?C.warm:C.carbon,color:loading?C.midGray:C.white,border:`1px solid ${loading?C.border:C.carbon}`,fontSize:12,fontWeight:700,cursor:loading?"not-allowed":"pointer",letterSpacing:"0.04em"}}>
          {loading?"Generating...":"↻  Refresh Briefing"}
        </button>
      </div>

      {loading&&<Spinner/>}
      {error&&<div style={{padding:"16px 20px",background:"#FEF2F2",border:"1px solid #FECACA",borderRadius:10,color:C.red,fontSize:13,marginBottom:24}}>{error}</div>}

      {briefing&&snap&&!loading&&(
        <div style={{display:"flex",flexDirection:"column",gap:0}}>

          {/* ── HERO — dark, commanding ── */}
          <div style={{background:C.carbon,borderRadius:16,padding:"36px 44px",position:"relative",overflow:"hidden",marginBottom:40,maxWidth:900,margin:"0 auto 40px"}}>
            <div style={{position:"absolute",top:0,right:0,width:300,height:300,background:`radial-gradient(circle at 100% 0%, ${C.brassGlow} 0%, transparent 65%)`,pointerEvents:"none"}}/>
            <div style={{fontSize:10,fontWeight:700,color:C.brass,letterSpacing:"0.2em",textTransform:"uppercase",marginBottom:12}}>Intelligence Brief · {dateStr}</div>
            <div style={{fontSize:13,color:"rgba(255,255,255,0.45)",marginBottom:16}}>{greeting}, {userName}.</div>
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

          {/* ── MEMO BODY — one flowing story ── */}
          <div style={{background:C.white,borderRadius:16,padding:"52px 60px",border:`1px solid ${C.border}`,maxWidth:900,margin:"0 auto",width:"100%"}}>

            {/* Priorities — no header, lead with action */}
            <div style={{marginBottom:52}}>
              <div style={{fontSize:13,color:C.midGray,marginBottom:24,lineHeight:1.6}}>
                Here is where your attention belongs today.
              </div>
              <div style={{display:"flex",flexDirection:"column",gap:0}}>
                {briefing.topPriorities?.map((p,i)=>(
                  <div key={p.priority} style={{display:"flex",gap:20,padding:"20px 0",borderBottom:i<(briefing.topPriorities.length-1)?`1px solid ${C.border}`:"none",alignItems:"flex-start"}}>
                    <div style={{flexShrink:0,width:7,height:7,borderRadius:"50%",background:p.urgency==="HIGH"?C.red:p.urgency==="MEDIUM"?C.amber:C.green,marginTop:7}}/>
                    <div style={{flex:1}}>
                      <div style={{fontSize:15,fontWeight:600,color:C.carbon,lineHeight:1.55,marginBottom:5}}>{p.action}</div>
                      <div style={{fontSize:11,color:C.midGray,letterSpacing:"0.06em",textTransform:"uppercase",fontWeight:500}}>{p.module}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Divider */}
            <div style={{height:1,background:C.border,marginBottom:52}}/>

            {/* Cross-Module Signals — narrative intro, no header */}
            {briefing.crossModuleSignals?.length>0&&(
              <div style={{marginBottom:52}}>
                <div style={{fontSize:13,color:C.midGray,marginBottom:28,lineHeight:1.6}}>
                  Slate is watching three patterns across your organization that no single department would catch.
                </div>
                <div style={{display:"flex",flexDirection:"column",gap:0}}>
                  {briefing.crossModuleSignals.map((s,i)=>(
                    <div key={i} style={{display:"flex",gap:20,padding:"20px 0",borderBottom:i<(briefing.crossModuleSignals.length-1)?`1px solid ${C.border}`:"none",alignItems:"flex-start"}}>
                      <div style={{flexShrink:0,width:7,height:7,borderRadius:"50%",background:s.urgency==="HIGH"?C.red:s.urgency==="MEDIUM"?C.amber:C.green,marginTop:7}}/>
                      <div style={{flex:1}}>
                        <div style={{fontSize:15,fontWeight:600,color:C.carbon,lineHeight:1.55,marginBottom:6}}>{s.signal}</div>
                        <div style={{fontSize:13,color:"#666",lineHeight:1.7,marginBottom:10}}>{s.significance}</div>
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

            {/* National Context — flows directly, no header */}
            {briefing.nationalContext&&(
              <>
                <div style={{height:1,background:C.border,marginBottom:52}}/>
                <div style={{marginBottom:52}}>
                  <div style={{fontSize:13,color:C.midGray,marginBottom:16,lineHeight:1.6}}>Beyond your walls, the landscape looks like this.</div>
                  <div style={{fontSize:15,color:C.carbon,lineHeight:1.85,fontWeight:400}}>{briefing.nationalContext}</div>
                </div>
              </>
            )}

            {/* Questions — set apart, no header, just the questions */}
            {briefing.questionsToSitWith?.length>0&&(
              <>
                <div style={{height:1,background:C.border,marginBottom:52}}/>
                <div style={{marginBottom:52}}>
                  <div style={{fontSize:13,color:C.midGray,marginBottom:28,lineHeight:1.6}}>
                    Before you walk into your first meeting, sit with these.
                  </div>
                  <div style={{display:"flex",flexDirection:"column",gap:20}}>
                    {briefing.questionsToSitWith.map((q,i)=>(
                      <div key={i} style={{paddingLeft:24,borderLeft:`2px solid ${C.brass}`}}>
                        <div style={{fontSize:16,color:C.carbon,lineHeight:1.75,fontStyle:"italic",fontWeight:400}}>{q}</div>
                      </div>
                    ))}
                  </div>
                </div>
              </>
            )}

            {/* Watch Item — flows naturally after questions */}
            {briefing.watchItem&&(
              <>
                <div style={{height:1,background:C.border,marginBottom:52}}/>
                <div style={{marginBottom:52}}>
                  <div style={{fontSize:13,color:C.midGray,marginBottom:16,lineHeight:1.6}}>One thing not yet urgent — but worth watching.</div>
                  <div style={{fontSize:15,color:C.carbon,lineHeight:1.8,paddingLeft:24,borderLeft:`2px solid ${C.border}`}}>{briefing.watchItem}</div>
                </div>
              </>
            )}

            {/* Closing — italic, subdued, final word */}
            {briefing.closing&&(
              <div style={{fontSize:13,color:C.midGray,lineHeight:1.7,fontStyle:"italic",marginBottom:52}}>{briefing.closing}</div>
            )}

            {/* Network Status — dimmed, reference only, at the bottom */}
            <div style={{height:1,background:C.border,marginBottom:36}}/>
            <div style={{marginBottom:briefing.topPriorities?.length>0?36:0}}>
              <div style={{fontSize:10,fontWeight:600,color:C.midGray,letterSpacing:"0.14em",textTransform:"uppercase",marginBottom:16,opacity:0.6}}>Network at a glance</div>
              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:0,opacity:0.75}}>
                {Object.entries(briefing.moduleInsights||{}).map(([mod,insight])=>(
                  <div key={mod} style={{display:"flex",gap:12,padding:"9px 0",borderBottom:`1px solid ${C.border}`,alignItems:"flex-start"}}>
                    <div style={{fontSize:8,fontWeight:700,color:C.brass,letterSpacing:"0.1em",textTransform:"uppercase",minWidth:52,paddingTop:2}}>{mod}</div>
                    <div style={{fontSize:12,color:"#666",lineHeight:1.5}}>{insight as string}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Deadlines — reference, bottom */}
            {(snap.guard.urgentDeadlines?.length>0||snap.raise.proposalsDueSoon>0)&&(
              <div>
                <div style={{fontSize:10,fontWeight:600,color:C.midGray,letterSpacing:"0.14em",textTransform:"uppercase",marginBottom:16,opacity:0.6}}>Upcoming deadlines</div>
                <div style={{display:"flex",flexDirection:"column",gap:0,opacity:0.85}}>
                  {snap.guard.urgentDeadlines.map((d,i)=>(
                    <div key={i} style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"10px 0",borderBottom:`1px solid ${C.border}`}}>
                      <div style={{fontSize:13,color:C.carbon,fontWeight:500}}>{d.item}</div>
                      <div style={{display:"flex",gap:12,alignItems:"center"}}>
                        <div style={{fontSize:11,color:C.midGray}}>{d.owner}</div>
                        <div style={{fontSize:11,fontWeight:700,color:d.daysOut<=7?C.red:C.amber,background:d.daysOut<=7?"#FEF2F2":"#FFFBEB",padding:"2px 10px",borderRadius:4}}>{d.daysOut}d</div>
                      </div>
                    </div>
                  ))}
                  {snap.raise.dueSoonItems?.map((d,i)=>(
                    <div key={i} style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"10px 0",borderBottom:`1px solid ${C.border}`}}>
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
