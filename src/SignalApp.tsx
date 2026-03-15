// @ts-nocheck
import { useState, useEffect, useCallback, useRef } from "react";
import { buildNetworkSnapshot } from "./networkSnapshot";

const C = {
  carbon: "#121315", navy: "#0D1B2A", brass: "#B79145",
  paper: "#F7F5F1", white: "#FFFFFF", border: "#E5DDD5",
  gray: "#6B7280", red: "#EF4444", amber: "#F59E0B", green: "#10B981",
};

function RadarScope({ warnings, selected, onSelect }) {
  const canvasRef = useRef(null);
  const sweepRef = useRef(0);
  const rafRef = useRef(null);
  const dotsRef = useRef([]);

  useEffect(() => {
    const cx = 300; const cy = 300;
    const rings = { CRITICAL: 80, HIGH: 160, WATCH: 230 };
    const byRing = { CRITICAL: [], HIGH: [], WATCH: [] };
    warnings.forEach(w => byRing[w.severity]?.push(w));
    dotsRef.current = warnings.map(w => {
      const siblings = byRing[w.severity];
      const idx = siblings.indexOf(w);
      const total = Math.max(siblings.length, 1);
      const baseAngle = (idx / total) * Math.PI * 2 + (w.severity === "HIGH" ? 0.4 : w.severity === "WATCH" ? 0.8 : 0);
      const r = rings[w.severity] + (((idx * 17) % 20) - 10);
      return { w, x: cx + Math.cos(baseAngle) * r, y: cy + Math.sin(baseAngle) * r, glow: idx * 0.8 };
    });
  }, [warnings]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    const cx = 300; const cy = 300; const maxR = 260;

    const draw = () => {
      ctx.clearRect(0, 0, 600, 600);
      ctx.fillStyle = "#080C10";
      ctx.fillRect(0, 0, 600, 600);

      [80, 160, 230, 260].forEach((r, i) => {
        ctx.beginPath();
        ctx.arc(cx, cy, r, 0, Math.PI * 2);
        ctx.strokeStyle = i === 3 ? "rgba(183,145,69,0.3)" : "rgba(16,185,129,0.12)";
        ctx.lineWidth = i === 3 ? 1.5 : 0.5;
        ctx.stroke();
      });

      ctx.font = "9px Courier New";
      ctx.fillStyle = "rgba(16,185,129,0.35)";
      ctx.fillText("CRITICAL", cx + 4, cy - 76);
      ctx.fillText("HIGH", cx + 4, cy - 156);
      ctx.fillText("WATCH", cx + 4, cy - 226);

      ctx.beginPath();
      ctx.moveTo(cx - maxR, cy); ctx.lineTo(cx + maxR, cy);
      ctx.moveTo(cx, cy - maxR); ctx.lineTo(cx, cy + maxR);
      ctx.strokeStyle = "rgba(16,185,129,0.08)";
      ctx.lineWidth = 0.5; ctx.stroke();

      for (let i = 0; i < 36; i++) {
        const a = (i / 36) * Math.PI * 2;
        const inner = maxR - (i % 9 === 0 ? 12 : 6);
        ctx.beginPath();
        ctx.moveTo(cx + Math.cos(a) * inner, cy + Math.sin(a) * inner);
        ctx.lineTo(cx + Math.cos(a) * maxR, cy + Math.sin(a) * maxR);
        ctx.strokeStyle = "rgba(16,185,129,0.15)";
        ctx.lineWidth = 0.5; ctx.stroke();
      }

      sweepRef.current = (sweepRef.current + 0.008) % (Math.PI * 2);
      const sweep = sweepRef.current;

      for (let i = 0; i < 60; i++) {
        const trailAngle = sweep - (i / 60) * 1.2;
        const alpha = (1 - i / 60) * 0.18;
        ctx.beginPath();
        ctx.moveTo(cx, cy);
        ctx.arc(cx, cy, maxR, trailAngle, trailAngle + 0.022);
        ctx.lineTo(cx, cy);
        ctx.fillStyle = "rgba(16,185,129," + alpha + ")";
        ctx.fill();
      }

      ctx.beginPath();
      ctx.moveTo(cx, cy);
      ctx.lineTo(cx + Math.cos(sweep) * maxR, cy + Math.sin(sweep) * maxR);
      const lineGrad = ctx.createLinearGradient(cx, cy, cx + Math.cos(sweep) * maxR, cy + Math.sin(sweep) * maxR);
      lineGrad.addColorStop(0, "rgba(16,185,129,0)");
      lineGrad.addColorStop(1, "rgba(16,185,129,0.9)");
      ctx.strokeStyle = lineGrad; ctx.lineWidth = 1.5; ctx.stroke();

      ctx.beginPath();
      ctx.arc(cx, cy, 4, 0, Math.PI * 2);
      ctx.fillStyle = "rgba(16,185,129,0.8)"; ctx.fill();

      dotsRef.current.forEach(dot => {
        const { w, x, y } = dot;
        dot.glow += 0.03;
        const isSelected = selected && selected.patternId === w.patternId && selected.campus === w.campus;
        const dotAngle = Math.atan2(y - cy, x - cx);
        const nd = ((dotAngle % (Math.PI * 2)) + Math.PI * 2) % (Math.PI * 2);
        const ns = ((sweep % (Math.PI * 2)) + Math.PI * 2) % (Math.PI * 2);
        const diff = Math.abs(ns - nd);
        const isLit = diff < 0.15 || diff > Math.PI * 2 - 0.15;
        const baseColor = w.severity === "CRITICAL" ? [239, 68, 68] : w.severity === "HIGH" ? [245, 158, 11] : [16, 185, 129];
        const glowPulse = isSelected ? 1 : (0.5 + Math.sin(dot.glow) * 0.3);
        const alpha = isLit ? 1 : glowPulse;
        const radius = isSelected ? 10 : w.severity === "CRITICAL" ? 7 : 5;

        if (w.severity === "CRITICAL" || isSelected) {
          ctx.beginPath();
          ctx.arc(x, y, radius + (isSelected ? 8 : 5), 0, Math.PI * 2);
          ctx.fillStyle = "rgba(" + baseColor[0] + "," + baseColor[1] + "," + baseColor[2] + "," + (alpha * 0.15) + ")";
          ctx.fill();
        }

        ctx.beginPath();
        ctx.arc(x, y, radius, 0, Math.PI * 2);
        ctx.fillStyle = "rgba(" + baseColor[0] + "," + baseColor[1] + "," + baseColor[2] + "," + alpha + ")";
        ctx.fill();

        if (isSelected) {
          ctx.beginPath();
          ctx.arc(x, y, radius + 4, 0, Math.PI * 2);
          ctx.strokeStyle = "rgba(" + baseColor[0] + "," + baseColor[1] + "," + baseColor[2] + ",0.6)";
          ctx.lineWidth = 1.5; ctx.stroke();
        }

        if (isSelected || w.severity === "CRITICAL") {
          ctx.font = isSelected ? "bold 9px Courier New" : "8px Courier New";
          ctx.fillStyle = "rgba(" + baseColor[0] + "," + baseColor[1] + "," + baseColor[2] + "," + (isSelected ? 1 : 0.7) + ")";
          const label = w.campus.replace(" Academy", "").replace("Veritas ", "");
          ctx.fillText(label, x + radius + 3, y + 3);
        }
      });

      ctx.beginPath();
      ctx.arc(cx, cy, maxR, 0, Math.PI * 2);
      ctx.strokeStyle = "rgba(183,145,69,0.4)"; ctx.lineWidth = 1; ctx.stroke();

      const now = new Date();
      ctx.font = "9px Courier New";
      ctx.fillStyle = "rgba(16,185,129,0.35)";
      ctx.fillText(now.toTimeString().slice(0,8) + " · SLATE SIGNAL", cx - 78, 580);

      rafRef.current = requestAnimationFrame(draw);
    };

    rafRef.current = requestAnimationFrame(draw);
    return () => { if (rafRef.current) cancelAnimationFrame(rafRef.current); };
  }, [warnings, selected]);

  const handleClick = useCallback((e) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const scaleX = 600 / rect.width;
    const scaleY = 600 / rect.height;
    const mx = (e.clientX - rect.left) * scaleX;
    const my = (e.clientY - rect.top) * scaleY;
    let closest = null; let minDist = 20;
    dotsRef.current.forEach(dot => {
      const dist = Math.sqrt((dot.x - mx) ** 2 + (dot.y - my) ** 2);
      if (dist < minDist) { minDist = dist; closest = dot; }
    });
    if (closest) onSelect(closest.w);
  }, [onSelect]);

  return (
    <canvas ref={canvasRef} width={600} height={600}
      onClick={handleClick}
      style={{ width: "100%", maxWidth: 500, cursor: "crosshair", borderRadius: 12 }} />
  );
}

export default function SignalApp() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [selected, setSelected] = useState(null);

  const runSignal = useCallback(async () => {
    setLoading(true); setError(""); setData(null); setSelected(null);
    const snap = buildNetworkSnapshot();
    try {
      const res = await fetch("/api/anthropic-proxy", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "claude-sonnet-4-20250514",
          max_tokens: 3000,
          system: "You are Slate Signal, an early warning intelligence engine for charter school networks. Detect converging patterns that precede institutional decline, financial crisis, talent loss, and authorizer risk. Return ONLY valid JSON: { networkHealth: CRITICAL|ELEVATED|STABLE, networkSummary: string, warnings: [{ patternId, patternName, campus, severity: CRITICAL|HIGH|WATCH, headline, signals: string[], whatSlateSees, historicalContext, intervention, daysToAct }] }. Generate 5-8 warnings mixing campus-level and network-level patterns.",
          messages: [{ role: "user", content: "Analyze Veritas Charter Schools (10 campuses, Chicago, CPS authorizer):\n\n" + JSON.stringify(snap, null, 2) + "\n\nDetect all active early warning patterns across campus instability, financial fragility, talent flight, authorizer risk, and community trust erosion." }],
        }),
      });
      const d = await res.json();
      const raw = d.content?.find((b) => b.type === "text")?.text || "";
      const clean = raw.replace(/```json\s*|```\s*/g, "").trim();
      const parsed = JSON.parse(clean);
      setData({ ...parsed, generatedAt: new Date().toISOString() });
      if (parsed.warnings?.length > 0) setSelected(parsed.warnings[0]);
    } catch (err) { setError("Signal analysis failed: " + String(err)); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { runSignal(); }, []);

  const healthColor = (h) => h === "CRITICAL" ? C.red : h === "ELEVATED" ? C.amber : C.green;
  const sevColor = (s) => s === "CRITICAL" ? C.red : s === "HIGH" ? C.amber : C.green;

  return (
    <div style={{ fontFamily: "Courier New, monospace", background: "#080C10", minHeight: "100vh", color: C.white }}>
      <div style={{ padding: "20px 32px 16px", borderBottom: "1px solid rgba(16,185,129,0.15)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div>
          <div style={{ fontSize: 10, fontWeight: 700, color: "#10B981", letterSpacing: "0.3em", textTransform: "uppercase", marginBottom: 4 }}>◈ SLATE SIGNAL · EARLY WARNING SYSTEM</div>
          <div style={{ fontSize: 18, fontWeight: 700, color: C.white, letterSpacing: "0.05em" }}>Veritas Charter Schools</div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          {data && <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <div style={{ width: 8, height: 8, borderRadius: "50%", background: healthColor(data.networkHealth), boxShadow: "0 0 8px " + healthColor(data.networkHealth) }} />
            <div style={{ fontSize: 11, color: healthColor(data.networkHealth), letterSpacing: "0.15em", textTransform: "uppercase" }}>{data.networkHealth}</div>
          </div>}
          <button onClick={runSignal} disabled={loading} style={{ padding: "6px 16px", borderRadius: 4, background: "rgba(16,185,129,0.1)", color: "#10B981", border: "1px solid rgba(16,185,129,0.3)", fontSize: 10, fontWeight: 700, cursor: "pointer", letterSpacing: "0.1em", textTransform: "uppercase" }}>
            {loading ? "SCANNING..." : "↻ RESCAN"}
          </button>
        </div>
      </div>

      {loading && <div style={{ padding: "80px 32px", textAlign: "center" }}>
        <div style={{ fontSize: 12, color: "#10B981", letterSpacing: "0.2em", marginBottom: 12 }}>SCANNING NETWORK...</div>
        <div style={{ fontSize: 10, color: "rgba(16,185,129,0.4)", letterSpacing: "0.12em", lineHeight: 2 }}>
          ANALYZING ENROLLMENT TRAJECTORIES · CHECKING HR SIGNALS<br/>
          READING FINANCIAL PATTERNS · ASSESSING AUTHORIZER RISK<br/>
          MAPPING SAFETY PROXIMITY · DETECTING CONVERGENCE
        </div>
      </div>}

      {error && !loading && <div style={{ margin: 24, padding: "12px 16px", border: "1px solid rgba(239,68,68,0.3)", borderRadius: 4, color: C.red, fontSize: 11 }}>{error}</div>}

      {data && !loading && (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", height: "calc(100vh - 72px)" }}>
          <div style={{ padding: "24px 16px 24px 32px", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", borderRight: "1px solid rgba(16,185,129,0.1)" }}>
            <RadarScope warnings={data.warnings} selected={selected} onSelect={setSelected} />
            <div style={{ marginTop: 16, display: "flex", gap: 20, justifyContent: "center" }}>
              {[["CRITICAL", C.red], ["HIGH", C.amber], ["WATCH", C.green]].map(([label, color]) => (
                <div key={label} style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  <div style={{ width: 8, height: 8, borderRadius: "50%", background: color }} />
                  <div style={{ fontSize: 9, color: color, letterSpacing: "0.12em" }}>{label} ({data.warnings.filter(w => w.severity === label).length})</div>
                </div>
              ))}
            </div>
            <div style={{ marginTop: 12, fontSize: 9, color: "rgba(16,185,129,0.3)", letterSpacing: "0.1em" }}>CLICK ANY SIGNAL FOR FULL ANALYSIS</div>
          </div>

          <div style={{ padding: "24px 32px", overflowY: "auto" }}>
            <div style={{ marginBottom: 20, padding: "12px 14px", border: "1px solid rgba(16,185,129,0.2)", borderRadius: 4, background: "rgba(16,185,129,0.04)" }}>
              <div style={{ fontSize: 9, color: "#10B981", letterSpacing: "0.2em", textTransform: "uppercase", marginBottom: 6 }}>NETWORK INTELLIGENCE</div>
              <div style={{ fontSize: 12, color: "rgba(255,255,255,0.7)", lineHeight: 1.8 }}>{data.networkSummary}</div>
            </div>

            {selected ? (
              <div>
                <div style={{ marginBottom: 14 }}>
                  <div style={{ display: "flex", gap: 8, marginBottom: 8 }}>
                    <span style={{ fontSize: 9, color: sevColor(selected.severity), border: "1px solid " + sevColor(selected.severity), padding: "2px 8px", borderRadius: 2, letterSpacing: "0.12em" }}>{selected.severity}</span>
                    <span style={{ fontSize: 9, color: C.brass, border: "1px solid " + C.brass + "40", padding: "2px 8px", borderRadius: 2 }}>{selected.campus}</span>
                  </div>
                  <div style={{ fontSize: 15, fontWeight: 700, color: C.white, lineHeight: 1.4 }}>{selected.headline}</div>
                  <div style={{ fontSize: 10, color: "rgba(255,255,255,0.4)", marginTop: 4 }}>{selected.patternName}</div>
                </div>

                <div style={{ marginBottom: 14 }}>
                  <div style={{ fontSize: 9, color: "#10B981", letterSpacing: "0.2em", textTransform: "uppercase", marginBottom: 6 }}>ACTIVE SIGNALS</div>
                  <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                    {selected.signals?.map((s, i) => <span key={i} style={{ fontSize: 9, padding: "3px 8px", border: "1px solid " + sevColor(selected.severity) + "40", color: sevColor(selected.severity), borderRadius: 2 }}>{s}</span>)}
                  </div>
                </div>

                <div style={{ marginBottom: 14, padding: "12px 14px", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 4 }}>
                  <div style={{ fontSize: 9, color: "#10B981", letterSpacing: "0.2em", textTransform: "uppercase", marginBottom: 6 }}>WHAT SIGNAL SEES</div>
                  <div style={{ fontSize: 12, color: "rgba(255,255,255,0.75)", lineHeight: 1.8 }}>{selected.whatSlateSees}</div>
                </div>

                <div style={{ marginBottom: 14, padding: "12px 14px", border: "1px solid " + C.amber + "30", borderRadius: 4, background: C.amber + "08" }}>
                  <div style={{ fontSize: 9, color: C.amber, letterSpacing: "0.2em", textTransform: "uppercase", marginBottom: 6 }}>HISTORICAL CONTEXT</div>
                  <div style={{ fontSize: 12, color: C.amber + "CC", lineHeight: 1.8 }}>{selected.historicalContext}</div>
                </div>

                <div style={{ padding: "12px 14px", border: "1px solid " + C.green + "30", borderRadius: 4, background: C.green + "08" }}>
                  <div style={{ fontSize: 9, color: C.green, letterSpacing: "0.2em", textTransform: "uppercase", marginBottom: 6 }}>30-DAY INTERVENTION · ACT WITHIN {selected.daysToAct} DAYS</div>
                  <div style={{ fontSize: 12, color: C.green + "CC", lineHeight: 1.8 }}>{selected.intervention}</div>
                </div>

                <div style={{ marginTop: 20, borderTop: "1px solid rgba(16,185,129,0.1)", paddingTop: 14 }}>
                  <div style={{ fontSize: 9, color: "rgba(16,185,129,0.4)", letterSpacing: "0.2em", marginBottom: 10 }}>ALL SIGNALS</div>
                  {data.warnings.map((w, i) => (
                    <div key={i} onClick={() => setSelected(w)} style={{ display: "flex", gap: 10, padding: "8px 0", borderBottom: "1px solid rgba(255,255,255,0.04)", cursor: "pointer", opacity: selected === w ? 1 : 0.5 }}>
                      <div style={{ width: 6, height: 6, borderRadius: "50%", background: sevColor(w.severity), marginTop: 4, flexShrink: 0 }} />
                      <div>
                        <div style={{ fontSize: 11, color: C.white, lineHeight: 1.4 }}>{w.headline}</div>
                        <div style={{ fontSize: 9, color: "rgba(255,255,255,0.3)", marginTop: 2 }}>{w.campus} · {w.patternName}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div style={{ textAlign: "center", padding: "40px 0", color: "rgba(16,185,129,0.3)", fontSize: 11, letterSpacing: "0.15em" }}>SELECT A SIGNAL ON THE RADAR</div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
