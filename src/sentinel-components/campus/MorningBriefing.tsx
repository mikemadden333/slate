/**
 * MorningBriefing — "Good Morning, [Campus Name]"
 *
 * The most important 30 seconds in a principal's day.
 * Written as a trusted colleague — warm, direct, specific, human.
 * Three sentences. No more, no less. One specific action.
 * Regenerates: 6:30am daily, new ACUTE zone, homicide ≤0.5mi, on demand.
 */

import { useState, useEffect, useRef, useCallback } from 'react';
import type { CampusRisk, IceAlert, Incident, NewsItem } from '../../sentinel-engine/types';
import type { Campus } from '../../sentinel-data/campuses';
import { getCalendarContext } from '../../sentinel-data/calendar';
import { isSchoolDay } from '../../sentinel-engine/time';
import { haversine, fmtAgo } from '../../sentinel-engine/geo';

interface Props {
  campus: Campus;
  risk: CampusRisk;
  iceAlerts: IceAlert[];
  incidents: Incident[];
  newsItems: NewsItem[];
  tempF: number;
  weatherCondition?: string;
  onAskPulse?: () => void;
}

const SKELETON_KEYFRAMES = `
@keyframes shimmer {
  0% { background-position: -400px 0; }
  100% { background-position: 400px 0; }
}
@keyframes fadeInSentence {
  from { opacity: 0; transform: translateY(4px); }
  to { opacity: 1; transform: translateY(0); }
}
`;

export default function MorningBriefing({
  campus, risk, iceAlerts, incidents, newsItems, tempF, weatherCondition, onAskPulse,
}: Props) {
  const [briefingSentences, setBriefingSentences] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [showDataInputs, setShowDataInputs] = useState(false);
  const [generatedAt, setGeneratedAt] = useState<Date | null>(null);
  const [agoText, setAgoText] = useState('');
  const cacheRef = useRef<{ key: string; sentences: string[] } | null>(null);
  const lastAcuteCountRef = useRef(0);
  const lastNearHomicideRef = useRef('');

  // Build a cache key that changes when we need to regenerate
  const acuteZones = risk.contagionZones.filter(z => z.phase === 'ACUTE');
  const nearHomicide = incidents.find(i =>
    i.type.includes('HOMICIDE') &&
    (Date.now() - new Date(i.date).getTime()) < 24 * 3600000 &&
    haversine(campus.lat, campus.lng, i.lat, i.lng) <= 0.5,
  );

  const cacheKey = `${campus.id}-${risk.label}-${risk.schoolPeriod}-${acuteZones.length}-${nearHomicide?.id ?? 'none'}-${new Date().toDateString()}`;

  // Regenerate triggers beyond cache key: new ACUTE zone or new near homicide
  const shouldForceRegenerate = () => {
    if (acuteZones.length > lastAcuteCountRef.current) return true;
    if (nearHomicide && nearHomicide.id !== lastNearHomicideRef.current) return true;
    return false;
  };

  const generate = useCallback(async (force = false) => {
    if (!force && cacheRef.current?.key === cacheKey) {
      setBriefingSentences(cacheRef.current.sentences);
      return;
    }

    setLoading(true);
    lastAcuteCountRef.current = acuteZones.length;
    lastNearHomicideRef.current = nearHomicide?.id ?? '';

    try {
      const text = await generateAIBriefing(campus, risk, iceAlerts, incidents, newsItems, tempF, weatherCondition);
      const sentences = text.split(/(?<=[.!?])\s+/).filter(s => s.trim().length > 10).slice(0, 3);
      if (sentences.length >= 2) {
        setBriefingSentences(sentences);
        cacheRef.current = { key: cacheKey, sentences };
      } else {
        throw new Error('Insufficient sentences');
      }
    } catch {
      const fallback = buildDeterministicSentences(campus, risk, iceAlerts, incidents);
      setBriefingSentences(fallback);
      cacheRef.current = { key: cacheKey, sentences: fallback };
    } finally {
      setLoading(false);
      setGeneratedAt(new Date());
    }
  }, [cacheKey, campus, risk, iceAlerts, incidents, newsItems, tempF, weatherCondition, acuteZones.length, nearHomicide]);

  // Auto-generate on mount and when cache key changes
  useEffect(() => {
    const force = shouldForceRegenerate();
    void generate(force);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cacheKey]);

  // Auto-regenerate at 6:30am daily
  useEffect(() => {
    const check = () => {
      const now = new Date();
      if (now.getHours() === 6 && now.getMinutes() >= 30 && now.getMinutes() <= 32) {
        void generate(true);
      }
    };
    const t = setInterval(check, 60_000);
    return () => clearInterval(t);
  }, [generate]);

  // Update "generated X minutes ago" text
  useEffect(() => {
    if (!generatedAt) return;
    const tick = () => {
      const sec = Math.floor((Date.now() - generatedAt.getTime()) / 1000);
      if (sec < 60) setAgoText('just now');
      else if (sec < 3600) setAgoText(`${Math.floor(sec / 60)} minute${Math.floor(sec / 60) !== 1 ? 's' : ''} ago`);
      else setAgoText(`${Math.floor(sec / 3600)} hour${Math.floor(sec / 3600) !== 1 ? 's' : ''} ago`);
    };
    tick();
    const t = setInterval(tick, 30_000);
    return () => clearInterval(t);
  }, [generatedAt]);

  const action = getOneAction(risk, iceAlerts);

  return (
    <div style={{
      borderLeft: '4px solid #121315',
      borderRadius: 12,
      padding: '20px 20px',
      marginBottom: 24,
      background: '#FEF9EC',
      boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
      position: 'relative',
    }}>
      <style>{SKELETON_KEYFRAMES}</style>

      {/* Header */}
      <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <div style={{ fontSize: 20, fontWeight: 700, color: '#121315', paddingLeft: 12, borderLeft: '3px solid #F0B429' }}>
            {new Date().getHours() < 12 ? 'Good Morning' : new Date().getHours() < 17 ? 'Good Afternoon' : 'Good Evening'}, {campus.short}
          </div>
          <div style={{ fontSize: 13, color: '#9CA3AF', marginTop: 2 }}>
            Your neighborhood summary — updated as conditions change
          </div>
        </div>

        {/* Regenerate button */}
        <button
          onClick={() => void generate(true)}
          disabled={loading}
          title="Regenerate briefing"
          style={{
            width: 32, height: 32, borderRadius: '50%',
            background: '#F0B429', border: 'none', cursor: loading ? 'wait' : 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            flexShrink: 0, marginLeft: 12,
            opacity: loading ? 0.5 : 1,
            transition: 'opacity 200ms, transform 200ms',
          }}
          onMouseEnter={e => { if (!loading) e.currentTarget.style.transform = 'rotate(90deg)'; }}
          onMouseLeave={e => { e.currentTarget.style.transform = 'rotate(0deg)'; }}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#121315" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M23 4v6h-6" />
            <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10" />
          </svg>
        </button>
      </div>

      {/* Briefing sentences with sequential fade-in */}
      {loading ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {[0, 1, 2].map(i => (
            <div key={i}>
              <div style={{
                height: 20, borderRadius: 4,
                background: 'linear-gradient(90deg, #E5E7EB 0%, #F3F4F6 50%, #E5E7EB 100%)',
                backgroundSize: '800px 20px',
                animation: 'shimmer 1.5s infinite linear',
                width: `${90 - i * 10}%`, marginBottom: 6,
              }} />
              <div style={{
                height: 12, borderRadius: 3,
                background: 'linear-gradient(90deg, #F3F4F6 0%, #F9FAFB 50%, #F3F4F6 100%)',
                backgroundSize: '800px 12px',
                animation: 'shimmer 1.5s infinite linear',
                width: '60%',
              }} />
            </div>
          ))}
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
          {briefingSentences.map((sentence, i) => (
            <div key={i} style={{
              animation: `fadeInSentence 400ms ease ${i * 400}ms both`,
            }}>
              <div style={{
                fontSize: 18, color: '#121315', lineHeight: 1.7, padding: '8px 0',
              }}>
                {sentence}
              </div>
              {i < briefingSentences.length - 1 && (
                <div style={{
                  height: 1, background: '#E5E7EB33', marginBottom: 4,
                }} />
              )}
            </div>
          ))}
        </div>
      )}

      {/* Generated timestamp */}
      {generatedAt && !loading && (
        <div style={{ fontSize: 11, color: '#9CA3AF', marginTop: 8 }}>
          Generated {agoText}
        </div>
      )}

      {/* One specific action */}
      <div style={{
        marginTop: 20, padding: '16px', background: '#F7F5F1', borderRadius: 8,
      }}>
        <div style={{ fontSize: 14, fontWeight: 700, color: '#121315', marginBottom: 4 }}>
          What should I do right now?
        </div>
        <div style={{ fontSize: 16, color: '#121315', lineHeight: 1.6, fontWeight: 500 }}>
          {action}
        </div>
      </div>

      {/* Ask Watch + View data */}
      <div style={{ marginTop: 16, display: 'flex', gap: 12, flexWrap: 'wrap' }}>
        {onAskPulse && (
          <button onClick={onAskPulse} style={{
            background: 'none', border: 'none', padding: 0, cursor: 'pointer',
            fontSize: 14, color: '#121315', fontWeight: 600, textDecoration: 'underline',
            textUnderlineOffset: 3,
          }}>
            Ask Watch anything
          </button>
        )}
        <button onClick={() => setShowDataInputs(!showDataInputs)} style={{
          background: 'none', border: 'none', padding: 0, cursor: 'pointer',
          fontSize: 13, color: '#6B7280', textDecoration: 'underline',
          textDecorationStyle: 'dotted' as const, textUnderlineOffset: 3,
        }}>
          {showDataInputs ? 'Hide data inputs' : 'View all data inputs'}
        </button>
      </div>

      {/* Expandable data inputs */}
      {showDataInputs && (
        <div style={{
          marginTop: 12, padding: 12, background: '#F8F9FA', borderRadius: 8,
          fontSize: 12, color: '#6B7280', lineHeight: 1.6,
        }}>
          <div><strong>Risk score:</strong> {risk.score} ({risk.label}) — Base {risk.base} / Acute {risk.acute} / Seasonal {risk.seasonal}</div>
          <div><strong>Incidents (24h / 0.5mi):</strong> {risk.closeCount}</div>
          <div><strong>Contagion zones:</strong> {risk.contagionZones.length} ({risk.contagionZones.filter(z => z.phase === 'ACUTE').length} ACUTE, {risk.contagionZones.filter(z => z.phase === 'ACTIVE').length} ACTIVE)</div>
          <div><strong>Retaliation window:</strong> {risk.inRetaliationWindow ? 'ACTIVE' : 'None'}</div>
          <div><strong>ICE alerts:</strong> {iceAlerts.length > 0 ? `${iceAlerts.length} active` : 'None'}</div>
          <div><strong>Temperature:</strong> {tempF.toFixed(0)}°F</div>
          <div><strong>School period:</strong> {risk.schoolPeriod}</div>
          <div><strong>Calendar:</strong> {getCalendarContext(new Date())}</div>
        </div>
      )}
    </div>
  );
}

/* ---- Deterministic briefing sentences ---- */
function buildDeterministicSentences(
  campus: Campus, risk: CampusRisk, iceAlerts: IceAlert[], incidents: Incident[],
): string[] {
  const parts: string[] = [];

  // Compute nearby incidents for specificity
  const near12h = incidents.filter(i => {
    const ms = new Date(i.date).getTime();
    if (isNaN(ms)) return false;
    return (Date.now() - ms) < 12 * 3600000 && haversine(campus.lat, campus.lng, i.lat, i.lng) <= 1.0;
  });
  const homicides12h = near12h.filter(i => i.type.includes('HOMICIDE'));

  // Sentence 1: What happened
  if (risk.inRetaliationWindow) {
    const retZone = risk.contagionZones.find(z => z.retWin && z.ageH >= 18 && z.ageH <= 72);
    if (retZone) {
      const hoursLeft = Math.max(0, Math.round(72 - retZone.ageH));
      parts.push(`Your campus is in an active retaliation window with ${hoursLeft} hours remaining — a homicide ${retZone.distanceFromCampus != null ? `${retZone.distanceFromCampus.toFixed(1)} miles away` : 'nearby'} ${fmtAgo(retZone.homicideDate)} places ${campus.communityArea} in the most dangerous phase of the contagion cycle.`);
    } else {
      parts.push(`An active retaliation window is open near your campus in ${campus.communityArea} — heightened vigilance is warranted through dismissal today.`);
    }
  } else if (homicides12h.length > 0) {
    const h = homicides12h[0];
    const dist = haversine(campus.lat, campus.lng, h.lat, h.lng);
    parts.push(`A homicide was reported ${dist.toFixed(1)} miles from your campus at ${h.block} ${fmtAgo(h.date)} — your neighborhood in ${campus.communityArea} needs your attention this morning.`);
  } else if (near12h.length === 0) {
    parts.push(`Your neighborhood in ${campus.communityArea} has been quiet overnight — nothing in the last 12 hours requires your attention.`);
  } else {
    parts.push(`${near12h.length} incident${near12h.length !== 1 ? 's were' : ' was'} reported within a mile of ${campus.name} overnight — all environmental, none contagion-level.`);
  }

  // Sentence 2: What it means for today
  if (risk.inRetaliationWindow) {
    parts.push(`Today's dismissal is your most critical moment — position staff at every exit and consider staggered release.`);
  } else if (iceAlerts.length > 0) {
    parts.push(`ICE enforcement activity has been reported near your campus — monitor for attendance impact and be prepared to activate Code White if agents approach.`);
  } else if (risk.contagionZones.some(z => z.phase === 'ACUTE')) {
    parts.push(`An active contagion zone means elevated conditions through today — standard operations with extra awareness at arrival and dismissal.`);
  } else {
    parts.push(`Standard operations are appropriate for today in ${campus.communityArea} — your students can move through the neighborhood normally.`);
  }

  // Sentence 3: What to watch
  if (risk.label === 'CRITICAL' || risk.label === 'HIGH') {
    parts.push(`Brief your security team before first bell and position someone at each primary entrance during arrival and dismissal.`);
  } else if (risk.label === 'ELEVATED') {
    parts.push(`Keep an eye on the contagion panel today — the zone near your campus is aging and risk is declining, but it deserves your attention.`);
  } else {
    const isFriday = new Date().getDay() === 5;
    if (isFriday) {
      parts.push(`It's Friday — dismissal windows on Fridays show the highest violence concentration near campuses, so give dismissal a little extra attention today.`);
    } else {
      parts.push(`Nothing on the horizon requires special preparation — check back after your morning meeting for any overnight updates from CPD.`);
    }
  }

  return parts;
}

/* ---- One action ---- */
function getOneAction(risk: CampusRisk, iceAlerts: IceAlert[]): string {
  if (risk.inRetaliationWindow) {
    return 'Brief your security team before first bell and position someone at each primary entrance during arrival and dismissal.';
  }
  if (iceAlerts.length > 0) {
    return 'Verify all exterior doors are locked and contact Network Legal to report ICE activity near campus.';
  }
  if (risk.label === 'CRITICAL') {
    return 'Implement Code Yellow immediately — lock exterior doors, position security at all entrances, and prepare modified dismissal.';
  }
  if (risk.label === 'HIGH') {
    return 'Brief your security team before first bell and staff primary entrances during arrival and dismissal.';
  }
  if (risk.label === 'ELEVATED') {
    return 'Notify your security coordinator and monitor the dismissal window closely today.';
  }
  return 'No special actions required — continue standard operations.';
}

/* ---- AI briefing generation with full context architecture ---- */
async function generateAIBriefing(
  campus: Campus, risk: CampusRisk, iceAlerts: IceAlert[],
  incidents: Incident[], newsItems: NewsItem[], tempF: number, weatherCondition?: string,
): Promise<string> {
  const now = new Date();
  const dayName = now.toLocaleDateString('en-US', { weekday: 'long' });
  const isMonday = now.getDay() === 1;
  const isFriday = now.getDay() === 5;
  const hour = now.getHours();

  // Recent homicides within 72h
  const recentHomicides = incidents.filter(i => {
    if (!i.type.includes('HOMICIDE')) return false;
    const ms = new Date(i.date).getTime();
    if (isNaN(ms)) return false;
    return (Date.now() - ms) < 72 * 3600000;
  }).map(i => {
    const dist = haversine(campus.lat, campus.lng, i.lat, i.lng);
    const ageMs = Date.now() - new Date(i.date).getTime();
    return { ...i, distance: dist, hoursAgo: Math.round(ageMs / 3600000) };
  }).filter(i => i.distance <= 2.0);

  // Contagion context
  const acuteZones = risk.contagionZones.filter(z => z.phase === 'ACUTE');
  const activeRetWin = risk.contagionZones.find(z => z.phase === 'ACUTE' && z.retWin && z.ageH >= 18 && z.ageH <= 72);

  const contagionContext = acuteZones.length > 0
    ? `ACTIVE CONTAGION: ${acuteZones.length} zone(s) near campus. ${
        activeRetWin
          ? `RETALIATION WINDOW OPEN: ${Math.round(activeRetWin.ageH)}h elapsed of 72h peak window. Triggered by homicide at ${activeRetWin.block || 'nearby'}, ${activeRetWin.distanceFromCampus?.toFixed(1) ?? '?'}mi away, ${Math.round(activeRetWin.ageH)}h ago.`
          : 'No active retaliation window.'}`
    : 'No active contagion zones near campus.';

  const incidentContext = recentHomicides.length > 0
    ? `RECENT HOMICIDES (72h): ${recentHomicides.map(i =>
        `${i.block}, ${i.distance.toFixed(1)}mi away, ${i.hoursAgo}h ago`
      ).join('; ')}`
    : 'No homicides near campus in the last 24 hours.';

  // News near campus
  const proximateNews = newsItems
    .filter(n => n.proximateCampusIds?.includes(campus.id) || n.tier === 'CAMPUS_PROXIMATE')
    .slice(0, 3);

  const newsContext = proximateNews.length > 0
    ? `NEWS NEAR CAMPUS: ${proximateNews.map(n => `"${n.title}" (${n.source})`).join('; ')}`
    : 'No violence news items proximate to campus.';

  const iceActive = iceAlerts.length > 0;

  // School period context
  const isMorning = hour < 10;
  const isPreDismissal = hour >= 13 && hour < 15;

  const prompt = `You are writing the ${isMorning ? 'morning' : isPreDismissal ? 'afternoon' : 'evening'} intelligence briefing for the principal of ${campus.name} in ${campus.communityArea}, Chicago. This briefing will be the first thing they read when they open the platform. Write it as a trusted colleague — warm, direct, specific, and human. Never bureaucratic. Never vague.

CURRENT CONDITIONS:
Campus: ${campus.name}, ${campus.communityArea}
Date/Time: ${dayName}, ${now.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}
Risk Score: ${risk.score} (${risk.label})
Weather: ${Math.round(tempF)}°F${weatherCondition ? `, ${weatherCondition}` : ''}
School Period: ${risk.schoolPeriod}
Is school day: ${isSchoolDay(now)}
Calendar: ${getCalendarContext(now)}

SAFETY DATA:
${contagionContext}
${incidentContext}
${newsContext}
ICE Activity: ${iceActive ? 'CONFIRMED activity near campus — Code White may be warranted' : 'None reported near campus'}

FORECAST:
Today (${dayName}): Risk ${risk.label}
${isFriday ? 'NOTE: Friday afternoons statistically show highest violence risk. Dismissal protocols deserve extra attention.' : ''}
${isMonday ? 'NOTE: Monday mornings often surface weekend incidents not yet in CPD data.' : ''}

${activeRetWin ? `PRIORITY OVERRIDE: The retaliation window is the MOST IMPORTANT fact. Sentence 1 must address it directly. Be specific about hours remaining and what it means for today's dismissal. Do not bury it.` : ''}

INSTRUCTIONS:
Write EXACTLY 3 sentences. No more, no less.
Sentence 1: The single most important thing they need to know about their campus environment RIGHT NOW. Be specific — use real addresses, distances, times. If nothing is urgent, say so warmly and specifically.
Sentence 2: What this means for TODAY — for arrivals, the school day, or dismissal depending on current time (${isMorning ? 'morning arrivals' : isPreDismissal ? 'approaching dismissal' : 'school day'}). Specific and actionable.
Sentence 3: One thing to watch or one action to consider. Forward-looking. Ends on a note of clarity, not anxiety.

TONE: You are a trusted colleague, not a system. Use "your campus", "your students", "your neighborhood." Speak directly to the principal as a person. If conditions are genuinely quiet, say so clearly and warmly — silence is good news and deserves to be communicated as such.

NEVER use: "As of this writing", "It is important to note", "Please be advised", "At this time", or any bureaucratic filler.
NEVER start with "I" or "The".
NEVER mention specific student names or staff names.
START with the most important fact, not with context.`;

  const res = await fetch('/api/anthropic-proxy', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 350,
      messages: [{ role: 'user', content: prompt }],
    }),
  });

  if (!res.ok) throw new Error(`Claude API: ${res.status}`);
  const data = await res.json() as { content: Array<{ type: string; text: string }> };
  return data.content[0]?.text ?? '';
}
