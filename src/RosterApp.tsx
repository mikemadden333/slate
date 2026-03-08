import { useState, useRef, useEffect } from "react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, LineChart, Line
} from "recharts";

const SYSTEM_PROMPT = `You are a concise, knowledgeable HR assistant for Noble Schools — a network of 17 public charter high schools in Chicago serving 12,000 students. You help staff quickly understand their benefits, policies, and career resources. Be direct and specific. If unsure, direct staff to humanresources@nobleschools.org or 312-555-0100.

=== MEDICAL INSURANCE (BlueCross BlueShield) ===
Five plan options:
1. Noble HMO – In-network only, requires a Primary Care Physician. Office: $25 copay, Specialist: $45 copay. ER: $300. Generic Rx: $10, Brand: $45, Non-preferred: $65. Employee-only semi-monthly premium: $36.00. No out-of-network benefits.
2. Narrow Network PPO – Curated network. Deductible: $1,200 individual / $3,600 family. Coinsurance: 80% in-network, 50% out. ER: $300 copay. Employee-only: $70.00/semi-monthly.
3. Choice PPO (Tiered T1/T2/T3) – T1 deductible $1,100 individual. Coinsurance 80%. Office: $25/$45. ER: $300. Employee-only: $118.00/semi-monthly.
4. HDHP Plan A + HSA – Deductible $3,500 individual. Coinsurance 90% after deductible. Noble contributes $900 (EE only) or $1,500 (family) to HSA. Employee-only premium: $44.00/semi-monthly.
5. HDHP Plan B + HSA – Deductible $4,400. Noble contributes $1,800 (EE only) or $3,000 (family). Employee-only: $22.00/semi-monthly.
2026 HSA IRS max: $4,450 (EE only), $8,850 (family). Age 55+ catch-up contribution: $1,000.

=== DENTAL (BlueCross BlueShield) ===
Basic Dental: $60 deductible, $1,800 annual max. Preventive 100%, Basic 85%, Major 55%. No ortho. Employee-only: $6.00/semi-monthly.
Dental Plus: No deductible, $2,600 annual max. Preventive 100%, Basic 100%, Major 55%. Ortho 50%, $1,600 lifetime max, adults and children. Invisalign included. Employee-only: $1.50/semi-monthly.

=== VISION (EyeMed Insight) ===
Exam $10 copay every 12 months. Lenses $25 copay every 12 months. Frames $140 allowance every 24 months. Contacts $140 allowance every 12 months. Cannot receive glasses and contacts in the same calendar year. Employee-only: $2.00/semi-monthly.

=== FSA & COMMUTER ===
Health Care FSA: Up to $1,050/year. $700 carryover. Claims due March 31 of following year.
Dependent Care FSA: Up to $7,500/year for qualifying child/adult dependents.
Limited Purpose FSA: HDHP/HSA enrollees only — dental and vision costs only.
Commuter Benefits (WEX): Up to $345/month pre-tax for parking and/or mass transit.

=== LIFE & DISABILITY ===
Basic Life & AD&D: 2x annual salary, up to $500,000. Fully paid by Noble.
Voluntary Life: Employee up to $500,000; spouse up to $100,000; children up to $10,000.
Short-Term Disability: Begins day 11. Pays 60% weekly earnings, up to $3,100/week, for 13 weeks. Noble pays 100%.
Long-Term Disability: Begins day 91. Pays 66.67% monthly earnings, up to $15,000/month, to retirement age. Noble pays 100%.

=== RETIREMENT ===
401(k) via Fidelity: Auto-enrolled. 2026 max $23,500 ($7,000 catch-up if 50+). Noble matches 100% of first 5% after 1 year of service.
CTPF Pension: Required for licensed educators. Employee 2%, Noble 7% + 10% admin fee. No Social Security while enrolled.

=== WELLNESS ===
EAP (AllOne Health): Free, confidential 24/7. Call 800-555-0190, ers-eap.com (code: noble26). First 3 counseling sessions free.
Headspace: Free premium for all staff + 5 guests.
Care Solace: Free mental health/substance use navigation. 888-555-0120.
Maven: Free virtual clinic for family planning, parenting, pediatrics.
On-Campus Fitness: Access during designated hours. Contact campus athletic department.
Divvy Bike: Discounted annual membership. Code via HR.

=== PARENTAL LEAVE ===
Eligible after 6 months of service. Up to 18 weeks (20 for c-section). All benefits continue during leave.
Birthing parent: 6-8 weeks disability (paid) + 6 weeks bonding (paid) + 6 weeks extended bonding (unpaid or PTO).
Non-birthing parent: 12 weeks bonding (paid) + 6 weeks extended bonding (unpaid or PTO).
Initiate: GroupAbsenceManagement.com/noble.

=== TIME OFF ===
PTO Year: August 1 – July 31.
Academic staff: Up to 5 days year 1 (grows with tenure). Observe student breaks. 3-day carryover cap.
Admin (52-week) staff: Up to 13 days year 1 (grows with tenure). 7-day carryover cap.
All full-time staff: 27 fixed paid days in SY26, plus PTO and 5-day sick bank. Sick days reset August 1, no carryover.

=== HANDBOOK POLICIES ===
Core Commitments: Excellence, Belonging, Integrity, Growth, Service, Community.
Attendance: Arrive 15 minutes before scheduled start. Three unexcused absences per semester triggers a formal performance conversation.
Dress Code: Business professional on testing days, family nights, board events. Business casual all other days.
Cell Phones: Personal use during the school day limited to prep periods, breaks, and lunch.
Social Media: No student content without written family consent. No posts that could compromise student privacy or embarrass Noble.
Conflicts of Interest: Disclose to HR within 30 days.
Harassment: All forms prohibited. Report to supervisor or HR. Retaliation against good-faith reports is prohibited.
Confidentiality: Student records, family info, and personnel matters are confidential. Violations may result in disciplinary action.

=== CAREER DEVELOPMENT ===
Teacher Licensure: On-staff licensure specialist. 75% tuition coverage for MAT and alt-licensure at partner universities. Contact credentials@nobleschools.org.
Subject Endorsements: 75% coverage in Math, ELA, Science, Social Science, Foreign Language, ESL/Bilingual.
Leadership Pathways: Diverse Leaders Fellowship, Principal Fellowship, Management Accelerator (year-long mentorship cohort).
Distinguished Teacher: Annual cohort. Recipients earn a permanent $10,000 salary increase.
Referral Bonus: $1,000 for hiring referrals completing 120 days. Details in staff handbook.`;

const CAMPUSES = [
  "All Campuses","Rowe-Clark","Bulls College Prep","Chicago Lights Prep",
  "Comer","DRW","Gary Comer","ITW Speer","Johnson","Mansueto",
  "Muchin","Noble Street","Pritzker","UIC Prep","Baker","Butler",
  "Hansberry","Golder"
];

const ROLES = [
  {id:1,name:"Jada Morris",title:"Math Teacher",dept:"Instruction",campus:"Rowe-Clark",status:"Active",fte:"1.0",licensed:true},
  {id:2,name:"Marcus Webb",title:"English Teacher",dept:"Instruction",campus:"Bulls College Prep",status:"Active",fte:"1.0",licensed:true},
  {id:3,name:"Priya Nair",title:"Learning Specialist",dept:"Special Education",campus:"Mansueto",status:"Active",fte:"1.0",licensed:true},
  {id:4,name:"Devon Castillo",title:"Dean of Students",dept:"Student Services",campus:"Rowe-Clark",status:"Active",fte:"1.0",licensed:false},
  {id:5,name:"Aaliyah Thomas",title:"Science Teacher",dept:"Instruction",campus:"Pritzker",status:"On Leave",fte:"1.0",licensed:true},
  {id:6,name:"[VACANT]",title:"SPED Teacher",dept:"Special Education",campus:"Baker",status:"Open",fte:"1.0",licensed:true},
  {id:7,name:"Chris Okonkwo",title:"Assistant Principal",dept:"Administration",campus:"Muchin",status:"Active",fte:"1.0",licensed:true},
  {id:8,name:"Fatima Diallo",title:"Counselor",dept:"Student Services",campus:"Johnson",status:"Active",fte:"1.0",licensed:false},
  {id:9,name:"[VACANT]",title:"Learning Specialist",dept:"Special Education",campus:"Rowe-Clark",status:"Open",fte:"1.0",licensed:true},
  {id:10,name:"Sam Rivera",title:"Office Manager",dept:"Operations",campus:"DRW",status:"Active",fte:"1.0",licensed:false},
  {id:11,name:"[VACANT]",title:"Math Teacher",dept:"Instruction",campus:"UIC Prep",status:"Open",fte:"1.0",licensed:true},
  {id:12,name:"Nadia Brooks",title:"Registrar",dept:"Administration",campus:"Hansberry",status:"Active",fte:"1.0",licensed:false},
  {id:13,name:"Elijah Park",title:"History Teacher",dept:"Instruction",campus:"Noble Street",status:"Active",fte:"1.0",licensed:true},
  {id:14,name:"[VACANT]",title:"SPED Teacher",dept:"Special Education",campus:"Golder",status:"Open",fte:"1.0",licensed:true},
  {id:15,name:"Tanya Hill",title:"Data Manager",dept:"Operations",campus:"Comer",status:"Active",fte:"1.0",licensed:false},
  {id:16,name:"Jerome Banks",title:"Biology Teacher",dept:"Instruction",campus:"Butler",status:"Active",fte:"1.0",licensed:true},
  {id:17,name:"[VACANT]",title:"English Teacher",dept:"Instruction",campus:"ITW Speer",status:"Open",fte:"1.0",licensed:true},
  {id:18,name:"Keisha Moore",title:"Social Worker",dept:"Student Services",campus:"Gary Comer",status:"Active",fte:"1.0",licensed:false},
];

const headcountData = [
  {campus:"Rowe-Clark",total:92,licensed:61},
  {campus:"Bulls",total:88,licensed:58},
  {campus:"Mansueto",total:95,licensed:63},
  {campus:"Baker",total:79,licensed:51},
  {campus:"Muchin",total:84,licensed:56},
  {campus:"Pritzker",total:97,licensed:65},
  {campus:"DRW",total:76,licensed:49},
];

const vacancyByDept = [
  {name:"Instruction",value:8},
  {name:"Sp. Ed.",value:11},
  {name:"Operations",value:3},
  {name:"Student Svcs",value:5},
  {name:"Admin",value:2},
];

const turnoverTrend = [
  {month:"Aug",rate:2.1},{month:"Sep",rate:1.8},{month:"Oct",rate:2.4},
  {month:"Nov",rate:1.9},{month:"Dec",rate:3.1},{month:"Jan",rate:2.7},
  {month:"Feb",rate:2.2},{month:"Mar",rate:1.6},
];

const PIE_COLORS = ["#1a3a5c","#2e6da4","#4a9fd4","#7dbfe8","#b3d9f2"];

export default function RosterModule() {
  const [activeTab, setActiveTab] = useState("directory");
  const [campusFilter, setCampusFilter] = useState("All Campuses");
  const [statusFilter, setStatusFilter] = useState("All");
  const [searchQuery, setSearchQuery] = useState("");
  const [messages, setMessages] = useState([
    {role:"assistant",text:"Hi — I'm your Noble HR Assistant. Ask me about benefits, policies, time off, career support, or anything in the staff handbook."}
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const chatEndRef = useRef(null);

  useEffect(() => { chatEndRef.current?.scrollIntoView({behavior:"smooth"}); }, [messages]);

  async function sendMessage() {
    if (!input.trim() || loading) return;
    const userMsg = {role:"user",text:input.trim()};
    setMessages(m => [...m, userMsg]);
    setInput("");
    setLoading(true);
    try {
      const history = [...messages, userMsg].map(m => ({
        role: m.role === "assistant" ? "assistant" : "user",
        content: m.text
      }));
      const res = await fetch("https://api.anthropic.com/v1/messages", {
        method:"POST",
        headers:{"Content-Type":"application/json"},
        body: JSON.stringify({
          model:"claude-sonnet-4-20250514",
          max_tokens:1000,
          system: SYSTEM_PROMPT,
          messages: history
        })
      });
      const data = await res.json();
      const reply = data.content?.[0]?.text || "I'm unable to retrieve that right now. Please contact humanresources@nobleschools.org.";
      setMessages(m => [...m, {role:"assistant",text:reply}]);
    } catch {
      setMessages(m => [...m, {role:"assistant",text:"Something went wrong. Please contact humanresources@nobleschools.org or call 312-555-0100."}]);
    }
    setLoading(false);
  }

  const filteredRoles = ROLES.filter(r => {
    const matchCampus = campusFilter === "All Campuses" || r.campus === campusFilter;
    const matchStatus = statusFilter === "All" || r.status === statusFilter;
    const matchSearch = r.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.campus.toLowerCase().includes(searchQuery.toLowerCase());
    return matchCampus && matchStatus && matchSearch;
  });

  const activeStaff = ROLES.filter(r => r.status === "Active" || r.status === "On Leave").length;
  const vacantCount = ROLES.filter(r => r.status === "Open").length;
  const onLeaveCount = ROLES.filter(r => r.status === "On Leave").length;
  const licRate = Math.round((ROLES.filter(r => r.licensed && r.status !== "Open").length / activeStaff) * 100);

  const statusBadge = (s) => {
    if (s === "Active") return {bg:"#d1fae5",color:"#065f46"};
    if (s === "Open") return {bg:"#fee2e2",color:"#991b1b"};
    if (s === "On Leave") return {bg:"#fef3c7",color:"#92400e"};
    return {bg:"#f3f4f6",color:"#374151"};
  };

  const SUGGESTED = [
    "What medical plans are available?",
    "How does parental leave work?",
    "How much PTO do I earn?",
    "What's the 401(k) match?",
    "How do I get licensure support?",
    "What does the EAP cover?",
    "Is ortho covered?",
    "What is the dress code?",
  ];

  return (
    <div style={{fontFamily:"'DM Sans','Helvetica Neue',Arial,sans-serif",background:"#f0f4f8",minHeight:"100vh",color:"#1a2332"}}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:ital,opsz,wght@0,9..40,400;0,9..40,500;0,9..40,600;0,9..40,700;0,9..40,800&display=swap');
        @keyframes bounce{0%,80%,100%{transform:translateY(0)}40%{transform:translateY(-5px)}}
        @keyframes fadeIn{from{opacity:0;transform:translateY(6px)}to{opacity:1;transform:translateY(0)}}
        .msg-in{animation:fadeIn 0.2s ease}
        .sq-btn:hover{background:#e4eef8 !important;border-color:#2e6da4 !important}
        .tab-btn:hover{background:rgba(255,255,255,0.15) !important}
        ::-webkit-scrollbar{width:5px}::-webkit-scrollbar-track{background:transparent}::-webkit-scrollbar-thumb{background:#c8d8e8;border-radius:4px}
      `}</style>

      {/* ── Header ── */}
      <div style={{background:"#0d1f35",padding:"16px 28px",display:"flex",alignItems:"center",justifyContent:"space-between",borderBottom:"3px solid #1e5799",position:"sticky",top:0,zIndex:100}}>
        <div style={{display:"flex",alignItems:"center",gap:14}}>
          <div style={{background:"#f5c518",borderRadius:5,padding:"4px 9px",fontWeight:800,fontSize:14,color:"#0d1f35",letterSpacing:1}}>N</div>
          <div>
            <div style={{fontSize:17,fontWeight:700,color:"#fff",letterSpacing:"0.01em"}}>Noble Schools</div>
            <div style={{fontSize:10,color:"#6699bb",letterSpacing:"0.1em",textTransform:"uppercase",marginTop:1}}>Roster &nbsp;·&nbsp; People Intelligence</div>
          </div>
        </div>
        <div style={{display:"flex",gap:6}}>
          {[["directory","Directory"],["dashboard","Dashboard"],["assistant","HR Assistant"]].map(([id,label]) => (
            <button key={id} onClick={() => setActiveTab(id)} className="tab-btn" style={{
              padding:"7px 16px",borderRadius:6,fontSize:13,fontWeight:600,border:"none",cursor:"pointer",
              background: activeTab===id ? "#1e5799" : "rgba(255,255,255,0.07)",
              color: activeTab===id ? "#fff" : "#99bbd9",
              transition:"all 0.15s",letterSpacing:"0.02em"
            }}>{label}</button>
          ))}
        </div>
      </div>

      <div style={{padding:"24px 28px",maxWidth:1200,margin:"0 auto"}}>

        {/* ── DIRECTORY ── */}
        {activeTab==="directory" && (
          <div>
            <div style={{display:"flex",gap:10,marginBottom:18,flexWrap:"wrap",alignItems:"center"}}>
              <input value={searchQuery} onChange={e=>setSearchQuery(e.target.value)} placeholder="Search name, title, campus…"
                style={{flex:1,minWidth:200,padding:"9px 14px",border:"1px solid #cdd8e6",borderRadius:7,fontSize:14,background:"#fff",outline:"none",boxShadow:"0 1px 2px rgba(0,0,0,0.04)"}}/>
              <select value={campusFilter} onChange={e=>setCampusFilter(e.target.value)}
                style={{padding:"9px 12px",border:"1px solid #cdd8e6",borderRadius:7,fontSize:13,background:"#fff",color:"#1a2332",outline:"none"}}>
                {CAMPUSES.map(c=><option key={c}>{c}</option>)}
              </select>
              <select value={statusFilter} onChange={e=>setStatusFilter(e.target.value)}
                style={{padding:"9px 12px",border:"1px solid #cdd8e6",borderRadius:7,fontSize:13,background:"#fff",color:"#1a2332",outline:"none"}}>
                {["All","Active","Open","On Leave"].map(s=><option key={s}>{s}</option>)}
              </select>
              <div style={{fontSize:12,color:"#7a92a8",padding:"0 4px"}}>{filteredRoles.length} of {ROLES.length} positions</div>
            </div>

            <div style={{background:"#fff",borderRadius:10,overflow:"hidden",boxShadow:"0 1px 4px rgba(0,0,0,0.07)"}}>
              <table style={{width:"100%",borderCollapse:"collapse",fontSize:13.5}}>
                <thead>
                  <tr style={{background:"#eef2f7",borderBottom:"2px solid #dce6f0"}}>
                    {["Name","Title","Department","Campus","Licensed","FTE","Status"].map(h=>(
                      <th key={h} style={{padding:"11px 16px",textAlign:"left",fontWeight:700,color:"#4a6180",fontSize:11,letterSpacing:"0.07em",textTransform:"uppercase"}}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filteredRoles.map((r,i)=>{
                    const badge = statusBadge(r.status);
                    return (
                      <tr key={r.id} style={{borderBottom:"1px solid #edf2f7",background:i%2===0?"#fff":"#fafcfe",transition:"background 0.1s"}}
                        onMouseEnter={e=>e.currentTarget.style.background="#f4f8fc"}
                        onMouseLeave={e=>e.currentTarget.style.background=i%2===0?"#fff":"#fafcfe"}>
                        <td style={{padding:"11px 16px",fontWeight:r.status==="Open"?400:600,color:r.status==="Open"?"#9aacbd":"#1a2332"}}>{r.name}</td>
                        <td style={{padding:"11px 16px",color:"#374f65"}}>{r.title}</td>
                        <td style={{padding:"11px 16px",color:"#374f65"}}>{r.dept}</td>
                        <td style={{padding:"11px 16px",color:"#374f65"}}>{r.campus}</td>
                        <td style={{padding:"11px 16px"}}>
                          {r.status!=="Open"&&(
                            <span style={{fontSize:11,fontWeight:700,color:r.licensed?"#1a7a4a":"#8a4f00"}}>
                              {r.licensed?"✓ Licensed":"Unlicensed"}
                            </span>
                          )}
                        </td>
                        <td style={{padding:"11px 16px",color:"#374f65"}}>{r.fte}</td>
                        <td style={{padding:"11px 16px"}}>
                          <span style={{padding:"3px 10px",borderRadius:20,fontSize:11,fontWeight:700,background:badge.bg,color:badge.color}}>{r.status}</span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
              {filteredRoles.length===0&&(
                <div style={{textAlign:"center",padding:48,color:"#9aacbd",fontSize:14}}>No positions match your filters.</div>
              )}
            </div>
          </div>
        )}

        {/* ── DASHBOARD ── */}
        {activeTab==="dashboard" && (
          <div>
            <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:14,marginBottom:22}}>
              {[
                {label:"Active Staff",value:activeStaff,sub:"across 17 campuses",accent:"#0d1f35"},
                {label:"Open Positions",value:vacantCount,sub:"network-wide vacancies",accent:"#b91c1c"},
                {label:"On Leave",value:onLeaveCount,sub:"on approved leave",accent:"#b45309"},
                {label:"Licensed Staff",value:`${licRate}%`,sub:"hold valid IL licensure",accent:"#15803d"},
              ].map(k=>(
                <div key={k.label} style={{background:"#fff",borderRadius:10,padding:"18px 20px",boxShadow:"0 1px 4px rgba(0,0,0,0.07)",borderTop:`4px solid ${k.accent}`}}>
                  <div style={{fontSize:30,fontWeight:800,color:k.accent,lineHeight:1}}>{k.value}</div>
                  <div style={{fontSize:13,fontWeight:600,color:"#1a2332",marginTop:6}}>{k.label}</div>
                  <div style={{fontSize:11,color:"#8a9bb0",marginTop:3}}>{k.sub}</div>
                </div>
              ))}
            </div>

            <div style={{display:"grid",gridTemplateColumns:"1.7fr 1fr",gap:18,marginBottom:18}}>
              <div style={{background:"#fff",borderRadius:10,padding:"20px 22px",boxShadow:"0 1px 4px rgba(0,0,0,0.07)"}}>
                <div style={{fontWeight:700,fontSize:14,color:"#1a2332",marginBottom:3}}>Headcount by Campus</div>
                <div style={{fontSize:11,color:"#8a9bb0",marginBottom:16}}>Total staff vs. licensed staff — sample campuses</div>
                <ResponsiveContainer width="100%" height={200}>
                  <BarChart data={headcountData} barSize={13} barCategoryGap="30%">
                    <CartesianGrid strokeDasharray="3 3" stroke="#edf1f6" vertical={false}/>
                    <XAxis dataKey="campus" tick={{fontSize:10,fill:"#8a9bb0"}} axisLine={false} tickLine={false}/>
                    <YAxis tick={{fontSize:10,fill:"#8a9bb0"}} axisLine={false} tickLine={false}/>
                    <Tooltip contentStyle={{fontSize:12,borderRadius:7,border:"1px solid #dce6f0",boxShadow:"0 2px 8px rgba(0,0,0,0.08)"}}/>
                    <Bar dataKey="total" fill="#1e5799" name="Total" radius={[3,3,0,0]}/>
                    <Bar dataKey="licensed" fill="#7dbfe8" name="Licensed" radius={[3,3,0,0]}/>
                  </BarChart>
                </ResponsiveContainer>
              </div>

              <div style={{background:"#fff",borderRadius:10,padding:"20px 22px",boxShadow:"0 1px 4px rgba(0,0,0,0.07)"}}>
                <div style={{fontWeight:700,fontSize:14,color:"#1a2332",marginBottom:3}}>Open Positions by Dept.</div>
                <div style={{fontSize:11,color:"#8a9bb0",marginBottom:16}}>29 vacancies network-wide</div>
                <ResponsiveContainer width="100%" height={200}>
                  <PieChart>
                    <Pie data={vacancyByDept} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={72}
                      label={({name,value})=>`${name}: ${value}`} labelLine={true} fontSize={10}>
                      {vacancyByDept.map((_,i)=><Cell key={i} fill={PIE_COLORS[i%PIE_COLORS.length]}/>)}
                    </Pie>
                    <Tooltip contentStyle={{fontSize:12,borderRadius:7}}/>
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div style={{background:"#fff",borderRadius:10,padding:"20px 22px",boxShadow:"0 1px 4px rgba(0,0,0,0.07)"}}>
              <div style={{fontWeight:700,fontSize:14,color:"#1a2332",marginBottom:3}}>Monthly Separation Rate — SY26</div>
              <div style={{fontSize:11,color:"#8a9bb0",marginBottom:16}}>% of active staff separating each month</div>
              <ResponsiveContainer width="100%" height={150}>
                <LineChart data={turnoverTrend}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#edf1f6" vertical={false}/>
                  <XAxis dataKey="month" tick={{fontSize:11,fill:"#8a9bb0"}} axisLine={false} tickLine={false}/>
                  <YAxis tick={{fontSize:11,fill:"#8a9bb0"}} axisLine={false} tickLine={false} domain={[0,4]}/>
                  <Tooltip contentStyle={{fontSize:12,borderRadius:7}} formatter={v=>[`${v}%`,"Rate"]}/>
                  <Line type="monotone" dataKey="rate" stroke="#1e5799" strokeWidth={2.5} dot={{r:4,fill:"#1e5799"}} activeDot={{r:6}}/>
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {/* ── HR ASSISTANT ── */}
        {activeTab==="assistant" && (
          <div style={{display:"grid",gridTemplateColumns:"1fr 270px",gap:18,alignItems:"start"}}>
            <div style={{background:"#fff",borderRadius:10,boxShadow:"0 1px 4px rgba(0,0,0,0.07)",display:"flex",flexDirection:"column",height:580,overflow:"hidden"}}>
              <div style={{background:"#0d1f35",padding:"14px 20px",borderRadius:"10px 10px 0 0",flexShrink:0}}>
                <div style={{color:"#fff",fontWeight:700,fontSize:14}}>Noble HR Assistant</div>
                <div style={{color:"#6699bb",fontSize:11,marginTop:2}}>Benefits &nbsp;·&nbsp; Policies &nbsp;·&nbsp; Career Support</div>
              </div>

              <div style={{flex:1,overflowY:"auto",padding:"18px",display:"flex",flexDirection:"column",gap:10}}>
                {messages.map((m,i)=>(
                  <div key={i} className="msg-in" style={{display:"flex",justifyContent:m.role==="user"?"flex-end":"flex-start"}}>
                    <div style={{
                      maxWidth:"82%",padding:"10px 14px",lineHeight:1.6,fontSize:13.5,whiteSpace:"pre-wrap",
                      borderRadius:m.role==="user"?"14px 14px 4px 14px":"14px 14px 14px 4px",
                      background:m.role==="user"?"#0d1f35":"#f0f5fb",
                      color:m.role==="user"?"#fff":"#1a2332",
                    }}>{m.text}</div>
                  </div>
                ))}
                {loading&&(
                  <div style={{display:"flex",gap:5,padding:"10px 14px",background:"#f0f5fb",borderRadius:"14px 14px 14px 4px",width:"fit-content"}}>
                    {[0,1,2].map(d=>(
                      <div key={d} style={{width:7,height:7,borderRadius:"50%",background:"#1e5799",animation:"bounce 1s infinite",animationDelay:`${d*0.18}s`}}/>
                    ))}
                  </div>
                )}
                <div ref={chatEndRef}/>
              </div>

              <div style={{borderTop:"1px solid #edf2f7",padding:"12px 14px",display:"flex",gap:8,background:"#fafcfe",flexShrink:0}}>
                <input value={input} onChange={e=>setInput(e.target.value)}
                  onKeyDown={e=>e.key==="Enter"&&sendMessage()}
                  placeholder="Ask about benefits, PTO, policies…"
                  style={{flex:1,padding:"9px 14px",border:"1px solid #cdd8e6",borderRadius:7,fontSize:14,outline:"none",background:"#fff"}}
                  disabled={loading}/>
                <button onClick={sendMessage} disabled={loading||!input.trim()} style={{
                  padding:"9px 18px",background:loading||!input.trim()?"#c0cfde":"#0d1f35",
                  color:"#fff",border:"none",borderRadius:7,fontWeight:700,fontSize:13,
                  cursor:loading||!input.trim()?"not-allowed":"pointer",transition:"background 0.15s"
                }}>Send</button>
              </div>
            </div>

            {/* Sidebar */}
            <div style={{display:"flex",flexDirection:"column",gap:14}}>
              <div style={{background:"#fff",borderRadius:10,padding:"16px",boxShadow:"0 1px 4px rgba(0,0,0,0.07)"}}>
                <div style={{fontSize:11,fontWeight:700,color:"#0d1f35",letterSpacing:"0.08em",textTransform:"uppercase",marginBottom:10}}>Ask About</div>
                <div style={{display:"flex",flexDirection:"column",gap:7}}>
                  {SUGGESTED.map(q=>(
                    <button key={q} className="sq-btn" onClick={()=>{setInput(q);}}
                      style={{textAlign:"left",padding:"8px 11px",border:"1px solid #dce6f0",borderRadius:7,background:"#f7fafc",
                        fontSize:12,color:"#1e5799",cursor:"pointer",lineHeight:1.4,transition:"all 0.12s"}}
                    >{q}</button>
                  ))}
                </div>
              </div>

              <div style={{background:"#eef4fb",borderRadius:10,padding:"14px 16px",border:"1px solid #cdd8e6"}}>
                <div style={{fontSize:11,fontWeight:700,color:"#0d1f35",letterSpacing:"0.08em",textTransform:"uppercase",marginBottom:8}}>Direct HR Contact</div>
                <div style={{fontSize:12,color:"#374f65",lineHeight:1.7}}>
                  <div>✉ humanresources@nobleschools.org</div>
                  <div>✆ 312-555-0100</div>
                  <div style={{marginTop:6,fontSize:11,color:"#7a92a8"}}>Mon – Fri, 7:30 am – 4:30 pm</div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
