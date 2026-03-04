import { useEffect, useRef, useState } from 'react';

interface SplashScreenProps {
  onComplete: () => void;
}

export default function SplashScreen({ onComplete }: SplashScreenProps) {
  const [fadeOut, setFadeOut] = useState(false);
  const [showTagline, setShowTagline] = useState(false);
  const [showModules, setShowModules] = useState(false);
  const [showFooter, setShowFooter] = useState(false);
  const strokeRef = useRef<SVGTextElement>(null);
  const fillRef   = useRef<SVGTextElement>(null);
  const dotRef    = useRef<SVGCircleElement>(null);
  const trail1Ref = useRef<SVGCircleElement>(null);
  const trail2Ref = useRef<SVGCircleElement>(null);
  const trail3Ref = useRef<SVGCircleElement>(null);
  const svgRef    = useRef<SVGSVGElement>(null);
  const animRef   = useRef<number>(0);

  useEffect(() => {
    const tFade = setTimeout(() => setFadeOut(true), 5500);
    const tDone = setTimeout(() => onComplete(), 6500);
    return () => { clearTimeout(tFade); clearTimeout(tDone); cancelAnimationFrame(animRef.current); };
  }, [onComplete]);

  useEffect(() => {
    const stroke = strokeRef.current;
    const fill   = fillRef.current;
    const dot    = dotRef.current;
    const t1     = trail1Ref.current;
    const t2     = trail2Ref.current;
    const t3     = trail3Ref.current;
    const svg    = svgRef.current;
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
    const history: Array<{x:number;y:number}> = [];

    const run = setTimeout(() => {
      let startPt = { x: bbox.x, y: bbox.y + bbox.height * 0.5 };
      try { const p = stroke.getPointAtLength(0); startPt = { x: p.x, y: p.y }; } catch(e) {}

      dot.setAttribute('cx', String(startPt.x));
      dot.setAttribute('cy', String(startPt.y));
      dot.setAttribute('opacity', '1');
      t1?.setAttribute('opacity', '1');
      t2?.setAttribute('opacity', '1');
      t3?.setAttribute('opacity', '1');

      let start: number | null = null;
      let phase = 'write';
      let settleFromX = 0, settleFromY = 0;

      function frame(ts: number) {
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
          const h1 = history[5]  || { x: tipX, y: tipY };
          const h2 = history[11] || { x: tipX, y: tipY };
          const h3 = history[20] || { x: tipX, y: tipY };
          t1?.setAttribute('cx', String(h1.x)); t1?.setAttribute('cy', String(h1.y));
          t2?.setAttribute('cx', String(h2.x)); t2?.setAttribute('cy', String(h2.y));
          t3?.setAttribute('cx', String(h3.x)); t3?.setAttribute('cy', String(h3.y));

          if (t >= 1) { settleFromX = tipX; settleFromY = tipY; phase = 'settle'; start = ts; }
          animRef.current = requestAnimationFrame(frame);

        } else if (phase === 'settle') {
          const t = Math.min(elapsed / SETTLE, 1);
          const eas = easeOutBack(t);
          const cx = settleFromX + (dotFinalX - settleFromX) * eas;
          const cy = settleFromY + (dotFinalY - settleFromY) * eas;
          dot.setAttribute('cx', String(cx)); dot.setAttribute('cy', String(cy));
          t1?.setAttribute('cx', String(cx)); t1?.setAttribute('cy', String(cy));
          t2?.setAttribute('cx', String(cx)); t2?.setAttribute('cy', String(cy));
          t3?.setAttribute('cx', String(cx)); t3?.setAttribute('cy', String(cy));
          const to = Math.max(0, (1 - t) * 0.4);
          t1?.setAttribute('opacity', String(to));
          t2?.setAttribute('opacity', String(to * 0.6));
          t3?.setAttribute('opacity', String(to * 0.3));

          if (t >= 1) {
            t1?.setAttribute('opacity', '0'); t2?.setAttribute('opacity', '0'); t3?.setAttribute('opacity', '0');
            dot.setAttribute('cx', String(dotFinalX)); dot.setAttribute('cy', String(dotFinalY));
            fill.style.opacity = '1'; stroke.style.opacity = '0';
            spawnBurst(dotFinalX, dotFinalY, svg);
            setTimeout(() => setShowTagline(true), 220);
            setTimeout(() => setShowModules(true), 480);
            setTimeout(() => setShowFooter(true), 800);
          } else {
            animRef.current = requestAnimationFrame(frame);
          }
        }
      }
      animRef.current = requestAnimationFrame(frame);
    }, DELAY);

    return () => clearTimeout(run);
  }, []);

  function spawnBurst(x: number, y: number, svg: SVGSVGElement) {
    for (let i = 0; i < 12; i++) {
      const c = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
      const angle = (i / 12) * Math.PI * 2;
      const dist  = 12 + Math.random() * 10;
      c.setAttribute('cx', String(x)); c.setAttribute('cy', String(y));
      c.setAttribute('r', String(1.4 + Math.random())); c.setAttribute('fill', '#c9943a');
      svg.appendChild(c);
      c.animate([
        { opacity: '0.9', transform: 'translate(0,0)' },
        { opacity: '0',   transform: `translate(${Math.cos(angle)*dist}px,${Math.sin(angle)*dist}px)` }
      ], { duration: 550, delay: i * 16, easing: 'ease-out', fill: 'forwards' });
      setTimeout(() => { try { c.remove(); } catch(e) {} }, 1000);
    }
  }

  const easeInOutCubic = (t: number) => t < 0.5 ? 4*t*t*t : 1 - Math.pow(-2*t+2,3)/2;
  const easeOutBack = (t: number) => { const c1=1.70158,c3=c1+1; return 1+c3*Math.pow(t-1,3)+c1*Math.pow(t-1,2); };

  const modules = [
    { label: 'Watch',   color: '#e05c52', glow: 'rgba(224,92,82,0.5)'  },
    { label: 'Ledger',  color: '#c9943a', glow: 'rgba(201,148,58,0.5)' },
    { label: 'Roster',  color: '#4a7fb5', glow: 'rgba(74,127,181,0.5)' },
    { label: 'Brief',   color: '#3a9e6e', glow: 'rgba(58,158,110,0.5)' },
    { label: 'Guard',   color: '#7b5ea7', glow: 'rgba(123,94,167,0.5)' },
    { label: 'Grounds', color: '#c87533', glow: 'rgba(200,117,51,0.5)' },
  ];

  return (
    <div style={{
      position:'fixed',inset:0,zIndex:9999,background:'#181e24',
      display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',
      opacity:fadeOut?0:1,transform:fadeOut?'scale(1.02)':'scale(1)',
      filter:fadeOut?'blur(3px)':'blur(0)',overflow:'hidden',
      transition:'opacity 1.0s ease-in-out,transform 1.0s ease-in-out,filter 1.0s ease-in-out',
    }}>
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
        {modules.map(m => (
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
}
