// @ts-nocheck
import { useState, useEffect, useCallback } from "react";

const C = {
  carbon:"#0D1B2A",brass:"#B79145",brassLight:"#D4AF6A",brassGlow:"rgba(183,145,69,0.12)",
  warm:"#F5F0EB",warmDark:"#EDE5DA",midGray:"#6B7280",border:"#E5DDD5",white:"#FFFFFF",
  green:"#16A34A",amber:"#D97706",red:"#DC2626",blue:"#1D4ED8",
};

const MODULES = [
  { id:"sentinel",label:"Watch",icon:"🔍",color:"#D45B4F",domain:"Safety" },
  { id:"ledger",label:"Ledger",icon:"📊",color:"#C79D39",domain:"Finance" },
  { id:"roster",label:"Roster",icon:"👥",color:"#4F78D6",domain:"Enrollment" },
  { id:"brief",label:"Brief",icon:"✉️",color:"#4EA27A",domain:"Communications" },
  { id:"shield",label:"Guard",icon:"🛡️",color:"#7B63E1",domain:"Risk & Compliance" },
  { id:"grounds",label:"Grounds",icon:"🏫",color:"#C66C3D",domain:"Operations" },
  { id:"capitol",label:"Civic",icon:"🏛️",color:"#1D4ED8",domain:"Gov. Affairs" },
  { id:"raise",label:"Raise",icon:"🤝",color:"#B79145",domain:"Philanthropy" },
];

const buildNetworkSnapshot = () => ({
  generatedAt: new Date().toISOString(),
  network:"Noble Schools",campusCount:17,studentCount:12000,
  watch:{networksAtRisk:2,criticalCampuses:[],elevatedCampuses:["Rowe-Clark","DRW"],clearCampuses:15,activeRetaliationWindows:1,retaliationCampus:"Rowe-Clark",retaliationPhase:"WATCH",retaliationHoursRemaining:52,lastIncident:"Weapons arrest 0.4mi from Rowe-Clark at 11:42pm",overallStatus:"ELEVATED"},
  ledger:{budgetVariance:-3.8,budgetVarianceDirection:"under",cashDaysOnHand:62,covenantStatus:"COMPLIANT",dscrProjected:1.14,personnelOverBudget:false,topVarianceItem:"Substitute costs tracking 12% above trend",ytdExpenses:94200000,ytdBudget:97900000,quarterlyStatus:"On Track"},
  roster:{enrollmentVsProjection:-18,enrollmentProjection:12018,currentEnrollment:12000,revenueAtRisk:252000,atRiskCampuses:["Baker","Comer"],yieldTracking:"8% below last year in 9th grade",attritionFlags:3,octCountDaysOut:22},
  guard:{deadlinesNext30Days:3,overdueItems:0,urgentDeadlines:[{item:"Annual Title I Compliance Report",daysOut:7,owner:"COO"},{item:"Authorizer Financial Benchmark Submission",daysOut:14,owner:"CFO"},{item:"Board Governance Self-Assessment",daysOut:28,owner:"President"}],auditReadiness:78,openPolicies:4},
  grounds:{openWorkOrders:9,urgentWorkOrders:2,urgentItems:["HVAC failure - Baker 3rd floor","Water main leak - UIC"],capitalProjectsActive:3,capitalProjectsOnBudget:2,vendorContractsExpiring:1},
  civic:{billsInCommittee:2,pendingBills:[{name:"HB 4821",summary:"Charter authorization renewal process changes",risk:"WATCH"},{name:"SB 2907",summary:"Per-pupil funding equity adjustment",risk:"POSITIVE"}],upcomingHearings:1,hearingDate:"March 18",hearingTopic:"Charter Funding Equity Subcommittee",staleStaleholderRelationships:3,mediaMonitoring:"No active coverage. One pending Chalkbeat inquiry."},
  raise:{pipelineWeighted:4200000,pipelineGoal:10000000,pipelineGoalPct:42,closedYTD:1850000,proposalsSubmitted:4,proposalsDueSoon:2,dueSoonItems:[{funder:"MacArthur Foundation",amount:250000,daysOut:6},{funder:"ISBE Innovation Grant",amount:175000,daysOut:11}],overdueReports:0,grantScanLastRun:"Today",newOpportunitiesFound:3},
});

const generateBriefing = async (snapshot, userName="Mike") => {
  const hour = new Date().getHours();
  const timeOfDay = hour < 12 ? "morning" : hour < 17 ? "afternoon" : "evening";
  const dayOfWeek = new Date().toLocaleDateString("en-US",{weekday:"long"});
  const systemPrompt = `You are Slate, an AI intelligence system for charter school networks. You generate daily briefings for senior school leaders that synthesize operational data across all platform modules.\n\nYour voice: Direct. Clear. Warm but serious. You write the way a trusted, sharp colleague would brief a leader they respect. No corporate language. No filler. Every sentence earns its place.\n\nYou are generating a briefing for ${userName}, a senior leader at Noble Schools in Chicago.\n\nStructure your response as valid JSON with this exact shape:\n{\n  "headline": "One sharp sentence (max 15 words) capturing the most important thing happening right now",\n  "executiveSummary": "Two to three sentences synthesizing the overall network picture. What does the leader most need to know in the next 60 seconds? Be specific. Reference actual numbers and situations.",\n  "topPriorities": [\n    { "priority": 1, "module": "module name", "action": "Specific action in one sentence", "urgency": "HIGH|MEDIUM|LOW" },\n    { "priority": 2, "module": "module name", "action": "Specific action in one sentence", "urgency": "HIGH|MEDIUM|LOW" },\n    { "priority": 3, "module": "module name", "action": "Specific action in one sentence", "urgency": "HIGH|MEDIUM|LOW" }\n  ],\n  "moduleInsights": {\n    "watch": "One sentence. Safety picture right now.",\n    "ledger": "One sentence. Financial health right now.",\n    "roster": "One sentence. Enrollment situation right now.",\n    "guard": "One sentence. Compliance posture right now.",\n    "grounds": "One sentence. Operations status right now.",\n    "civic": "One sentence. Legislative/government picture right now.",\n    "raise": "One sentence. Philanthropy pipeline right now."\n  },\n  "watchItem": "One thing the leader should keep an eye on today that is not yet urgent but could become so.",\n  "closing": "One sentence. Something specific and grounding for the leader as they start their day."\n}\n\nReturn ONLY the JSON object. No preamble, no markdown, no explanation.`;
  const userPrompt = `Generate a ${timeOfDay} briefing for ${dayOfWeek}. Here is the complete network snapshot:\n\n${JSON.stringify(snapshot,null,2)}`;
  const response = await fetch("/api/anthropic-proxy",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({model:"claude-sonnet-4-20250514",max_tokens:1000,system:systemPrompt,messages:[{role:"user",content:userPrompt}]})});
  const data = await response.json();
  const text = data.content?.find(b=>b.type==="text")?.text||"";
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
        <div style={{display:"flex",flexDirection:"column",gap:24}}>
          <div style={{background:C.carbon,borderRadius:16,padding:"28px 36px",position:"relative",overflow:"hidden"}}>
            <div style={{position:"absolute",top:0,right:0,width:200,height:200,background:`radial-gradient(circle at 100% 0%, ${C.brassGlow} 0%, transparent 70%)`,pointerEvents:"none"}}/>
            <div style={{fontSize:10,fontWeight:800,color:C.brass,letterSpacing:"0.16em",textTransform:"uppercase",marginBottom:12}}>Network Intelligence Briefing</div>
            <div style={{fontSize:22,fontWeight:800,color:C.white,lineHeight:1.35,marginBottom:16,letterSpacing:"-0.02em"}}>{briefing.headline}</div>
            <div style={{fontSize:14,color:"#C9D1D9",lineHeight:1.75,maxWidth:680}}>{briefing.executiveSummary}</div>
          </div>

          <div style={{display:"grid",gridTemplateColumns:"repeat(5,1fr)",gap:12}}>
            <MetricPill label="Safety Status" value={snap.watch.overallStatus} color={snap.watch.networksAtRisk>0?C.amber:C.green}/>
            <MetricPill label="Budget Variance" value={`${snap.ledger.budgetVarianceDirection==="under"?"-":"+"}${snap.ledger.budgetVariance}%`} color={snap.ledger.budgetVariance<0?C.green:C.amber}/>
            <MetricPill label="Enrollment Gap" value={`${snap.roster.enrollmentVsProjection}`} color={snap.roster.enrollmentVsProjection<0?C.amber:C.green}/>
            <MetricPill label="Compliance Deadlines" value={snap.guard.deadlinesNext30Days} color={snap.guard.deadlinesNext30Days>2?C.amber:C.green}/>
            <MetricPill label="Pipeline Weighted" value={`$${(snap.raise.pipelineWeighted/1000000).toFixed(1)}M`} color={C.brass}/>
          </div>

          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:24}}>
            <div style={{background:C.white,borderRadius:16,padding:"24px 28px",border:`1px solid ${C.border}`}}>
              <SectionHeader title="Your Top Priorities" sub="Items that need your attention today"/>
              <div style={{display:"flex",flexDirection:"column",gap:10}}>
                {briefing.topPriorities?.map(p=><PriorityCard key={p.priority} item={p}/>)}
              </div>
            </div>
            <div style={{background:C.white,borderRadius:16,padding:"24px 28px",border:`1px solid ${C.border}`}}>
              <SectionHeader title="Module Snapshot" sub="One-line status across all systems"/>
              <div>{Object.entries(briefing.moduleInsights||{}).map(([mod,insight])=><ModuleInsightRow key={mod} mod={mod} insight={insight}/>)}</div>
            </div>
          </div>

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
    </div>
  );
}
