import { useState, useCallback } from 'react';
import { Bot } from 'lucide-react';
import { useRoster } from '../scholar-context/RosterDataContext';

const C = {
  card: '#161B22', border: '#30363D', text: '#E6EDF3',
  muted: '#8B949E', gold: '#F0B429', red: '#F85149', green: '#3FB950',
};

type Mode = 'forecast' | 'attrition' | 'funnel' | 'freeform';

interface Props {
  mode: Mode;
  autoRun?: boolean;
  compact?: boolean;
  question?: string;
}

export default function AIEnrollmentAdvisor({ mode, autoRun = false, compact = false, question }: Props) {
  const { data, networkTotals } = useRoster();
  const [response, setResponse] = useState('');
  const [loading, setLoading] = useState(false);
  const [freeform, setFreeform] = useState(question ?? '');
  const [ran, setRan] = useState(false);

  const buildPrompt = useCallback(() => {
    const hist = data.historical.map(h => `${h.year}: ${h.totalEnrolled.toLocaleString()} enrolled, ${h.yieldRate * 100}% yield, ${(h.attritionRate * 100).toFixed(1)}% attrition, $${h.revenuePerPupil.toLocaleString()}/pupil`).join('\n');
    const forecasts = data.forecasts.map(f => `${f.year}: Optimistic ${f.optimistic.toLocaleString()}, Probable ${f.probable.toLocaleString()}, Pessimistic ${f.pessimistic.toLocaleString()}`).join('\n');
    const atRisk = data.campuses.filter(c => c.attrition > 0.038 || (c.enrolled / c.capacity) < 0.90).map(c => `${c.short}: ${(c.enrolled/c.capacity*100).toFixed(0)}% utilization, ${(c.attrition*100).toFixed(1)}% attrition`).join('\n');

    const context = `
NOBLE SCHOOLS — ENROLLMENT INTELLIGENCE — ${data.sy}
Network: ${networkTotals.enrolled.toLocaleString()} enrolled / ${networkTotals.capacity.toLocaleString()} capacity (${networkTotals.utilizationPct.toFixed(1)}% utilization)
Target: ${data.targetEnrollment.toLocaleString()} | Gap: ${(networkTotals.enrolled - data.targetEnrollment).toLocaleString()}
Applications: ${networkTotals.applied.toLocaleString()} | Accepted: ${networkTotals.accepted.toLocaleString()} | Avg Yield: ${(networkTotals.avgYield * 100).toFixed(1)}%
Avg Attrition: ${(networkTotals.avgAttrition * 100).toFixed(1)}% | Revenue/Pupil: $${data.revenuePerPupil.toLocaleString()}

HISTORICAL TREND:
${hist}

FORECAST SCENARIOS:
${forecasts}

AT-RISK CAMPUSES:
${atRisk || 'None identified'}
`;

    if (mode === 'forecast') return `${context}\n\nYou are an enrollment strategist advising the Veritas Charter Schools leadership team. Based on historical trends and current data, provide a sharp forecast analysis. Cover: (1) What the trajectory tells us about SY27 enrollment probability, (2) Which scenario — optimistic, probable, or pessimistic — current momentum most supports and why, (3) What the revenue implications are of each scenario, (4) What the 2-3 highest-leverage actions are to close any enrollment gap. Under 220 words. Be specific with numbers. No platitudes.`;

    if (mode === 'attrition') return `${context}\n\nAnalyze the attrition picture for Veritas Charter Schools. Cover: (1) Which campuses have the highest attrition risk and what it costs in students and dollars, (2) What the network-wide attrition trend suggests about retention strategy, (3) What a 1 percentage point reduction in network attrition would mean in students and revenue, (4) Which campuses should be prioritized for intervention. Under 200 words. Be specific with numbers.`;

    if (mode === 'funnel') return `${context}\n\nAnalyze the enrollment funnel — applications, acceptance, and yield. Cover: (1) Where the biggest leakage in the funnel is, (2) Which campuses have the strongest and weakest yield and what that signals, (3) What a 5-point improvement in network yield would mean in students and revenue, (4) One concrete recommendation for improving funnel conversion. Under 200 words. Be specific.`;

    return `${context}\n\nQuestion: ${freeform}\n\nAnswer directly and specifically. Reference actual numbers from the data above. No hedging, no caveats — give a real answer. Under 200 words.`;
  }, [data, networkTotals, mode, freeform]);

  const analyze = useCallback(async () => {
    setLoading(true);
    setResponse('');
    setRan(true);
    try {
      const res = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: 'claude-sonnet-4-20250514',
          max_tokens: 1000,
          messages: [{ role: 'user', content: buildPrompt() }],
        }),
      });
      const json = await res.json();
      const text = json.content?.map((b: { type: string; text?: string }) => b.type === 'text' ? b.text : '').join('') ?? 'No response.';
      setResponse(text);
    } catch {
      setResponse('Analysis unavailable. Check connection.');
    } finally {
      setLoading(false);
    }
  }, [buildPrompt]);

  const modeLabels: Record<Mode, string> = {
    forecast: 'Enrollment Forecast',
    attrition: 'Attrition Risk Analysis',
    funnel: 'Funnel Intelligence',
    freeform: 'Ask a Question',
  };

  return (
    <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 12, padding: compact ? 16 : 20, marginTop: 20 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
        <Bot size={16} color={C.gold} />
        <span style={{ fontSize: 13, fontWeight: 700, color: C.text }}>{modeLabels[mode]}</span>
        {ran && !loading && (
          <button onClick={analyze} style={{ marginLeft: 'auto', fontSize: 11, color: C.muted, background: 'none', border: `1px solid ${C.border}`, borderRadius: 6, padding: '3px 10px', cursor: 'pointer' }}>
            Re-analyze
          </button>
        )}
      </div>

      {mode === 'freeform' && (
        <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
          <input
            value={freeform}
            onChange={e => setFreeform(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && freeform.trim() && analyze()}
            placeholder="e.g. What happens if yield drops 5%? Which campus is most at risk?"
            style={{
              flex: 1, padding: '9px 14px', borderRadius: 8, border: `1px solid ${C.border}`,
              background: '#0D1117', color: C.text, fontSize: 13, outline: 'none',
            }}
          />
          <button onClick={analyze} disabled={!freeform.trim() || loading} style={{
            padding: '9px 18px', borderRadius: 8, background: C.gold, color: '#000',
            fontWeight: 700, fontSize: 13, border: 'none', cursor: 'pointer',
          }}>Ask</button>
        </div>
      )}

      {!ran && mode !== 'freeform' && (
        <button onClick={analyze} style={{
          padding: '9px 20px', borderRadius: 8, background: C.gold, color: '#000',
          fontWeight: 700, fontSize: 13, border: 'none', cursor: 'pointer', marginBottom: 12,
        }}>Analyze</button>
      )}

      {loading && (
        <div style={{ fontSize: 13, color: C.muted, fontStyle: 'italic' }}>Analyzing enrollment data...</div>
      )}

      {response && (
        <div style={{ fontSize: 13, color: C.text, lineHeight: 1.7, whiteSpace: 'pre-wrap' }}>{response}</div>
      )}
    </div>
  );
}
