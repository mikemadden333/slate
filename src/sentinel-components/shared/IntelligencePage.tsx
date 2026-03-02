/**
 * IntelligencePage — "How PULSE Works"
 *
 * Nine sections: Hero, Science, Scoring, Labels, Sources, Retaliation,
 * For Principals, Research, Noble Commitment.
 * Dark navy / white alternating. Gold accent. Pure CSS animations.
 * Premium research publication feel. Mobile-first.
 */

const NAVY = '#1B3A6B';
const GOLD = '#F0B429';
const WHITE = '#FFFFFF';

/* ═══════════════════════════════════════════════════════════════════
   CSS KEYFRAMES — injected once
   ═══════════════════════════════════════════════════════════════════ */

const STYLE_ID = 'pulse-hiw-keyframes';
if (typeof document !== 'undefined' && !document.getElementById(STYLE_ID)) {
  const style = document.createElement('style');
  style.id = STYLE_ID;
  style.textContent = `
    @keyframes hiw-pulse-glow {
      0%, 100% { opacity: 0.6; }
      50% { opacity: 1; }
    }
    @keyframes hiw-critical-border {
      0%, 100% { border-color: #DC2626; }
      50% { border-color: #FCA5A5; }
    }
    @keyframes hiw-arc-dot {
      0% { transform: rotate(64.8deg); }
      100% { transform: rotate(259.2deg); }
    }
  `;
  document.head.appendChild(style);
}

/* ═══════════════════════════════════════════════════════════════════
   MAIN COMPONENT
   ═══════════════════════════════════════════════════════════════════ */

export default function IntelligencePage() {
  return (
    <div style={{ fontFamily: 'system-ui, sans-serif' }}>
      <HeroSection />
      <ScienceSection />
      <ScoringSection />
      <LabelsSection />
      <SourcesSection />
      <RetaliationSection />
      <PrincipalsSection />
      <ResearchSection />
      <CommitmentSection />
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════
   LAYOUT HELPERS
   ═══════════════════════════════════════════════════════════════════ */

function DarkSection({ children }: { children: React.ReactNode }) {
  return (
    <section style={{
      background: NAVY,
      padding: '64px 20px',
    }}>
      <div style={{ maxWidth: 900, margin: '0 auto' }}>
        {children}
      </div>
    </section>
  );
}

function LightSection({ children }: { children: React.ReactNode }) {
  return (
    <section style={{
      background: WHITE,
      padding: '64px 20px',
    }}>
      <div style={{ maxWidth: 900, margin: '0 auto' }}>
        {children}
      </div>
    </section>
  );
}

function GoldRule() {
  return <div style={{ width: 80, height: 2, background: GOLD, margin: '24px auto' }} />;
}

/* ═══════════════════════════════════════════════════════════════════
   SECTION 1 — HERO
   ═══════════════════════════════════════════════════════════════════ */

function HeroSection() {
  return (
    <section style={{
      background: NAVY,
      padding: '80px 20px 64px',
      textAlign: 'center',
    }}>
      {/* Noble shield */}
      <div style={{ marginBottom: 32 }}>
        <svg width="72" height="86" viewBox="0 0 80 96" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M40 0L0 16V48C0 72 20 88 40 96C60 88 80 72 80 48V16L40 0Z" fill={GOLD} />
          <path d="M40 8L8 22V48C8 68 24 82 40 88C56 82 72 68 72 48V22L40 8Z" fill={NAVY} />
          <text x="40" y="58" textAnchor="middle" fill={GOLD} fontSize="32" fontWeight="800" fontFamily="system-ui">N</text>
        </svg>
      </div>

      {/* Title */}
      <h1 style={{
        fontSize: 36, fontWeight: 800, color: GOLD,
        margin: '0 0 12px', letterSpacing: -0.5, lineHeight: 1.15,
      }}>
        PULSE
      </h1>
      <div style={{
        fontSize: 18, fontWeight: 700, color: WHITE,
        margin: '0 0 16px', letterSpacing: 1,
      }}>
        Violence Intelligence for Noble Network
      </div>
      <div style={{
        fontSize: 15, fontWeight: 300, color: '#CBD5E1',
        maxWidth: 520, margin: '0 auto 32px', lineHeight: 1.6,
      }}>
        Built on a decade of peer-reviewed research. Protecting 12,000 students across 17 campuses.
      </div>

      <GoldRule />

      {/* Stat blocks */}
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        gap: 48,
        marginTop: 32,
        flexWrap: 'wrap',
      }}>
        <StatBlock number="17" label="Campuses" />
        <StatBlock number="12,000" label="Students Protected" />
        <StatBlock number="500%" label="More predictive than zip code models" />
      </div>
    </section>
  );
}

function StatBlock({ number, label }: { number: string; label: string }) {
  return (
    <div style={{ textAlign: 'center', minWidth: 120 }}>
      <div style={{ fontSize: 40, fontWeight: 800, color: GOLD, lineHeight: 1 }}>{number}</div>
      <div style={{ fontSize: 12, color: '#94A3B8', marginTop: 6, fontWeight: 400, maxWidth: 140 }}>{label}</div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════
   SECTION 2 — THE SCIENCE
   ═══════════════════════════════════════════════════════════════════ */

function ScienceSection() {
  return (
    <LightSection>
      <div style={{ borderLeft: `4px solid ${GOLD}`, paddingLeft: 24, marginBottom: 40 }}>
        <h2 style={{ fontSize: 32, fontWeight: 800, color: NAVY, margin: '0 0 8px', lineHeight: 1.2 }}>
          Violence spreads like a disease.
        </h2>
        <div style={{ fontSize: 18, fontWeight: 400, color: NAVY, opacity: 0.8 }}>
          This is not a metaphor. It is peer-reviewed science.
        </div>
      </div>

      <div style={{ fontSize: 16, lineHeight: 1.85, color: '#374151', marginBottom: 24 }}>
        <p style={{ margin: '0 0 20px' }}>
          In 2009, Dr. Andrew Papachristos at Yale University published a landmark study showing that
          gunshot victimization spreads through social networks the same way infectious diseases spread
          through populations. A homicide doesn&rsquo;t end with one victim. It creates a wave of
          retaliatory violence that moves through connected communities in predictable patterns over
          the following 18&ndash;72 hours. His research, conducted in Chicago, showed that 70% of all
          shootings occur within co-offending networks that represent less than 6% of the
          city&rsquo;s population.
        </p>
        <p style={{ margin: '0 0 20px' }}>
          PULSE operationalizes this research in real time. When a homicide occurs within two miles
          of a Noble campus, PULSE immediately calculates the contagion zone &mdash; the geographic
          and temporal space where retaliatory violence is most likely to occur. The model tracks
          four phases: <strong>ACUTE</strong> (0&ndash;18 hours, highest risk),{' '}
          <strong>ACTIVE</strong> (18&ndash;72 hours, peak retaliation window),{' '}
          <strong>WATCH</strong> (72 hours&ndash;7 days, elevated but declining), and{' '}
          <strong>MONITOR</strong> (7&ndash;21 days, returning to baseline).
        </p>
        <p style={{ margin: 0 }}>
          This is why PULSE focuses on homicides and weapons violations rather than all crime. A battery
          three miles away doesn&rsquo;t create contagion risk. A homicide half a mile away does.
          The distinction matters enormously for how principals prepare for the school day.
        </p>
      </div>

      {/* Contagion timeline visualization */}
      <div style={{
        background: '#F8FAFC', borderRadius: 12, padding: '32px 24px',
        border: '1px solid #E2E8F0', marginTop: 32,
      }}>
        <div style={{
          fontSize: 11, fontWeight: 700, color: '#94A3B8',
          textTransform: 'uppercase', letterSpacing: 1.5, marginBottom: 20,
        }}>
          Contagion Timeline
        </div>

        {/* Event marker */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20,
        }}>
          <div style={{
            width: 12, height: 12, borderRadius: '50%',
            background: '#DC2626', border: '3px solid #FCA5A5',
          }} />
          <span style={{ fontSize: 14, fontWeight: 700, color: NAVY }}>HOMICIDE OCCURS</span>
        </div>

        <TimelineBar
          phase="ACUTE" hours="0–18h" color="#DC2626" width="50%"
          desc="Immediate response zone" marker={null}
        />
        <TimelineBar
          phase="ACTIVE" hours="18–72h" color="#EA580C" width="70%"
          desc="Peak retaliation window"
          marker={<span style={{
            fontSize: 10, fontWeight: 800, color: GOLD,
            background: '#1B3A6B', padding: '2px 8px', borderRadius: 4, marginLeft: 8,
            whiteSpace: 'nowrap',
          }}>&#9668; You are here</span>}
        />
        <TimelineBar
          phase="WATCH" hours="72h–7d" color="#D97706" width="40%"
          desc="Elevated, declining risk" marker={null}
        />
        <TimelineBar
          phase="MONITOR" hours="7–21d" color="#16A34A" width="25%"
          desc="Returning to baseline" marker={null}
        />

        <div style={{
          marginTop: 20, fontSize: 13, color: '#64748B', lineHeight: 1.6,
          borderTop: '1px solid #E2E8F0', paddingTop: 16,
        }}>
          Noble Network campuses in the <strong>ACTIVE</strong> window receive a{' '}
          <strong style={{ color: '#DC2626' }}>CRITICAL</strong> risk designation regardless of other factors.
        </div>
      </div>
    </LightSection>
  );
}

function TimelineBar({ phase, hours, color, width, desc, marker }: {
  phase: string; hours: string; color: string; width: string; desc: string;
  marker: React.ReactNode;
}) {
  const isActive = phase === 'ACTIVE';
  return (
    <div style={{ marginBottom: 14 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
        <span style={{
          fontSize: 11, fontWeight: 800, color, minWidth: 70,
          fontFamily: "'SF Mono', 'Fira Code', monospace",
        }}>{phase}</span>
        <span style={{ fontSize: 11, color: '#94A3B8' }}>{hours}</span>
      </div>
      <div style={{ display: 'flex', alignItems: 'center' }}>
        <div style={{
          width,
          height: 20,
          borderRadius: 4,
          background: `linear-gradient(90deg, ${color}, ${color}AA)`,
          animation: isActive ? 'hiw-pulse-glow 2s ease-in-out infinite' : undefined,
        }} />
        {marker}
      </div>
      <div style={{ fontSize: 12, color: '#64748B', marginTop: 3, marginLeft: 78 }}>{desc}</div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════
   SECTION 3 — HOW THE SCORE WORKS
   ═══════════════════════════════════════════════════════════════════ */

function ScoringSection() {
  return (
    <DarkSection>
      <h2 style={{ fontSize: 28, fontWeight: 800, color: WHITE, margin: '0 0 8px', textAlign: 'center' }}>
        Your Safety Picture &mdash; not a crime count.
      </h2>
      <div style={{ fontSize: 14, color: '#94A3B8', textAlign: 'center', marginBottom: 40 }}>
        Four factors combine into a single, actionable score.
      </div>

      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
        gap: 20,
      }}>
        <ScoreColumn
          iconColor="#DC2626"
          iconContent="&#9632;"
          title="CONTAGION CRIMES"
          subtitle="drives the label"
          body="Homicide, Weapons Violation, Criminal Sexual Assault. These are the crimes that create network contagion. A single homicide within 0.5 miles carries more weight than 50 batteries. These crimes alone determine whether your campus is LOW, ELEVATED, HIGH, or CRITICAL."
        />
        <ScoreColumn
          iconColor="#EA580C"
          iconContent="&#9678;"
          title="PROXIMITY"
          subtitle="the closer, the higher"
          body={`\u22640.25mi: Maximum weight.\n\u22640.5mi: High weight.\n\u22641.0mi: Moderate weight.\n\u22642.0mi: Low weight.\nBeyond 2 miles: Not counted.`}
        />
        <ScoreColumn
          iconColor="#D97706"
          iconContent="&#9201;"
          title="RECENCY"
          subtitle="the fresher, the heavier"
          body={`Last 6 hours: 4\u00d7 weight.\nLast 24 hours: 2.5\u00d7 weight.\nLast week: 1.5\u00d7 weight.\nLast 30 days: 1\u00d7 weight.\nThe model forgets slowly and remembers sharply.`}
        />
        <ScoreColumn
          iconColor="#6B7280"
          iconContent="&#9632;"
          title="ENVIRONMENT"
          subtitle="never drives the label"
          body="Battery, Assault, Robbery, Narcotics. These crimes provide neighborhood context. They can raise the numerical score but CANNOT change your label above LOW. A campus with 100 batteries and 0 homicides is still LOW. A campus with 1 homicide is at minimum ELEVATED."
        />
      </div>
    </DarkSection>
  );
}

function ScoreColumn({ iconColor, iconContent, title, subtitle, body }: {
  iconColor: string; iconContent: string; title: string; subtitle: string; body: string;
}) {
  return (
    <div style={{
      background: 'rgba(255,255,255,0.06)',
      borderRadius: 12,
      padding: 24,
    }}>
      <div style={{ fontSize: 28, color: iconColor, marginBottom: 12 }}>{iconContent}</div>
      <div style={{ fontSize: 14, fontWeight: 800, color: WHITE, marginBottom: 2 }}>{title}</div>
      <div style={{ fontSize: 11, fontWeight: 600, color: GOLD, marginBottom: 14, textTransform: 'uppercase', letterSpacing: 0.5 }}>{subtitle}</div>
      <div style={{ fontSize: 13, color: '#CBD5E1', lineHeight: 1.7, whiteSpace: 'pre-line' }}>{body}</div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════
   SECTION 4 — WHAT THE LABELS MEAN
   ═══════════════════════════════════════════════════════════════════ */

function LabelsSection() {
  return (
    <LightSection>
      <h2 style={{ fontSize: 28, fontWeight: 800, color: NAVY, margin: '0 0 32px', textAlign: 'center' }}>
        What the Labels Mean
      </h2>

      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
        gap: 20,
      }}>
        <LabelCard
          label="LOW" color="#16A34A"          pulsing={false}
          body="Your campus neighborhood is quiet. No contagion-level crimes in recent history. Standard safety protocols. This is where Noble Network campuses are most of the time."
        />
        <LabelCard
          label="ELEVATED" color="#D97706"          pulsing={false}
          body="A weapons violation has occurred nearby in the last 48 hours, or ShotSpotter has detected gunfire. Heightened awareness recommended. Review dismissal protocols."
        />
        <LabelCard
          label="HIGH" color="#EA580C"          pulsing={false}
          body="A homicide has occurred within 1 mile in the last 72 hours. This campus is in the outer edge of a potential contagion zone. Review Code Yellow criteria. Brief your staff."
        />
        <LabelCard
          label="CRITICAL" color="#DC2626"          pulsing={true}
          body="This campus is inside an active retaliation window. A homicide occurred within 0.5 miles in the last 18–72 hours. This is the highest-risk period. Code Yellow protocols should be considered. PULSE will monitor every 90 seconds until the window closes."
        />
      </div>
    </LightSection>
  );
}

function LabelCard({ label, color, pulsing, body }: {
  label: string; color: string; pulsing: boolean; body: string;
}) {
  return (
    <div style={{
      border: `2px solid ${color}`,
      borderRadius: 12,
      padding: 24,
      animation: pulsing ? 'hiw-critical-border 2s ease-in-out infinite' : undefined,
    }}>
      <div style={{
        fontSize: 13, fontWeight: 800, color,
        marginBottom: 12, letterSpacing: 1,
      }}>
        {label}
      </div>
      <div style={{ fontSize: 14, color: '#374151', lineHeight: 1.7 }}>{body}</div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════
   SECTION 5 — DATA SOURCES
   ═══════════════════════════════════════════════════════════════════ */

function SourcesSection() {
  return (
    <DarkSection>
      <h2 style={{ fontSize: 28, fontWeight: 800, color: GOLD, margin: '0 0 32px', textAlign: 'center' }}>
        What PULSE Sees
      </h2>

      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
        gap: 16,
      }}>
        <SourceCard
          icon="&#128737;" title="CPD Verified"
          badge="Updated every 10 min"
          body="Chicago Police Department incident reports. Every homicide, weapons violation, battery, assault, robbery, and narcotics arrest filed within Noble Network geography. 5,000 most recent incidents. Note: CPD publishes reports with a 5–10 day lag. PULSE displays all available verified data."
        />
        <SourceCard
          icon="&#128065;" title="Citizen App"
          badge="Near real-time"
          body="Community-sourced incident reports from Citizen's scanner monitoring network. Near real-time — incidents appear within minutes of emergency dispatch. Covers all Noble Network neighborhoods."
        />
        <SourceCard
          icon="&#9178;" title="ShotSpotter"
          badge="~60 second latency"
          body="Acoustic gunshot detection sensors deployed throughout Chicago. Detects and locates gunfire within seconds. ShotSpotter data arrives before CPD reports. A ShotSpotter activation within 0.25 miles triggers immediate ELEVATED status."
        />
        <SourceCard
          icon="&#128240;" title="Block Club Chicago"
          badge="~20 min latency"
          body="Hyperlocal Chicago journalism. Block Club reporters cover shootings and homicides in Noble Network neighborhoods within 20–30 minutes. PULSE parses breaking news headlines and plots them as real-time incident markers."
        />
        <SourceCard
          icon="&#9729;" title="Open-Meteo Weather"
          badge="30 min refresh"
          body="Current temperature and forecast. Research shows violence increases significantly above 80°F. PULSE applies a temperature modifier to risk scores during hot weather."
        />
        <SourceCard
          icon="&#128737;" title="ICE Monitoring"
          badge="Separate from violence score"
          iconColor="#7C3AED"
          body="PULSE monitors news sources for confirmed ICE enforcement activity near Noble Network campuses. Noble follows Chicago's Welcoming City Ordinance. Confirmed local enforcement activity triggers a separate Code White advisory — independent of the violence risk score."
        />
      </div>
    </DarkSection>
  );
}

function SourceCard({ icon, title, badge, body, iconColor }: {
  icon: string; title: string; badge: string; body: string; iconColor?: string;
}) {
  return (
    <div style={{
      background: 'rgba(255,255,255,0.06)',
      borderRadius: 12,
      padding: 24,
    }}>
      <div style={{ fontSize: 28, marginBottom: 10, color: iconColor ?? GOLD }}>{icon}</div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10, flexWrap: 'wrap' }}>
        <span style={{ fontSize: 15, fontWeight: 800, color: WHITE }}>{title}</span>
        <span style={{
          fontSize: 10, fontWeight: 600, color: GOLD,
          background: `${GOLD}22`, padding: '2px 8px', borderRadius: 10,
        }}>{badge}</span>
      </div>
      <div style={{ fontSize: 13, color: '#CBD5E1', lineHeight: 1.7 }}>{body}</div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════
   SECTION 6 — THE RETALIATION WINDOW
   ═══════════════════════════════════════════════════════════════════ */

function RetaliationSection() {
  return (
    <LightSection>
      <h2 style={{ fontSize: 28, fontWeight: 800, color: NAVY, margin: '0 0 8px', textAlign: 'center' }}>
        The 18–72 Hour Window
      </h2>
      <div style={{ fontSize: 16, color: '#64748B', textAlign: 'center', marginBottom: 40 }}>
        The most dangerous period after a homicide.
      </div>

      <div style={{ fontSize: 16, lineHeight: 1.85, color: '#374151', maxWidth: 700, margin: '0 auto 40px' }}>
        <p style={{ margin: '0 0 20px' }}>
          Research shows that retaliatory violence &mdash; when it occurs &mdash; happens most frequently
          in the 18&ndash;72 hours following a homicide. The first 18 hours are often too chaotic for
          organized retaliation. After 72 hours, the immediate impulse begins to fade. The window in
          between is when principals need to be most alert.
        </p>
        <p style={{ margin: 0 }}>
          When PULSE detects that a Noble Network campus has entered a retaliation window, the entire
          app responds: the header deepens in color, a persistent banner appears counting down the
          hours remaining, the morning briefing leads with the situation, and the campus map zooms to
          show the homicide location relative to the school&rsquo;s front door.
        </p>
      </div>

      {/* Clock visualization */}
      <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 16 }}>
        <div style={{ position: 'relative', width: 240, height: 240 }}>
          {/* Base circle */}
          <svg width="240" height="240" viewBox="0 0 240 240" style={{ position: 'absolute', top: 0, left: 0 }}>
            {/* Background ring */}
            <circle cx="120" cy="120" r="100" fill="none" stroke="#E2E8F0" strokeWidth="16" />
            {/* 0-18h segment — gray calm zone */}
            <circle cx="120" cy="120" r="100" fill="none"
              stroke="#94A3B8" strokeWidth="16"
              strokeDasharray={`${2 * Math.PI * 100 * 18 / 72} ${2 * Math.PI * 100}`}
              strokeDashoffset={2 * Math.PI * 100 * 0.25}
              strokeLinecap="round"
            />
            {/* 18-72h segment — red danger zone */}
            <circle cx="120" cy="120" r="100" fill="none"
              stroke="#DC2626" strokeWidth="16"
              strokeDasharray={`${2 * Math.PI * 100 * 54 / 72} ${2 * Math.PI * 100}`}
              strokeDashoffset={2 * Math.PI * 100 * 0.25 - 2 * Math.PI * 100 * 18 / 72}
              strokeLinecap="round"
              style={{ animation: 'hiw-pulse-glow 3s ease-in-out infinite' }}
            />
            {/* Center text */}
            <text x="120" y="110" textAnchor="middle" fill={NAVY} fontSize="14" fontWeight="800">RETALIATION</text>
            <text x="120" y="132" textAnchor="middle" fill={NAVY} fontSize="14" fontWeight="800">WINDOW</text>
            {/* Hour labels */}
            <text x="120" y="30" textAnchor="middle" fill="#94A3B8" fontSize="11" fontWeight="600">0h</text>
            <text x="228" y="124" textAnchor="middle" fill="#DC2626" fontSize="11" fontWeight="600">18h</text>
            <text x="120" y="235" textAnchor="middle" fill="#DC2626" fontSize="11" fontWeight="600">36h</text>
            <text x="14" y="124" textAnchor="middle" fill="#DC2626" fontSize="11" fontWeight="600">54h</text>
          </svg>
          {/* Animated gold dot */}
          <div style={{
            position: 'absolute', top: 0, left: 0,
            width: 240, height: 240,
            animation: 'hiw-arc-dot 8s linear infinite',
          }}>
            <div style={{
              position: 'absolute',
              top: 8, left: '50%',
              width: 10, height: 10,
              marginLeft: -5,
              borderRadius: '50%',
              background: GOLD,
              boxShadow: `0 0 8px ${GOLD}`,
            }} />
          </div>
        </div>
      </div>

      <div style={{
        textAlign: 'center', fontSize: 12, color: '#94A3B8',
        fontWeight: 600, letterSpacing: 0.5,
      }}>
        <span style={{ color: '#94A3B8' }}>&#9632; 0–18h Chaotic</span>
        {' '}&middot;{' '}
        <span style={{ color: '#DC2626' }}>&#9632; 18–72h Peak Retaliation</span>
        {' '}&middot;{' '}
        <span style={{ color: GOLD }}>&#9679; Tracking</span>
      </div>
    </LightSection>
  );
}

/* ═══════════════════════════════════════════════════════════════════
   SECTION 7 — FOR PRINCIPALS
   ═══════════════════════════════════════════════════════════════════ */

function PrincipalsSection() {
  return (
    <DarkSection>
      <h2 style={{ fontSize: 28, fontWeight: 800, color: WHITE, margin: '0 0 8px', textAlign: 'center' }}>
        What to do with this information.
      </h2>
      <div style={{ fontSize: 14, color: '#94A3B8', textAlign: 'center', marginBottom: 40 }}>
        Practical guidance for school leaders.
      </div>

      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
        gap: 16,
      }}>
        <ActionCard
          title="EVERY MORNING"
          body="Open PULSE before 7am. Read the morning briefing. Check your risk label. If LOW — standard day. If ELEVATED or above — read the status reason carefully and brief your security team."
        />
        <ActionCard
          title="WHEN ELEVATED"
          body="Review dismissal protocols. Consider whether modified routes are warranted. Brief the principal team. The situation may resolve in hours — check PULSE again before dismissal."
        />
        <ActionCard
          title="WHEN HIGH OR CRITICAL"
          body="Brief all staff. Implement Code Yellow protocols. Contact Noble Network Safety Director. Consider parent/family communication. PULSE will update every 90 seconds."
        />
        <ActionCard
          title="WHEN IN DOUBT"
          body="Call the Noble Network Safety Director. PULSE gives you information. Judgment calls belong to humans. The app is a tool, not a decision-maker."
        />
      </div>
    </DarkSection>
  );
}

function ActionCard({ title, body }: { title: string; body: string }) {
  return (
    <div style={{
      background: 'rgba(255,255,255,0.06)',
      borderRadius: 12,
      padding: 24,
      borderTop: `3px solid ${GOLD}`,
    }}>
      <div style={{
        fontSize: 12, fontWeight: 800, color: GOLD,
        letterSpacing: 1, marginBottom: 12,
      }}>
        {title}
      </div>
      <div style={{ fontSize: 14, color: '#CBD5E1', lineHeight: 1.7 }}>{body}</div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════
   SECTION 8 — THE RESEARCH
   ═══════════════════════════════════════════════════════════════════ */

function ResearchSection() {
  return (
    <LightSection>
      <h2 style={{ fontSize: 28, fontWeight: 800, color: NAVY, margin: '0 0 8px', textAlign: 'center' }}>
        Standing on the shoulders of giants.
      </h2>
      <div style={{ fontSize: 14, color: '#64748B', textAlign: 'center', marginBottom: 40 }}>
        The peer-reviewed research behind PULSE.
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 16, maxWidth: 700, margin: '0 auto' }}>
        <CitationCard
          citation='Papachristos, A.V., Wildeman, C., & Roberto, E. (2015). "Tragic, but not random: The social contagion of nonfatal gunshot injuries." Social Science & Medicine.'
          desc="Demonstrated that gunshot victimization spreads through co-offending networks with the predictability of an infectious disease. The foundation of PULSE's contagion model."
        />
        <CitationCard
          citation='Papachristos, A.V., & Wildeman, C. (2014). "Network exposure and homicide victimization in an African American community." American Journal of Public Health.'
          desc="Showed that network position — not neighborhood — is the primary predictor of homicide victimization. 41% of all gun homicides occurred in a network representing 4% of the population."
        />
        <CitationCard
          citation='Papachristos, A.V. (2009). "Murder by structure: Dominance relations and the social structure of gang homicide." American Journal of Sociology.'
          desc="The original study that established gang homicide as a network contagion phenomenon in Chicago. Changed how researchers and practitioners think about urban violence."
        />
      </div>

      <div style={{
        marginTop: 32, fontSize: 13, color: '#94A3B8', textAlign: 'center',
        lineHeight: 1.6, maxWidth: 600, margin: '32px auto 0',
      }}>
        PULSE is not affiliated with Dr. Papachristos or Yale University. We have operationalized
        publicly available peer-reviewed research to protect Noble Network students and staff.
      </div>
    </LightSection>
  );
}

function CitationCard({ citation, desc }: { citation: string; desc: string }) {
  return (
    <div style={{
      borderLeft: `4px solid ${GOLD}`,
      padding: '16px 20px',
      background: '#FFFBF0',
      borderRadius: '0 8px 8px 0',
    }}>
      <div style={{ fontSize: 14, fontWeight: 600, color: NAVY, lineHeight: 1.5, marginBottom: 8 }}>
        {citation}
      </div>
      <div style={{ fontSize: 13, color: '#64748B', lineHeight: 1.6, fontStyle: 'italic' }}>
        {desc}
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════
   SECTION 9 — NOBLE NETWORK COMMITMENT
   ═══════════════════════════════════════════════════════════════════ */

function CommitmentSection() {
  return (
    <section style={{
      background: NAVY,
      padding: '80px 20px',
      textAlign: 'center',
    }}>
      <div style={{ maxWidth: 640, margin: '0 auto' }}>
        {/* Shield */}
        <div style={{ marginBottom: 32 }}>
          <svg width="64" height="76" viewBox="0 0 80 96" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M40 0L0 16V48C0 72 20 88 40 96C60 88 80 72 80 48V16L40 0Z" fill={GOLD} />
            <path d="M40 8L8 22V48C8 68 24 82 40 88C56 82 72 68 72 48V22L40 8Z" fill={NAVY} />
            <text x="40" y="58" textAnchor="middle" fill={GOLD} fontSize="32" fontWeight="800" fontFamily="system-ui">N</text>
          </svg>
        </div>

        <h2 style={{ fontSize: 32, fontWeight: 800, color: GOLD, margin: '0 0 24px' }}>
          Noble Efforts Save Lives.
        </h2>

        <p style={{
          fontSize: 17, color: '#CBD5E1', lineHeight: 1.85,
          margin: '0 0 32px', fontWeight: 300,
        }}>
          PULSE was built by Noble Schools for Noble Schools. Not as a surveillance tool.
          Not as a punitive instrument. As a shield. 12,000 students cross our thresholds
          every day in neighborhoods where violence is a real and present danger. They deserve
          every advantage we can give them. PULSE is one of those advantages.
        </p>

        <GoldRule />

        <div style={{
          fontSize: 22, fontWeight: 300, color: WHITE,
          letterSpacing: 4, marginTop: 24,
        }}>
          Know. &nbsp;Act. &nbsp;Protect.
        </div>
      </div>
    </section>
  );
}
