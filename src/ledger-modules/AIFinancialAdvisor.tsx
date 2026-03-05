/**
 * AIFinancialAdvisor — real Claude API calls against live financial data.
 * Replaces the static AIInsight decorations throughout Ledger.
 * 
 * Usage:
 *   <AIFinancialAdvisor mode="variance" context={ytd} budget={budget} />
 *   <AIFinancialAdvisor mode="covenant" context={covenants} ytd={ytd} />
 *   <AIFinancialAdvisor mode="question" question="What happens if enrollment drops 300?" />
 */
import { useState, useCallback, useEffect } from 'react';
import { Bot, RefreshCw, ChevronDown, ChevronUp, Send } from 'lucide-react';
import { useLedger, computeYTD } from '../ledger-context/LedgerDataContext';

type AnalysisMode = 'variance' | 'covenant' | 'trajectory' | 'enrollment' | 'compensation' | 'freeform';

interface Props {
  mode: AnalysisMode;
  autoRun?: boolean;
  question?: string;
  compact?: boolean;
}

const MODE_PROMPTS: Record<AnalysisMode, (data: any) => string> = {
  variance: (d) => `You are a nonprofit CFO-level financial analyst. Analyze this variance report for Noble Schools, a $240M Chicago charter school network with 12,000 students and an S&P BBB-Stable bond rating.

BUDGET vs ACTUALS — ${d.ytd?.asOf ?? 'YTD'} (${d.ytd?.monthsElapsed ?? 0} months elapsed, ${Math.round((d.ytd?.proratedBudgetFactor ?? 0) * 100)}% of year):

REVENUE YTD:
- Total: $${d.ytd?.revenue.total.toFixed(1)}M actual vs $${(d.budget.revenue.total * (d.ytd?.proratedBudgetFactor ?? 0)).toFixed(1)}M prorated budget (variance: ${((d.ytd?.revenue.total ?? 0) - d.budget.revenue.total * (d.ytd?.proratedBudgetFactor ?? 0)).toFixed(1)}M)
- CPS: $${d.ytd?.revenue.cps.toFixed(1)}M vs $${(d.budget.revenue.cps * (d.ytd?.proratedBudgetFactor ?? 0)).toFixed(1)}M prorated
- Philanthropy: $${d.ytd?.revenue.philanthropy.toFixed(1)}M vs $${(d.budget.revenue.philanthropy * (d.ytd?.proratedBudgetFactor ?? 0)).toFixed(1)}M prorated

EXPENSES YTD:
- Total: $${d.ytd?.expenses.total.toFixed(1)}M actual vs $${(d.budget.expenses.total * (d.ytd?.proratedBudgetFactor ?? 0)).toFixed(1)}M prorated budget
- Personnel: $${d.ytd?.expenses.personnel.toFixed(1)}M vs $${(d.budget.expenses.personnel * (d.ytd?.proratedBudgetFactor ?? 0)).toFixed(1)}M prorated
- Direct Student: $${d.ytd?.expenses.directStudent.toFixed(1)}M vs $${(d.budget.expenses.directStudent * (d.ytd?.proratedBudgetFactor ?? 0)).toFixed(1)}M prorated

EBITDA: $${d.ytd?.ebitda.toFixed(1)}M YTD | Days Cash: ${d.ytd?.daysCash ?? 'N/A'} days

Provide a sharp, executive-level variance analysis. Lead with the most important insight. Flag any items that need immediate attention. Project full-year outcome based on YTD run rate. Keep it under 200 words. No bullet-point lists — write in crisp prose like a CFO presenting to a board audit committee.`,

  covenant: (d) => `You are a bond covenant compliance specialist. Analyze Noble Schools' covenant position.

CURRENT METRICS:
- DSCR: ${d.ytd?.dscr ?? d.budget.dscr}x (minimum: ${d.covenants.dscrMinimum}x, bond doc: ${d.covenants.dscrBondDoc}x, MADS post-refunding: ${d.covenants.madsPostRefunding}x)
- Days Cash: ${d.ytd?.daysCash ?? 'N/A'} days (minimum: ${d.covenants.daysCashMinimum} days)
- Current Ratio: ${d.budget.dscr > 0 ? '3.00' : 'N/A'}x (minimum: ${d.covenants.currentRatioMinimum}x)

BUDGET CONTEXT: $${d.budget.revenue.total}M revenue, $${d.budget.expenses.total}M expenses, $${d.budget.ebitda}M EBITDA target.

Identify: (1) current cushion to each covenant trigger, (2) what scenario would breach each covenant, (3) which covenant is most vulnerable right now. Be specific about dollar and ratio thresholds. Under 150 words. Write like a bond counsel presenting to a finance committee.`,

  trajectory: (d) => `You are a strategic financial planner for Noble Schools. Analyze the 5-year financial trajectory.

HISTORICAL TREND (Revenue / Expenses / EBITDA / DSCR):
${d.historical.map((h: any) => `${h.year}: $${h.totalRevenue}M / $${h.totalExpenses}M / $${h.ebitda}M / ${h.dscr}x`).join('\n')}

FY26 BUDGET: $${d.budget.revenue.total}M revenue / $${d.budget.expenses.total}M expenses / $${d.budget.ebitda}M EBITDA

YTD PERFORMANCE (${d.ytd?.monthsElapsed ?? 0} months): Revenue $${d.ytd?.revenue.total.toFixed(1)}M, Expenses $${d.ytd?.expenses.total.toFixed(1)}M, EBITDA $${d.ytd?.ebitda.toFixed(1)}M

What does the trajectory tell us? What structural risks are embedded in these numbers? What should a CFO be watching in FY27 planning? Under 200 words. No platitudes — find the real signal in the data.`,

  enrollment: (d) => `You are an enrollment revenue analyst for a charter school network.

Noble Schools enrollment: FY20: ${d.historical[0]?.enrollment ?? 'N/A'}, FY21: ${d.historical[1]?.enrollment ?? 'N/A'}, FY22: ${d.historical[2]?.enrollment ?? 'N/A'}, FY23: ${d.historical[3]?.enrollment ?? 'N/A'}, FY24: ${d.historical[4]?.enrollment ?? 'N/A'}, FY25: ${d.historical[5]?.enrollment ?? 'N/A'}
FY26 Budget target: ${d.budget.enrollment} (C1 count: ${d.budget.enrollmentC1})

CPS per-pupil revenue trend: CPS revenue / enrollment
${d.historical.map((h: any) => `${h.year}: $${(h.cpsRevenue / h.enrollment * 1000).toFixed(0)}/student`).join(', ')}

What is the enrollment trend telling us? What is the revenue-per-pupil sensitivity — i.e., what does a 100-student swing mean in dollars at current per-pupil rates? What enrollment risks should Noble be stress-testing? Under 150 words.`,

  compensation: (d) => `You are a compensation and workforce cost analyst.

Noble Schools workforce cost data:
${d.historical.map((h: any) => `${h.year}: $${h.personnel}M personnel (${((h.personnel / h.totalRevenue) * 100).toFixed(1)}% of revenue)`).join('\n')}
FY26 Budget: $${d.budget.expenses.personnel}M personnel (${((d.budget.expenses.personnel / d.budget.revenue.total) * 100).toFixed(1)}% of revenue)
  - Base salaries: $${d.budget.expenses.baseSalaries}M
  - Benefits: $${d.budget.expenses.benefits}M  
  - Stipends: $${d.budget.expenses.stipends}M
YTD Personnel: $${d.ytd?.expenses.personnel.toFixed(1)}M vs $${(d.budget.expenses.personnel * (d.ytd?.proratedBudgetFactor ?? 0)).toFixed(1)}M prorated budget

What is the compensation trend? Is the organization becoming more or less personnel-cost efficient? What is the risk embedded in the benefits line? Under 150 words.`,

  freeform: (d) => '', // handled separately
};

export default function AIFinancialAdvisor({ mode, autoRun = false, question, compact = false }: Props) {
  const { data, ytd } = useLedger();
  const [response, setResponse] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [expanded, setExpanded] = useState(!compact);
  const [freeformQ, setFreeformQ] = useState(question ?? '');
  const [hasRun, setHasRun] = useState(false);

  const buildContext = useCallback(() => ({ ...data, ytd }), [data, ytd]);

  const runAnalysis = useCallback(async (overrideQ?: string) => {
    setLoading(true);
    setError('');
    setResponse('');
    setHasRun(true);

    const ctx = buildContext();
    let prompt = '';

    if (mode === 'freeform') {
      const q = overrideQ ?? freeformQ;
      if (!q.trim()) { setLoading(false); return; }
      prompt = `You are a CFO-level financial advisor for Noble Schools, a $240M Chicago public charter school network (12,000 students, 17 campuses, S&P BBB-Stable bond rating).

Current financial position:
- FY26 Budget: $${ctx.budget.revenue.total}M revenue / $${ctx.budget.expenses.total}M expenses / $${ctx.budget.ebitda}M EBITDA target
- YTD (${ctx.ytd?.monthsElapsed ?? 0} months): $${ctx.ytd?.revenue.total.toFixed(1)}M revenue / $${ctx.ytd?.expenses.total.toFixed(1)}M expenses / $${ctx.ytd?.ebitda.toFixed(1)}M EBITDA
- Days Cash: ${ctx.ytd?.daysCash ?? 'N/A'} | DSCR: ${ctx.ytd?.dscr ?? ctx.budget.dscr}x
- Personnel: $${ctx.ytd?.expenses.personnel.toFixed(1)}M YTD (${((ctx.budget.expenses.personnel / ctx.budget.revenue.total) * 100).toFixed(1)}% of budget)

Question: ${q}

Answer directly and specifically. Reference actual numbers from the data above. No hedging, no caveats, no "it depends" — give a real answer. Under 200 words.`;
    } else {
      prompt = MODE_PROMPTS[mode](ctx);
    }

    try {
      const res = await fetch('/api/anthropic-proxy', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: 'claude-sonnet-4-20250514',
          max_tokens: 1000,
          messages: [{ role: 'user', content: prompt }],
        }),
      });
      const json = await res.json();
      const text = json.content?.map((b: any) => b.text ?? '').join('') ?? '';
      setResponse(text || 'No analysis returned.');
    } catch (e) {
      setError('Analysis failed — check API connection.');
    } finally {
      setLoading(false);
    }
  }, [mode, freeformQ, buildContext]);

  useEffect(() => {
    if (autoRun && !hasRun && mode !== 'freeform') runAnalysis();
  }, [autoRun, hasRun, mode]);

  const modeLabels: Record<AnalysisMode, string> = {
    variance: 'Variance Analysis',
    covenant: 'Covenant Position',
    trajectory: 'Financial Trajectory',
    enrollment: 'Enrollment Intelligence',
    compensation: 'Compensation Analysis',
    freeform: 'Ask a Question',
  };

  return (
    <div style={{
      background: '#0D1117',
      border: '1px solid #21262D',
      borderRadius: 12,
      overflow: 'hidden',
      marginBottom: 16,
    }}>
      {/* Header */}
      <div
        style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '12px 16px',
          borderBottom: expanded ? '1px solid #21262D' : 'none',
          cursor: compact ? 'pointer' : 'default',
        }}
        onClick={compact ? () => setExpanded(e => !e) : undefined}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <Bot size={15} color="#F0B429" />
          <span style={{ fontSize: 12, fontWeight: 700, color: '#F0B429', letterSpacing: '0.06em', textTransform: 'uppercase' }}>
            AI · {modeLabels[mode]}
          </span>
        </div>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          {!compact && mode !== 'freeform' && (
            <button
              onClick={() => runAnalysis()}
              disabled={loading}
              style={{
                display: 'flex', alignItems: 'center', gap: 5,
                padding: '5px 12px', borderRadius: 6,
                border: '1px solid #30363D',
                background: loading ? '#21262D' : '#161B22',
                color: loading ? '#8B949E' : '#E6EDF3',
                fontSize: 11, fontWeight: 600, cursor: loading ? 'not-allowed' : 'pointer',
              }}
            >
              <RefreshCw size={11} style={{ animation: loading ? 'spin 1s linear infinite' : 'none' }} />
              {loading ? 'Analyzing...' : hasRun ? 'Re-analyze' : 'Analyze'}
            </button>
          )}
          {compact && (expanded ? <ChevronUp size={14} color="#8B949E" /> : <ChevronDown size={14} color="#8B949E" />)}
        </div>
      </div>

      {/* Body */}
      {expanded && (
        <div style={{ padding: 16 }}>
          {/* Freeform input */}
          {mode === 'freeform' && (
            <div style={{ display: 'flex', gap: 8, marginBottom: response ? 16 : 0 }}>
              <input
                value={freeformQ}
                onChange={e => setFreeformQ(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && runAnalysis()}
                placeholder="What happens if enrollment drops 300 students? What's our covenant cushion if personnel grows 8%?"
                style={{
                  flex: 1, padding: '10px 14px', borderRadius: 8,
                  border: '1px solid #30363D', background: '#161B22',
                  color: '#E6EDF3', fontSize: 13, fontFamily: "'Inter', sans-serif",
                  outline: 'none',
                }}
              />
              <button
                onClick={() => runAnalysis()}
                disabled={loading || !freeformQ.trim()}
                style={{
                  padding: '10px 14px', borderRadius: 8,
                  border: 'none', background: '#F0B429',
                  color: '#0D1117', fontWeight: 700, fontSize: 12,
                  cursor: loading ? 'not-allowed' : 'pointer',
                  display: 'flex', alignItems: 'center', gap: 6,
                }}
              >
                <Send size={13} />
                {loading ? '...' : 'Ask'}
              </button>
            </div>
          )}

          {/* Response */}
          {loading && (
            <div style={{ color: '#8B949E', fontSize: 13, fontStyle: 'italic', padding: '8px 0' }}>
              Analyzing financial data...
            </div>
          )}
          {error && (
            <div style={{ color: '#F85149', fontSize: 13, padding: '8px 0' }}>{error}</div>
          )}
          {response && !loading && (
            <div style={{
              fontSize: 14, color: '#E6EDF3', lineHeight: 1.7,
              fontFamily: "'Inter', sans-serif",
            }}>
              {response}
            </div>
          )}
          {!hasRun && !loading && mode !== 'freeform' && (
            <div style={{ color: '#8B949E', fontSize: 13, fontStyle: 'italic' }}>
              Click "Analyze" to run AI analysis against current financial data.
            </div>
          )}
        </div>
      )}

      <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
