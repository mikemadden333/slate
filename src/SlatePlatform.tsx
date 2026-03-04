// @ts-nocheck
import { useState, useEffect, useRef } from "react";
import SentinelApp from "./SentinelApp";
import LedgerApp from "./LedgerApp";
import BriefApp from "./BriefApp";
import RosterApp from "./RosterApp";
import ShieldApp from "./ShieldApp";
import GroundsApp from "./GroundsApp";

const C = {
  deep: "#121315", rock: "#23272F", mid: "#2C3440", light: "#6B7280",
  brass: "#B79145", chalk: "#E7E2D8", signal: "#2F8F95", white: "#FFFFFF", bg: "#F7F5F1",
};
const MOD = { sentinel: "#D45B4F", ledger: "#C79D39", roster: "#4F78D6", brief: "#4EA27A", shield: "#7B63E1", grounds: "#C66C3D" };

const MODULES = [
  { id: "sentinel", label: "Watch", category: "SAFETY INTELLIGENCE", icon: "🛡", color: MOD.sentinel, desc: "Real-time violence intelligence. Campus risk scoring, retaliation window tracking, AI morning briefings.", status: "LIVE", metrics: "17 campuses monitored", tagline: "Know what happened before your students arrive." },
  { id: "ledger", label: "Ledger", category: "FINANCIAL INTELLIGENCE", icon: "📊", color: MOD.ledger, desc: "Budget visibility, cash flow forecasting, variance analysis. CFO-grade financial intelligence.", status: "LIVE", metrics: "$240M budget tracked", tagline: "See your money the way your board needs to." },
  { id: "roster", label: "Roster", category: "ENROLLMENT INTELLIGENCE", icon: "📋", color: MOD.roster, desc: "Enrollment forecasting, recruitment funnel tracking, yield modeling, attrition early warning.", status: "LIVE", metrics: "12,120 students", tagline: "Stop managing enrollment in spreadsheets." },
  { id: "brief", label: "Brief", category: "COMMUNICATIONS INTELLIGENCE", icon: "✉️", color: MOD.brief, desc: "AI-drafted communications grounded in live Slate data. In your voice. Out in seconds.", status: "LIVE", metrics: "Powered by Claude", tagline: "Your voice. Your data. Seconds, not hours." },
  { id: "shield", label: "Guard", category: "RISK MANAGEMENT INTELLIGENCE", icon: "⚖️", color: MOD.shield, desc: "Compliance monitoring, incident tracking, insurance analysis, regulatory deadline tracking.", status: "LIVE", metrics: "12 compliance areas", tagline: "Every deadline. Every policy. Every campus." },
  { id: "grounds", label: "Grounds", category: "OPERATIONS INTELLIGENCE", icon: "🏫", color: MOD.grounds, desc: "Facilities management, capital projects, food service, transportation across all campuses.", status: "LIVE", metrics: "1.5M sq ft managed", tagline: "The building is the first thing families see." },
];

/* ═══════════════════════════════════════════════════════════ */
const GlobalCSS = () => (<style>{`
  @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&family=JetBrains+Mono:wght@400;500;600;700&display=swap');
  * { box-sizing: border-box; }
  body { margin: 0; padding: 0; overflow: hidden; }
  .slate-module-box { overflow: visible; }
  @keyframes fadeSlideUp {
    from { opacity: 0; transform: translateY(12px); }
    to { opacity: 1; transform: translateY(0); }
  }
  @keyframes fadeIn {
    from { opacity: 0; }
    to { opacity: 1; }
  }
  @keyframes shimmer {
    0% { background-position: -200% 0; }
    100% { background-position: 200% 0; }
  }
  .slate-module-box > * {
    animation: fadeIn 0.35s ease both;
  }
  /* Custom scrollbar — thin, dark, elegant */
  ::-webkit-scrollbar { width: 6px; height: 6px; }
  ::-webkit-scrollbar-track { background: transparent; }
  ::-webkit-scrollbar-thumb { background: rgba(45,55,72,0.25); border-radius: 3px; }
  ::-webkit-scrollbar-thumb:hover { background: rgba(45,55,72,0.45); }
  /* Sidebar nav hover */
  .nav-item { transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1); border-radius: 10px; }
  .nav-item:hover { background: rgba(255,255,255,0.06); }
  .nav-item.active { background: rgba(255,255,255,0.08); }
  /* Module card hover lift */
  .mod-card { transition: transform 0.25s cubic-bezier(0.4, 0, 0.2, 1), box-shadow 0.25s cubic-bezier(0.4, 0, 0.2, 1); }
  .mod-card:hover { transform: translateY(-4px); }
  .mod-card:active { transform: translateY(-1px); transition-duration: 0.1s; }
  /* KPI card hover */
  .dash-card { transition: transform 0.2s ease, box-shadow 0.2s ease; cursor: default; }
  .dash-card:hover { transform: translateY(-2px); box-shadow: 0 4px 16px rgba(0,0,0,0.08); }
  /* Smooth page transitions */
  .slate-module-box { transition: opacity 0.3s ease; }
  /* Selection color */
  ::selection { background: rgba(183,145,69,0.2); color: #121315; }
  .dash-card {
    animation: fadeSlideUp 0.5s ease both;
  }
  .dash-card:nth-child(1) { animation-delay: 0.05s; }
  .dash-card:nth-child(2) { animation-delay: 0.1s; }
  .dash-card:nth-child(3) { animation-delay: 0.15s; }
  .dash-card:nth-child(4) { animation-delay: 0.2s; }
  .mod-card {
    animation: fadeSlideUp 0.5s ease both;
  }
  .mod-card:nth-child(1) { animation-delay: 0.15s; }
  .mod-card:nth-child(2) { animation-delay: 0.2s; }
  .mod-card:nth-child(3) { animation-delay: 0.25s; }
  .mod-card:nth-child(4) { animation-delay: 0.3s; }
  .mod-card:nth-child(5) { animation-delay: 0.35s; }
  .mod-card:nth-child(6) { animation-delay: 0.4s; }
  .slate-scroll::-webkit-scrollbar { width: 6px; }
  .slate-scroll::-webkit-scrollbar-track { background: transparent; }
  .slate-scroll::-webkit-scrollbar-thumb { background: ${C.chalk}; border-radius: 3px; }
  @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&family=JetBrains+Mono:wght@400;500;600;700&display=swap');
  * { font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif; }
  @keyframes slateGlow { 0%,100%{opacity:0.04;transform:scale(1)} 50%{opacity:0.08;transform:scale(1.05)} }
  @keyframes slateDotPulse { 0%,100%{box-shadow:0 0 12px currentColor} 50%{box-shadow:0 0 22px currentColor} }
`}</style>);

/* ═══════════════════════════════════════════════════════════
   SPLASH SCREEN — Gold dot writes Slate, settles as period
   ═══════════════════════════════════════════════════════════ */
const SplashScreen = ({ onComplete }) => {
  const [fadeOut, setFadeOut] = React.useState(false);
  const [showTagline, setShowTagline] = React.useState(false);
  const [showModules, setShowModules] = React.useState(false);
  const [showFooter, setShowFooter] = React.useState(false);
  const strokeRef = React.useRef(null);
  const fillRef   = React.useRef(null);
  const dotRef    = React.useRef(null);
  const trail1Ref = React.useRef(null);
  const trail2Ref = React.useRef(null);
  const trail3Ref = React.useRef(null);
  const svgRef    = React.useRef(null);
  const animRef   = React.useRef(0);

  React.useEffect(() => {
    const tFade = setTimeout(() => setFadeOut(true), 5500);
    const tDone = setTimeout(() => onComplete(), 6500);
    return () => { clearTimeout(tFade); clearTimeout(tDone); cancelAnimationFrame(animRef.current); };
  }, [onComplete]);

  React.useEffect(() => {
    const stroke = strokeRef.current;
    const fill   = fillRef.current;
    const dot    = dotRef.current;
    const t1 = trail1Ref.current, t2 = trail2Ref.current, t3 = trail3Ref.current;
    const svg = svgRef.current;
    if (!stroke || !fill || !dot || !svg) return;

    let totalLen = 2200;
    try { totalLen = stroke.getTotalLength(); } catch(e) {
      try { totalLen = stroke.getComputedTextLength() * 3.2; } catch(e2) {}
    }
    stroke.style.strokeDasharray  = String(totalLen);
    stroke.style.strokeDashoffset = String(totalLen);

    const bbox = stroke.getBBox();
    const dotFinalX = bbox.x + bbox.width + 22;
    const dotFinalY = bbox.y + bbox.height - 12;
    const DELAY = 700, WRITE = 2600, SETTLE = 420;
    const history = [];

    const run = setTimeout(() => {
      let startPt = { x: bbox.x, y: bbox.y + bbox.height * 0.5 };
      try { const p = stroke.getPointAtLength(0); startPt = { x: p.x, y: p.y }; } catch(e) {}

      dot.setAttribute('cx', String(startPt.x));
      dot.setAttribute('cy', String(startPt.y));
      dot.setAttribute('opacity', '1');
      t1?.setAttribute('opacity', '1');
      t2?.setAttribute('opacity', '1');
      t3?.setAttribute('opacity', '1');

      let start = null, phase = 'write', settleFromX = 0, settleFromY = 0;

      const easeInOutCubic = t => t < 0.5 ? 4*t*t*t : 1 - Math.pow(-2*t+2,3)/2;
      const easeOutBack = t => { const c1=1.70158,c3=c1+1; return 1+c3*Math.pow(t-1,3)+c1*Math.pow(t-1,2); };

      function frame(ts) {
        if (!start) start = ts;
        const elapsed = ts - start;
        if (phase === 'write') {
          const t = Math.min(elapsed / WRITE, 1);
          const eas = easeInOutCubic(t);
          const drawn = eas * totalLen;
          stroke.style.strokeDashoffset = String(totalLen - drawn);
          let tipX = bbox.x + eas * bbox.width, tipY = dotFinalY;
          try { const pt = stroke.getPointAtLength(Math.min(drawn, totalLen - 0.1)); tipX = pt.x; tipY = pt.y; } catch(e) {}
          history.unshift({ x: tipX, y: tipY });
          if (history.length > 24) history.pop();
          dot.setAttribute('cx', String(tipX)); dot.setAttribute('cy', String(tipY));
          const h1 = history[5]||{x:tipX,y:tipY}, h2 = history[11]||{x:tipX,y:tipY}, h3 = history[20]||{x:tipX,y:tipY};
          t1?.setAttribute('cx',String(h1.x)); t1?.setAttribute('cy',String(h1.y));
          t2?.setAttribute('cx',String(h2.x)); t2?.setAttribute('cy',String(h2.y));
          t3?.setAttribute('cx',String(h3.x)); t3?.setAttribute('cy',String(h3.y));
          if (t >= 1) { settleFromX = tipX; settleFromY = tipY; phase = 'settle'; start = ts; }
          animRef.current = requestAnimationFrame(frame);
        } else if (phase === 'settle') {
          const t = Math.min(elapsed / SETTLE, 1);
          const eas = easeOutBack(t);
          const cx = settleFromX + (dotFinalX - settleFromX) * eas;
          const cy = settleFromY + (dotFinalY - settleFromY) * eas;
          dot.setAttribute('cx',String(cx)); dot.setAttribute('cy',String(cy));
          t1?.setAttribute('cx',String(cx)); t1?.setAttribute('cy',String(cy));
          t2?.setAttribute('cx',String(cx)); t2?.setAttribute('cy',String(cy));
          t3?.setAttribute('cx',String(cx)); t3?.setAttribute('cy',String(cy));
          const to = Math.max(0,(1-t)*0.4);
          t1?.setAttribute('opacity',String(to)); t2?.setAttribute('opacity',String(to*0.6)); t3?.setAttribute('opacity',String(to*0.3));
          if (t >= 1) {
            t1?.setAttribute('opacity','0'); t2?.setAttribute('opacity','0'); t3?.setAttribute('opacity','0');
            dot.setAttribute('cx',String(dotFinalX)); dot.setAttribute('cy',String(dotFinalY));
            fill.style.opacity = '1'; stroke.style.opacity = '0';
            spawnBurst(dotFinalX, dotFinalY, svg);
            setTimeout(() => setShowTagline(true), 220);
            setTimeout(() => setShowModules(true), 480);
            setTimeout(() => setShowFooter(true), 800);
          } else { animRef.current = requestAnimationFrame(frame); }
        }
      }
      animRef.current = requestAnimationFrame(frame);
    }, DELAY);
    return () => clearTimeout(run);
  }, []);

  function spawnBurst(x, y, svg) {
    for (let i = 0; i < 12; i++) {
      const c = document.createElementNS('http://www.w3.org/2000/svg','circle');
      const angle = (i/12)*Math.PI*2, dist = 12+Math.random()*10;
      c.setAttribute('cx',String(x)); c.setAttribute('cy',String(y));
      c.setAttribute('r',String(1.4+Math.random())); c.setAttribute('fill','#c9943a');
      svg.appendChild(c);
      c.animate([{opacity:'0.9',transform:'translate(0,0)'},{opacity:'0',transform:`translate(${Math.cos(angle)*dist}px,${Math.sin(angle)*dist}px)`}],
        {duration:550,delay:i*16,easing:'ease-out',fill:'forwards'});
      setTimeout(()=>{try{c.remove()}catch(e){}},1000);
    }
  }

  const splashModules = [
    {label:'Watch',  color:'#e05c52',glow:'rgba(224,92,82,0.5)'},
    {label:'Ledger', color:'#c9943a',glow:'rgba(201,148,58,0.5)'},
    {label:'Roster', color:'#4a7fb5',glow:'rgba(74,127,181,0.5)'},
    {label:'Brief',  color:'#3a9e6e',glow:'rgba(58,158,110,0.5)'},
    {label:'Guard',  color:'#7b5ea7',glow:'rgba(123,94,167,0.5)'},
    {label:'Grounds',color:'#c87533',glow:'rgba(200,117,51,0.5)'},
  ];

  return (
    <div style={{position:'fixed',inset:0,zIndex:9999,background:'#181e24',display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',opacity:fadeOut?0:1,transform:fadeOut?'scale(1.02)':'scale(1)',filter:fadeOut?'blur(3px)':'blur(0)',overflow:'hidden',transition:'opacity 1.0s ease-in-out,transform 1.0s ease-in-out,filter 1.0s ease-in-out'}}>
      <div style={{position:'absolute',inset:0,pointerEvents:'none',background:'radial-gradient(ellipse 100% 80% at 20% 30%,rgba(20,35,55,0.7) 0%,transparent 60%),radial-gradient(ellipse 80% 70% at 80% 70%,rgba(15,25,45,0.6) 0%,transparent 60%)'}}/>
      <div style={{position:'absolute',top:32,fontSize:9,fontWeight:300,letterSpacing:'0.28em',color:'rgba(255,255,255,0.28)',textTransform:'uppercase',border:'1px solid rgba(255,255,255,0.14)',padding:'7px 20px',borderRadius:20,fontFamily:'Inter,sans-serif',animation:'splashRise 0.6s ease 0.3s both'}}>
        Platform Design System — Version 2.0 — Confidential
      </div>
      <div style={{marginBottom:40,animation:'splashRise 0.6s ease 0.5s both'}}>
        <svg width="72" height="58" viewBox="0 0 72 58" fill="none">
          <polygon points="16,54 8,4 66,4 55,54" fill="rgba(255,255,255,0.08)" stroke="rgba(255,255,255,0.28)" strokeWidth="1.5"/>
          <line x1="17" y1="24" x2="55" y2="24" stroke="rgba(255,255,255,0.85)" strokeWidth="3" strokeLinecap="round"/>
          <line x1="19" y1="37" x2="46" y2="37" stroke="rgba(255,255,255,0.45)" strokeWidth="2.2" strokeLinecap="round"/>
        </svg>
      </div>
      <div style={{marginBottom:44}}>
        <svg ref={svgRef} width="620" height="130" viewBox="0 0 620 130" overflow="visible">
          <defs>
            <filter id="splashChalk" x="-1%" y="-8%" width="102%" height="116%">
              <feTurbulence type="fractalNoise" baseFrequency="0.032 0.048" numOctaves="3" seed="6" result="n"/>
              <feDisplacementMap in="SourceGraphic" in2="n" scale="0.9" xChannelSelector="R" yChannelSelector="G"/>
            </filter>
            <filter id="splashGoldGlow" x="-120%" y="-120%" width="340%" height="340%">
              <feGaussianBlur stdDeviation="6" result="b"/>
              <feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge>
            </filter>
          </defs>
          <text ref={fillRef} x="14" y="108" fontFamily="'Unbounded',sans-serif" fontWeight="900" fontSize="104" fill="white" letterSpacing="-1" style={{opacity:0,transition:'opacity 0.2s ease'}}>Slate</text>
          <text ref={strokeRef} x="14" y="108" fontFamily="'Unbounded',sans-serif" fontWeight="900" fontSize="104" fill="none" stroke="white" strokeWidth="2.5" strokeLinejoin="round" strokeLinecap="round" letterSpacing="-1" filter="url(#splashChalk)">Slate</text>
          <circle ref={trail3Ref} cx="-50" cy="-50" r="3.5" fill="rgba(201,148,58,0.12)" opacity="0"/>
          <circle ref={trail2Ref} cx="-50" cy="-50" r="5.5" fill="rgba(201,148,58,0.22)" opacity="0"/>
          <circle ref={trail1Ref} cx="-50" cy="-50" r="8"   fill="rgba(201,148,58,0.4)"  opacity="0"/>
          <circle ref={dotRef}    cx="-50" cy="-50" r="11"  fill="#c9943a" filter="url(#splashGoldGlow)" opacity="0"/>
        </svg>
      </div>
      <div style={{fontSize:12,fontWeight:300,letterSpacing:'0.5em',color:'rgba(255,255,255,0.55)',textTransform:'uppercase',fontFamily:'Inter,sans-serif',marginBottom:52,opacity:showTagline?1:0,transform:showTagline?'translateY(0)':'translateY(8px)',transition:'opacity 0.7s ease,transform 0.7s ease'}}>
        Start with the facts
      </div>
      <div style={{display:'flex',gap:40,marginBottom:60,opacity:showModules?1:0,transform:showModules?'translateY(0)':'translateY(8px)',transition:'opacity 0.7s ease,transform 0.7s ease'}}>
        {splashModules.map(m=>(
          <div key={m.label} style={{display:'flex',flexDirection:'column',alignItems:'center',gap:9}}>
            <div style={{width:9,height:9,borderRadius:'50%',background:m.color,boxShadow:`0 0 8px 2px ${m.glow}`}}/>
            <div style={{fontSize:9,fontWeight:400,letterSpacing:'0.22em',textTransform:'uppercase',color:m.color,fontFamily:'Inter,sans-serif'}}>{m.label}</div>
          </div>
        ))}
      </div>
      <div style={{display:'flex',flexDirection:'column',alignItems:'center',gap:6,opacity:showFooter?1:0,transform:showFooter?'translateY(0)':'translateY(8px)',transition:'opacity 0.8s ease,transform 0.8s ease'}}>
        <div style={{fontSize:11,fontWeight:300,letterSpacing:'0.16em',color:'rgba(255,255,255,0.42)',fontFamily:'Inter,sans-serif',marginBottom:8}}>Intelligence for School Systems</div>
        <div style={{fontSize:10,fontWeight:400,letterSpacing:'0.3em',color:'rgba(255,255,255,0.55)',textTransform:'uppercase',fontFamily:'Inter,sans-serif'}}>Madden Education Advisory</div>
        <div style={{fontSize:9,fontWeight:300,letterSpacing:'0.2em',color:'rgba(255,255,255,0.3)',textTransform:'uppercase',fontFamily:'Inter,sans-serif'}}>Intelligence for School Systems</div>
        <div style={{fontSize:8,fontWeight:300,letterSpacing:'0.18em',color:'rgba(255,255,255,0.18)',textTransform:'uppercase',fontFamily:'Inter,sans-serif',marginTop:2}}>Proprietary &amp; Confidential · All Rights Reserved · 2026</div>
      </div>
      <style>{`@keyframes splashRise{from{opacity:0;transform:translateY(6px)}to{opacity:1;transform:translateY(0)}}`}</style>
    </div>
  );
};

/* ═══════════════════════════════════════════════════════════ */
const ModuleHeader = ({ module: m }) => (
  <div style={{ background: `linear-gradient(135deg, ${C.deep} 0%, ${C.rock} 60%, ${m.color}15 100%)`, borderRadius: 16, padding: "26px 32px", marginBottom: 20, position: "relative", overflow: "hidden" }}>
    <div style={{ position: "absolute", right: -40, top: -40, width: 200, height: 200, borderRadius: "50%", background: m.color, opacity: 0.05 }} />
    <div style={{ position: "absolute", right: 80, bottom: -60, width: 140, height: 140, borderRadius: "50%", background: m.color, opacity: 0.03 }} />
    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 14, position: "relative" }}>
      <svg width="16" height="12" viewBox="0 0 40 30" fill="none"><path d="M8 2 L36 2 L32 28 L4 28 Z" fill="rgba(255,255,255,0.12)" /><line x1="10" y1="13" x2="30" y2="13" stroke={C.chalk} strokeWidth="2.5" strokeLinecap="round" /><line x1="10" y1="19" x2="22" y2="19" stroke={C.chalk} strokeWidth="2.5" strokeLinecap="round" opacity="0.5" /></svg>
      <span style={{ fontSize: 10, fontWeight: 700, color: "rgba(255,255,255,0.55)", letterSpacing: "2.5px", textTransform: "uppercase" }}>Slate {m.label}</span>
      <span style={{ marginLeft: 8, padding: "2px 10px", borderRadius: 12, background: `${m.color}20`, border: `1px solid ${m.color}35`, fontSize: 9, fontWeight: 700, color: m.color, letterSpacing: "1.5px", textTransform: "uppercase" }}>{m.status}</span>
    </div>
    <div style={{ display: "flex", alignItems: "baseline", gap: 16, position: "relative" }}>
      <span style={{ fontSize: 30, fontWeight: 900, color: C.white, letterSpacing: "-0.03em" }}>{m.label}</span>
      <span style={{ fontSize: 9, fontWeight: 600, color: m.color, letterSpacing: "2.5px", textTransform: "uppercase" }}>{m.category}</span>
    </div>
    <div style={{ fontSize: 14, color: "rgba(255,255,255,0.60)", marginTop: 8, fontStyle: "italic", position: "relative" }}>{m.tagline}</div>
  </div>
);

/* ═══════════════════════════════════════════════════════════ */
const Sidebar = ({ activeModule, setActiveModule, collapsed, setCollapsed }) => {
  const w = collapsed ? 64 : 232;
  return (
    <div style={{ width: w, minWidth: w, height: "100vh", background: C.deep, borderRight: "1px solid rgba(255,255,255,0.06)", display: "flex", flexDirection: "column", transition: "width 0.25s ease, min-width 0.25s ease", overflow: "hidden", flexShrink: 0, zIndex: 200 }}>
      <div onClick={() => setActiveModule("dashboard")} style={{ padding: collapsed ? "22px 0" : "22px 24px", display: "flex", alignItems: "center", justifyContent: collapsed ? "center" : "flex-start", gap: 10, cursor: "pointer", borderBottom: "1px solid rgba(255,255,255,0.06)", minHeight: 72, flexShrink: 0, transition: "opacity 0.2s", }} onMouseEnter={e => e.currentTarget.style.opacity = "0.8"} onMouseLeave={e => e.currentTarget.style.opacity = "1"}>
        <svg width={collapsed ? 24 : 26} height={collapsed ? 18 : 19.5} viewBox="0 0 40 30" fill="none"><path d="M8 2 L36 2 L32 28 L4 28 Z" fill="rgba(255,255,255,0.12)" /><line x1="10" y1="13" x2="30" y2="13" stroke={C.chalk} strokeWidth="2.5" strokeLinecap="round" /><line x1="10" y1="19" x2="22" y2="19" stroke={C.chalk} strokeWidth="2.5" strokeLinecap="round" opacity="0.5" /></svg>
        {!collapsed && <span style={{ fontFamily: "'Inter', system-ui, sans-serif", fontWeight: 900, fontSize: 18, color: C.white, letterSpacing: "-0.02em" }}>Slate<span style={{ color: C.brass }}>.</span></span>}
      </div>
      <div style={{ flex: 1, padding: "16px 0", overflowY: "auto", flexShrink: 1 }}>
        <NI label="Dashboard" icon="⬡" color={C.brass} active={activeModule === "dashboard"} collapsed={collapsed} onClick={() => setActiveModule("dashboard")} />
        <div style={{ height: 1, background: "rgba(255,255,255,0.06)", margin: "12px 16px" }} />
        {!collapsed && <div style={{ padding: "0 24px", marginBottom: 10, fontSize: 9, fontWeight: 700, letterSpacing: "3px", textTransform: "uppercase", color: "rgba(255,255,255,0.32)" }}>Modules</div>}
        {MODULES.map(m => <NI key={m.id} label={m.label} icon={m.icon} color={m.color} active={activeModule === m.id} collapsed={collapsed} onClick={() => setActiveModule(m.id)} />)}
      </div>
      <div style={{ borderTop: "1px solid rgba(255,255,255,0.06)", flexShrink: 0 }}>
        {!collapsed && <div style={{ padding: "14px 24px 4px" }}><div style={{ fontSize: 9, color: "rgba(255,255,255,0.32)", letterSpacing: "1.5px", lineHeight: 1.8, textTransform: "uppercase", fontWeight: 600 }}>Madden Education Advisory</div></div>}
        <div onClick={() => setCollapsed(!collapsed)} style={{ padding: "14px 24px", display: "flex", justifyContent: collapsed ? "center" : "flex-end", cursor: "pointer", color: "rgba(255,255,255,0.32)", fontSize: 12 }}>{collapsed ? "▸" : "◂"}</div>
      </div>
    </div>
  );
};
const NI = ({ label, icon, color, active, collapsed, onClick }) => (
  <div onClick={onClick} style={{ display: "flex", alignItems: "center", gap: 12, padding: collapsed ? "11px 0" : "11px 24px", justifyContent: collapsed ? "center" : "flex-start", cursor: "pointer", margin: "1px 10px", borderRadius: 10, background: active ? `${color}12` : "transparent", borderLeft: active ? `3px solid ${color}` : "3px solid transparent", transition: "all 0.2s cubic-bezier(0.4, 0, 0.2, 1)" }} onMouseEnter={e => { if (!active) e.currentTarget.style.background = "rgba(255,255,255,0.04)"; }} onMouseLeave={e => { if (!active) e.currentTarget.style.background = active ? `${color}12` : "transparent"; }}>
    <span style={{ fontSize: 15, width: 22, textAlign: "center", flexShrink: 0, filter: active ? `drop-shadow(0 0 6px ${color})` : "none", transform: active ? "scale(1.15)" : "scale(1)", transition: "all 0.25s cubic-bezier(0.4, 0, 0.2, 1)" }}>{icon}</span>
    {!collapsed && <span style={{ fontSize: 13, fontWeight: active ? 700 : 500, color: active ? "#fff" : "rgba(255,255,255,0.55)", textShadow: active ? `0 0 12px ${color}40` : "none", letterSpacing: "-0.01em", whiteSpace: "nowrap" }}>{label}</span>}
  </div>
);

/* ═══════════════════════════════════════════════════════════ */
const Dashboard = ({ onModuleClick }) => {
  const now = new Date();
  const h = now.getHours();
  const g = h < 12 ? "Good morning" : h < 17 ? "Good afternoon" : "Good evening";
  const dayName = now.toLocaleDateString("en-US", { weekday: "long" });
  const timeStr = now.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
  return (
    <div style={{ maxWidth: 1100, margin: "0 auto" }}>
      <div style={{ marginBottom: 32, animation: "fadeSlideUp 0.6s ease both" }}>
        <div style={{ fontSize: 32, fontWeight: 900, color: C.deep, letterSpacing: "-0.03em", lineHeight: 1.2 }}>{g}, Mike.</div>
        <div style={{ fontSize: 14, color: C.light, marginTop: 8 }}>17 Campuses · 12,120 Students · {dayName} · {timeStr}</div>
        <div style={{ width: 48, height: 3, background: C.brass, borderRadius: 2, marginTop: 14 }} />
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 16, marginBottom: 36 }}>
        {[{ l: "Campuses", v: "17", s: "All operational", c: MOD.sentinel }, { l: "Students", v: "12,120", s: "98.4% of capacity", c: MOD.roster }, { l: "YTD Budget", v: "+$5.9M", s: "Surplus — tracking ahead", c: MOD.ledger }, { l: "DSCR", v: "3.47x", s: "Covenant: 1.0x", c: MOD.brief }].map((k, i) => (
          <div key={i} className="dash-card" style={{ background: C.white, borderRadius: 14, padding: "22px 24px", borderTop: `3px solid ${k.c}`, boxShadow: "0 1px 4px rgba(0,0,0,0.05)" }}>
            <div style={{ fontSize: 10, fontWeight: 700, color: C.light, textTransform: "uppercase", letterSpacing: "1.5px", marginBottom: 6 }}>{k.l}</div>
            <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 28, fontWeight: 700, color: C.deep }}>{k.v}</div>
            <div style={{ fontSize: 12, color: C.light, marginTop: 4 }}>{k.s}</div>
          </div>
        ))}
      </div>
      <div style={{ fontSize: 10, fontWeight: 700, color: C.light, textTransform: "uppercase", letterSpacing: "3px", marginBottom: 18, animation: "fadeSlideUp 0.5s ease 0.12s both" }}>Six Intelligences — One Platform</div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 18 }}>
        {MODULES.map((m, idx) => (
          <div key={m.id} className="mod-card" onClick={() => onModuleClick(m.id)} style={{ background: C.white, borderRadius: 16, cursor: "pointer", overflow: "hidden", boxShadow: "0 1px 4px rgba(0,0,0,0.05)", transition: "transform 0.2s ease, box-shadow 0.2s ease" }}>
            <div style={{ height: 3, background: m.color }} />
            <div style={{ padding: "22px 24px 18px" }}>
              <div style={{ fontSize: 9, fontWeight: 700, letterSpacing: "2px", textTransform: "uppercase", color: m.color, marginBottom: 12 }}>Module {String(idx + 1).padStart(2, "0")}</div>
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}><span style={{ fontSize: 22 }}>{m.icon}</span><span style={{ fontSize: 22, fontWeight: 900, color: C.deep, letterSpacing: "-0.02em" }}>{m.label}</span></div>
              <div style={{ fontSize: 9, fontWeight: 600, letterSpacing: "1.5px", textTransform: "uppercase", color: C.light, marginBottom: 10 }}>{m.category}</div>
              <div style={{ fontSize: 13, color: C.mid, lineHeight: 1.65, marginBottom: 16, minHeight: 44 }}>{m.desc}</div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", paddingTop: 14, borderTop: `1px solid ${C.chalk}` }}>
                <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: "1.5px", textTransform: "uppercase", color: m.color }}>{m.status}</span>
                <span style={{ fontSize: 11, color: C.light, fontFamily: "'JetBrains Mono', monospace" }}>{m.metrics}</span>
              </div>
            </div>
          </div>
        ))}
      </div>
      <div style={{ marginTop: 48, padding: "24px 0 16px", borderTop: `1px solid ${C.chalk}`, animation: "fadeIn 1s ease 0.5s both", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <span style={{ fontSize: 13, fontWeight: 600, color: C.mid }}>Every campus. Every morning. <span style={{ color: C.brass, fontWeight: 800 }}>Start with the facts.</span></span>
        <span style={{ fontSize: 9, color: "rgba(0,0,0,0.22)", letterSpacing: "1px", textTransform: "uppercase" }}>Madden Education Advisory · 2026</span>
      </div>
    </div>
  );
};

/* ═══════════════════════════════════════════════════════════
   MAIN SHELL
   ═══════════════════════════════════════════════════════════ */
export default function SlatePlatform() {
  const [showSplash, setShowSplash] = useState(true);
  const [activeModule, setActiveModule] = useState("dashboard");
  const strikeRef = useRef(false);
  const handleModuleClick = (mod) => {
    if (strikeRef.current === false) {
      strikeRef.current = true;
      try {
        const ctx = new (window.AudioContext || window.webkitAudioContext)();
        const now = ctx.currentTime;
        // Note 1: E5 — bright, clean entry
        const o1 = ctx.createOscillator(); const g1 = ctx.createGain();
        o1.type = 'sine'; o1.frequency.value = 659.25;
        g1.gain.setValueAtTime(0, now);
        g1.gain.linearRampToValueAtTime(0.15, now + 0.015);
        g1.gain.exponentialRampToValueAtTime(0.001, now + 0.6);
        o1.connect(g1); g1.connect(ctx.destination);
        o1.start(now); o1.stop(now + 0.7);
        // Note 2: B5 — perfect fifth up, the lift
        const o2 = ctx.createOscillator(); const g2 = ctx.createGain();
        o2.type = 'sine'; o2.frequency.value = 987.77;
        g2.gain.setValueAtTime(0, now + 0.08);
        g2.gain.linearRampToValueAtTime(0.12, now + 0.095);
        g2.gain.exponentialRampToValueAtTime(0.001, now + 0.8);
        o2.connect(g2); g2.connect(ctx.destination);
        o2.start(now + 0.08); o2.stop(now + 0.9);
        // Shimmer: E6 — octave harmonic, barely there
        const o3 = ctx.createOscillator(); const g3 = ctx.createGain();
        o3.type = 'sine'; o3.frequency.value = 1318.5;
        g3.gain.setValueAtTime(0, now + 0.12);
        g3.gain.linearRampToValueAtTime(0.04, now + 0.14);
        g3.gain.exponentialRampToValueAtTime(0.001, now + 0.7);
        o3.connect(g3); g3.connect(ctx.destination);
        o3.start(now + 0.12); o3.stop(now + 0.8);
        setTimeout(() => ctx.close(), 1500);
      } catch (e) {}
    }
    setActiveModule(mod);
  };
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const activeModuleData = MODULES.find(m => m.id === activeModule);

  if (showSplash) return (<><GlobalCSS /><SplashScreen onComplete={() => setShowSplash(false)} /></>);

  const renderModule = () => {
    const mod = activeModuleData;
    if (!mod) return null;
    const apps = { sentinel: <SentinelApp />, ledger: <LedgerApp />, brief: <BriefApp />, roster: <RosterApp />, shield: <ShieldApp />, grounds: <GroundsApp /> };
   return (<><ModuleHeader module={mod} /><div className="slate-module-box">{apps[mod.id]}</div></>);
  };

  return (
    <div style={{ display: "flex", height: "100vh", width: "100vw", fontFamily: "'Inter', system-ui, sans-serif", background: C.bg, overflow: "hidden" }}>
      <GlobalCSS />
      <Sidebar activeModule={activeModule} setActiveModule={handleModuleClick} collapsed={sidebarCollapsed} setCollapsed={setSidebarCollapsed} />
      <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden", minWidth: 0, transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)" }}>
        <div style={{ height: 52, minHeight: 52, flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 28px", borderBottom: `1px solid ${C.chalk}`, background: C.white }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            {activeModule !== "dashboard" && activeModuleData ? (<><div style={{ width: 8, height: 8, borderRadius: "50%", background: activeModuleData.color, boxShadow: `0 0 8px ${activeModuleData.color}40` }} /><span style={{ fontSize: 13, fontWeight: 700, color: C.deep }}>Slate {activeModuleData.label}</span><span style={{ fontSize: 10, fontWeight: 600, color: C.light, textTransform: "uppercase", letterSpacing: "1px", marginLeft: 8 }}>{activeModuleData.category}</span></>) : (<span style={{ fontSize: 13, fontWeight: 700, color: C.deep }}>Slate Dashboard</span>)}
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
            
            <div style={{ width: 32, height: 32, borderRadius: "50%", background: `linear-gradient(135deg, ${C.brass}, ${C.deep})`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 700, color: C.white, boxShadow: `0 2px 8px ${C.brass}30` }}>MM</div>
          </div>
        </div>
        <div className="slate-scroll" style={{ flex: 1, overflow: "auto", padding: activeModule === "dashboard" ? "32px 36px" : "24px 28px", background: `linear-gradient(180deg, ${C.bg} 0%, #F0EDE6 100%)` }}>
          {activeModule === "dashboard" ? <Dashboard onModuleClick={handleModuleClick} /> : renderModule()}
        </div>
      </div>
    </div>
  );
}
