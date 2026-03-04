/**
 * Slate Watch — Safety Intelligence
 * Splash screen, risk-colored header, all 10 campus sections in narrative scroll.
 */

/** Timestamp of initial app load — nothing fires visible notifications before SETTLE_TIME_MS elapses. */
export const appStartTime = Date.now();
export const SETTLE_TIME_MS = 15_000;

import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { CAMPUSES } from './sentinel-data/campuses';
import { RISK_COLORS } from './sentinel-data/weights';
import { buildContagionZones } from './sentinel-engine/contagion';
import { scoreCampus, scoreNetwork } from './sentinel-engine/scoring';
import { buildWeekForecast } from './sentinel-engine/forecast';
import { buildSafeCorridors } from './sentinel-engine/corridors';
import { getSchoolPeriod, minutesToArrival, minutesToDismissal } from './sentinel-engine/time';
import { haversine, ageInHours } from './sentinel-engine/geo';
import { fetchIncidents, fetchShotSpotter } from './sentinel-api/cpd';
import { fetchScannerActivity } from './sentinel-api/scanner';
import { transcribeSpikeCalls } from './sentinel-api/scannerIntel';
import type { DispatchIncident } from './sentinel-api/scannerIntel';
import type { ScannerSummary } from './sentinel-api/scanner';
import { fetchCitizenIncidents } from './sentinel-api/citizen';
import type { CitizenIncident } from './sentinel-api/citizen';
import { fetchWeather, fetchWeatherForecast } from './sentinel-api/weather';
import { fetchAllFeeds, parseNewsAsIncidents } from './sentinel-api/news';
import { geocodeNewsIncidents } from './sentinel-api/newsGeocoder';
import { fetchIceSignals } from './sentinel-api/ice';
import { fetchRealtimeIncidents } from './sentinel-api/cpdRealtime';
import type {
  Incident,
  ShotSpotterEvent,
  ContagionZone,
  CampusRisk,
  NewsItem,
  IceAlert,
  DailyWeather,
  WeatherCurrent,
  SchoolPeriod,
} from './sentinel-engine/types';

// Campus components
import SituationCard from './sentinel-components/campus/SituationCard';
import RightNowBar from './sentinel-components/campus/RightNowBar';
import MorningBriefing from './sentinel-components/campus/MorningBriefing';
import ContagionPanel from './sentinel-components/campus/ContagionPanel';
import WeekForecast from './sentinel-components/campus/WeekForecast';
import IncidentList from './sentinel-components/campus/IncidentList';
import SafeCorridorMap from './sentinel-components/campus/SafeCorridorMap';
import IceIntelligence from './sentinel-components/campus/IceIntelligence';
import EmergencyResponse from './sentinel-components/campus/EmergencyResponse';
import CampusMap from './sentinel-components/campus/CampusMap';
import LastNight from './sentinel-components/campus/LastNight';
import DataFreshness from './sentinel-components/campus/DataFreshness';
import RetaliationBanner from './sentinel-components/campus/RetaliationBanner';
import { useRetaliationWindow } from './sentinel-hooks/useRetaliationWindow';
import ContextualEducation from './sentinel-components/shared/ContextualEducation';
import { useCampusMemory } from './sentinel-hooks/useCampusMemory';
import SinceLastVisitCard from './sentinel-components/campus/SinceLastVisitCard';

// Network components
import NetworkDashboard from './sentinel-components/network/NetworkDashboard';
import NetworkMap from './sentinel-components/network/NetworkMap';
import NewsView from './sentinel-components/network/NewsView';
import Intelligence from './sentinel-components/network/Analytics';
import CommandCenter from './sentinel-components/network/CommandCenter';

// Shared components
import ProtocolModal from './sentinel-components/shared/ProtocolModal';
import IntelQuery from './sentinel-components/shared/IntelQuery';
import CampusToolsDrawer from './sentinel-components/campus/CampusToolsDrawer';
import OnboardingRevelation from './sentinel-components/shared/OnboardingRevelation';
import FeedView from './sentinel-components/shared/FeedView';
import CampusSelector, { shouldShowSelector, getLastCampusId, saveSelectedCampus, markSelectorDismissed } from './sentinel-components/shared/CampusSelector';
import IntelligencePage from './sentinel-components/shared/IntelligencePage';

type View = 'campus' | 'network' | 'howItWorks';
type NetworkTab = 'dashboard' | 'map' | 'news' | 'intelligence' | 'feed';
type CampusTab = 'watch' | 'feed';

export default function App() {
  // --- Navigation ---
  const [view, setView] = useState<View>('network');
  const [networkTab, setNetworkTab] = useState<NetworkTab>('dashboard');
  const [campusTab, setCampusTab] = useState<CampusTab>('watch');
  const [selectedCampusId, setSelectedCampusId] = useState(() => getLastCampusId() ?? 1);

  // --- UI State ---
  const [activeProtocol, setActiveProtocol] = useState<string | null>(null);
  const [showCommandCenter, setShowCommandCenter] = useState(false);
  const [showCampusSelector, setShowCampusSelector] = useState(() => shouldShowSelector());
  const [showOnboarding, setShowOnboarding] = useState(() => {
    return !localStorage.getItem('pulse_onboarded');
  });
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());
  const [updatedAgoText, setUpdatedAgoText] = useState('just now');
  const [justRefreshed, setJustRefreshed] = useState(false);

  // Update "Xs ago" text every second for live feel
  useEffect(() => {
    const tick = () => {
      const sec = Math.floor((Date.now() - lastUpdated.getTime()) / 1000);
      if (sec < 5) setUpdatedAgoText('just now');
      else if (sec < 60) setUpdatedAgoText(`${sec}s ago`);
      else setUpdatedAgoText(`${Math.floor(sec / 60)}m ago`);
    };
    tick();
    setJustRefreshed(true);
    const flashTimer = setTimeout(() => setJustRefreshed(false), 1500);
    const t = setInterval(tick, 1_000);
    return () => { clearInterval(t); clearTimeout(flashTimer); };
  }, [lastUpdated]);

  // --- Data State ---
  const [initialLoading, setInitialLoading] = useState(true);
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [acuteIncidents, setAcuteIncidents] = useState<Incident[]>([]);
  const [shotSpotterEvents, setShotSpotterEvents] = useState<ShotSpotterEvent[]>([]);
  const [weather, setWeather] = useState<WeatherCurrent>({
    temperature: 65, apparentTemperature: 65, precipitation: 0, windSpeed: 0,
  });
  const [weatherForecast, setWeatherForecast] = useState<DailyWeather[]>([]);
  const [newsItems, setNewsItems] = useState<NewsItem[]>([]);
  const [iceAlerts, setIceAlerts] = useState<IceAlert[]>([]);
  const [citizenIncidents, setCitizenIncidents] = useState<CitizenIncident[]>([]);
  const [scannerData, setScannerData] = useState<ScannerSummary | null>(null);
  const [dispatchIncidents, setDispatchIncidents] = useState<DispatchIncident[]>([]);
  const [realtimeIncidents, setRealtimeIncidents] = useState<Incident[]>([]);
  const [newsIncidents, setNewsIncidents] = useState<Incident[]>([]);
  const [dataFreshness, setDataFreshness] = useState({
    cpdLastUpdate: new Date(),
    cpdCount: 0,
    citizenLastUpdate: new Date(),
    citizenCount: 0,
    shotSpotterStatus: 'No activations detected' as string,
    newsLastUpdate: new Date(),
    newsSourceCount: 0,
    realtimeCount: 0,
    realtimeLastUpdate: new Date(),
    newsIncidentCount: 0,
  });

  // --- Derived State ---
  const zones = useMemo<ContagionZone[]>(
    () => buildContagionZones(incidents),
    [incidents],
  );

  const now = new Date();
  const selectedCampus = CAMPUSES.find(c => c.id === selectedCampusId) ?? CAMPUSES[0];
  const schoolPeriod: SchoolPeriod = getSchoolPeriod(now, selectedCampus);
  const tempF = weather.apparentTemperature;

  const allRisks = useMemo<CampusRisk[]>(
    () => CAMPUSES.map(c =>
      scoreCampus(c, incidents, acuteIncidents, shotSpotterEvents, zones, tempF, getSchoolPeriod(now, c)),
    ),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [incidents, acuteIncidents, shotSpotterEvents, zones, tempF],
  );

  const selectedRisk = allRisks.find(r => r.campusId === selectedCampusId) ?? allRisks[0];

  const forecast = useMemo(
    () => buildWeekForecast(selectedCampus, incidents, zones, weatherForecast),
    [selectedCampus, incidents, zones, weatherForecast],
  );

  const corridors = useMemo(
    () => buildSafeCorridors(selectedCampus, acuteIncidents),
    [selectedCampus, acuteIncidents],
  );

  const networkSummary = useMemo(
    () => scoreNetwork(CAMPUSES, allRisks, acuteIncidents, iceAlerts.length),
    [allRisks, acuteIncidents, iceAlerts],
  );

  // Network forecast: use highest-risk campus
  const networkForecast = useMemo(() => {
    const sorted = [...allRisks].sort((a, b) => b.score - a.score);
    const topCampus = sorted.length > 0
      ? CAMPUSES.find(c => c.id === sorted[0].campusId) ?? CAMPUSES[0]
      : CAMPUSES[0];
    return buildWeekForecast(topCampus, incidents, zones, weatherForecast);
  }, [allRisks, incidents, zones, weatherForecast]);

  // Combined incidents for briefing and map — all sources, deduplicated
  const allIncidents = useMemo(() => {
    // Priority order: CPD acute > CPD full > CPD realtime > news > citizen
    const merged = [...acuteIncidents, ...incidents, ...realtimeIncidents, ...newsIncidents, ...dispatchIncidents];
    // Deduplicate: same type + nearby location + within 1 hour = duplicate
    const seen = new Set<string>();
    const result: Incident[] = [];
    for (const inc of merged) {
      const dedupeKey = `${inc.type}_${Math.round(inc.lat * 1000)}_${Math.round(inc.lng * 1000)}_${Math.round(new Date(inc.date).getTime() / 3600000)}`;
      if (!seen.has(dedupeKey) && !seen.has(inc.id)) {
        seen.add(dedupeKey);
        seen.add(inc.id);
        result.push(inc);
      }
    }
    console.log('Total incidents from all sources:', result.length,
      '| CPD:', incidents.length,
      '| Acute:', acuteIncidents.length,
      '| Realtime:', realtimeIncidents.length,
      '| News:', newsIncidents.length,
    );
    return result;
  }, [acuteIncidents, incidents, realtimeIncidents, newsIncidents]);

  // Compute 6h incident count (within 0.5mi) for RightNowBar
  const incidents6h = useMemo(() => {
    let count = 0;
    for (const inc of acuteIncidents) {
      if (ageInHours(inc.date) > 6) continue;
      if (haversine(selectedCampus.lat, selectedCampus.lng, inc.lat, inc.lng) > 0.5) continue;
      count++;
    }
    return count;
  }, [acuteIncidents, selectedCampus]);

  // Incidents within 1mi for onboarding count
  const VIOLENT_TYPES = new Set(['HOMICIDE','MURDER','SHOOTING','BATTERY','ROBBERY','ASSAULT','WEAPONS VIOLATION','CRIM SEXUAL ASSAULT']);
  const incidents30d1mi = useMemo(() => {
    return incidents.filter(inc =>
      VIOLENT_TYPES.has(inc.type) &&
      haversine(selectedCampus.lat, selectedCampus.lng, inc.lat, inc.lng) <= 1.0,
    ).length;
  }, [incidents, selectedCampus]);
  // Network-wide onboarding stats — all campuses
  const networkIncidents30d = useMemo(() => {
    return CAMPUSES.reduce((total, campus) => {
      return total + incidents.filter(inc =>
        VIOLENT_TYPES.has(inc.type) &&
        haversine(campus.lat, campus.lng, inc.lat, inc.lng) <= 1.0
      ).length;
    }, 0);
  }, [incidents]);
  const networkContagionCount = useMemo(() => {
    return allRisks.reduce((total, risk) => {
      return total + (risk?.contagionZones?.length ?? 0);
    }, 0);
  }, [allRisks]);

  // Retaliation window state
  const retWin = useRetaliationWindow(selectedRisk);

  // Campus memory layer
  const campusMemory = useCampusMemory(selectedCampusId, selectedRisk);

  // Risk-colored header background — deeper red during retaliation window
  const riskColor = selectedRisk ? RISK_COLORS[selectedRisk.label].color : '#121315';
  const headerBg = view === 'campus'
    ? (retWin.active ? '#7F1D1D' : riskColor)
    : '#121315';

  // Extra margin when retaliation banner is showing
  const retBannerHeight = retWin.active && view === 'campus' ? 90 : 0;

  // --- Refresh Cycles ---
  const refresh90s = useCallback(async () => {
    const [acute, shots, realtime] = await Promise.all([
      fetchIncidents(48, 500),
      fetchShotSpotter(2, 100),
      fetchRealtimeIncidents(),
    ]);
    setRealtimeIncidents(realtime);
    setDataFreshness(prev => ({ ...prev, realtimeCount: realtime.length, realtimeLastUpdate: new Date() }));
    // Diagnostic: log acute fetch results
    console.log(`DIAG refresh90s: ${acute.length} acute incidents, ${shots.length} ShotSpotter events`);
    if (acute.length > 0) {
      const drw = CAMPUSES.find(c => c.id === 6)!;
      const sampleDist = haversine(drw.lat, drw.lng, acute[0].lat, acute[0].lng);
      console.log(`DIAG: DRW(${drw.lat},${drw.lng}) → first incident(${acute[0].lat},${acute[0].lng}) = ${sampleDist.toFixed(2)}mi`);
    }
    setAcuteIncidents(acute);
    setShotSpotterEvents(shots);
    setLastUpdated(new Date());
    setDataFreshness(prev => ({
      ...prev,
      cpdLastUpdate: new Date(),
      cpdCount: acute.length,
      shotSpotterStatus: shots.length > 0
        ? `Live — ${shots.length} activation${shots.length === 1 ? '' : 's'}`
        : 'No gunfire detected near your campus in the last 2 hours. Your neighborhood has been acoustically quiet.',
    }));
  }, []);

  const refresh10min = useCallback(async () => {
    const full = await fetchIncidents(720, 5000);
    setIncidents(full);
    console.log('CPD full fetch (30d):', full.length, 'incidents');
  }, []);

  const refresh30min = useCallback(async () => {
    const [wx, wxForecast] = await Promise.all([
      fetchWeather(),
      fetchWeatherForecast(),
    ]);
    setWeather(wx);
    setWeatherForecast(wxForecast);
  }, []);

  const refresh5min = useCallback(async () => {
    const news = await fetchAllFeeds();
    setNewsItems(news);
    const ice = await fetchIceSignals(news);
    setIceAlerts(ice);
    // AI geocoding with keyword-parser fallback
    let parsed = await geocodeNewsIncidents(news);
    if (parsed.length === 0) {
      parsed = parseNewsAsIncidents(news);
    }
    setNewsIncidents(parsed);
    setDataFreshness(prev => ({
      ...prev,
      newsLastUpdate: new Date(),
      newsSourceCount: new Set(news.map(n => n.source)).size,
      newsIncidentCount: parsed.length,
    }));
  }, []);

  const refreshCitizen = useCallback(async () => {
    const campus = CAMPUSES.find(c => c.id === selectedCampusId) ?? CAMPUSES[0];
    const citizen = await fetchCitizenIncidents(campus.lat, campus.lng, 2.0);
    setCitizenIncidents(citizen);
    setDataFreshness(prev => ({
      ...prev,
      citizenLastUpdate: new Date(),
      citizenCount: citizen.length,
    }));
  }, [selectedCampusId]);
  const refreshScanner = useCallback(async () => {
    const data = await fetchScannerActivity(120);
    setScannerData(data);
    console.log('Scanner: ' + data.totalCalls + ' calls, ' + data.spikeZones.length + ' spike zones');
    // Transcribe spike zone calls for real-time dispatch intelligence
    if (data.spikeZones.length > 0) {
      const spikeCalls = data.spikeZones.flatMap(z => z.recentCalls);
      console.log('Scanner intel: spike detected, transcribing ' + spikeCalls.length + ' calls');
      transcribeSpikeCalls(spikeCalls).then(dispatches => {
        if (dispatches.length > 0) {
          console.log('Scanner intel: ' + dispatches.length + ' dispatch incidents geolocated');
          setDispatchIncidents(dispatches);
        }
      }).catch(err => console.log('Scanner intel error:', String(err)));
    }
  }, []);

  useEffect(() => {
    void Promise.all([refresh90s(), refresh10min(), refresh30min(), refresh5min(), refreshCitizen(), refreshScanner()])
      .finally(() => setInitialLoading(false));
    const t90s = setInterval(() => void refresh90s(), 90_000);
    const t10m = setInterval(() => void refresh10min(), 600_000);
    const t30m = setInterval(() => void refresh30min(), 1_800_000);
    const t5m = setInterval(() => void refresh5min(), 300_000);
    const tCit = setInterval(() => void refreshCitizen(), 300_000);
    const tScan = setInterval(() => void refreshScanner(), 300_000);
    // Refresh on tab focus — always show fresh data on re-entry
    const onVisibility = () => {
      if (document.visibilityState === 'visible') {
        console.log('Tab focused — triggering full refresh');
        void Promise.all([refresh90s(), refresh5min(), refreshCitizen(), refreshScanner()]);
      }
    };
    document.addEventListener('visibilitychange', onVisibility);
    return () => { clearInterval(t90s); clearInterval(t10m); clearInterval(t30m); clearInterval(t5m); clearInterval(tCit); clearInterval(tScan); };
  }, [refresh90s, refresh10min, refresh30min, refresh5min, refreshCitizen, refreshScanner]);

  // --- Handlers ---
  const handleSelectCampusFromNetwork = (id: number) => {
    setSelectedCampusId(id);
    setView('campus');
  };

  const handleInitiateCodeWhite = () => setActiveProtocol('WHITE');
  const handleBeginProtocol = (code: string) => setActiveProtocol(code);

  const handleCompleteOnboarding = () => {
    setShowOnboarding(false);
    localStorage.setItem('pulse_onboarded', '1');
  };

  const forecastRef = useRef<HTMLDivElement>(null);
  const briefingRef = useRef<HTMLDivElement>(null);
  const intelQueryRef = useRef<HTMLDivElement>(null);

  const scrollToForecast = useCallback(() => {
    forecastRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  const scrollToBriefing = useCallback(() => {
    briefingRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  const scrollToIntelQuery = useCallback(() => {
    intelQueryRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  // Recommended emergency code
  const recommendedCode = selectedRisk?.label === 'CRITICAL' ? 'RED'
    : selectedRisk?.label === 'HIGH' ? 'YELLOW'
    : iceAlerts.length > 0 ? 'WHITE'
    : undefined;

  // --- Render ---

  const riskAccent = selectedRisk?.label === 'CRITICAL' ? '#D45B4F'
    : selectedRisk?.label === 'HIGH' ? '#C66C3D'
    : selectedRisk?.label === 'ELEVATED' ? '#B79145'
    : '#2F8F95';

  return (
    <div style={{ fontFamily: "'Inter', system-ui, sans-serif", color: '#121315' }}>
      {showCampusSelector && (
        <CampusSelector
          onSelectCampus={(id) => { setSelectedCampusId(id); saveSelectedCampus(id); setShowCampusSelector(false); setView('campus'); }}
          onSelectNetwork={() => { markSelectorDismissed(); setShowCampusSelector(false); setView('network'); }}
        />
      )}
      {showOnboarding && (
        <OnboardingRevelation
          campus={view === 'network' ? null : selectedCampus}
          incidents30d={view === 'network' ? networkIncidents30d : incidents30d1mi}
          contagionZoneCount={view === 'network' ? networkContagionCount : (selectedRisk?.contagionZones.length ?? 0)}
          inContagionZone={view === 'network' ? networkContagionCount > 0 : (selectedRisk?.contagionZones.length ?? 0) > 0}
          isNetwork={view === 'network'}
          networkCampusCount={CAMPUSES.length}
          onComplete={handleCompleteOnboarding} />
      )}
      {activeProtocol && (
        <ProtocolModal code={activeProtocol} campus={selectedCampus} risk={selectedRisk}
          onClose={() => setActiveProtocol(null)} />
      )}
      {showCommandCenter && (
        <CommandCenter risks={allRisks} incidents={incidents} acuteIncidents={acuteIncidents}
          shotSpotterEvents={shotSpotterEvents} zones={zones} newsItems={newsItems}
          iceAlerts={iceAlerts} forecast={networkForecast} networkSummary={networkSummary}
          onClose={() => setShowCommandCenter(false)} onSelectCampus={handleSelectCampusFromNetwork} />
      )}

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20, gap: 12, flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          {[
            { label: 'Network', v: 'network' },
            { label: 'My Campus', v: 'campus' },
            { label: 'How It Works', v: 'howItWorks' },
          ].map(t => (
            <button key={t.v} onClick={() => setView(t.v as View)} style={{
              padding: '9px 20px', borderRadius: 10, border: 'none', cursor: 'pointer',
              fontSize: 13, fontWeight: view === t.v ? 700 : 500,
              color: view === t.v ? '#121315' : '#6B7280',
              background: view === t.v ? '#F7F5F1' : 'transparent',
              transition: 'all 0.15s ease',
            }}>{t.label}</button>
          ))}
          {view === 'network' && (
            <button onClick={() => setShowCommandCenter(true)} style={{
              padding: '9px 20px', borderRadius: 10, border: '1px solid #D45B4F40',
              cursor: 'pointer', fontSize: 13, fontWeight: 600,
              color: '#D45B4F', background: '#FDF2F1',
            }}>Command Center</button>
          )}
        </div>

        {view === 'campus' && (
          <SlateCampusDropdown campuses={CAMPUSES} selectedId={selectedCampusId} onSelect={setSelectedCampusId} />
        )}

        <div style={{ display: 'flex', alignItems: 'center', gap: 12, fontSize: 12 }}>
          {view === 'campus' && (
            <span style={{
              display: 'inline-flex', alignItems: 'center', gap: 6,
              padding: '4px 12px', borderRadius: 20,
              background: riskAccent + '12', color: riskAccent,
              fontWeight: 700, fontSize: 11, letterSpacing: '1px',
            }}>
              <span style={{ width: 6, height: 6, borderRadius: '50%', background: riskAccent }} />
              {selectedRisk?.label ?? 'LOW'}
            </span>
          )}
          <span style={{ color: justRefreshed ? '#B79145' : '#6B7280', transition: 'color 0.5s' }}>
            ⟳ Updated {updatedAgoText}
          </span>
        </div>
      </div>

      {view === 'campus' && (
        <RetaliationBanner retWin={retWin} campusName={selectedCampus.name} onBeginProtocol={handleBeginProtocol} />
      )}

      {view === 'network' && (
        <div style={{ display: 'flex', gap: 0, marginBottom: 24, borderBottom: '1px solid #E7E2D8' }}>
          {(['dashboard', 'map', 'news', 'intelligence', 'feed'] as NetworkTab[]).map(tab => (
            <button key={tab} onClick={() => setNetworkTab(tab)} style={{
              padding: '12px 22px', border: 'none', cursor: 'pointer',
              fontSize: 13, fontWeight: networkTab === tab ? 700 : 500,
              color: networkTab === tab ? '#121315' : '#6B7280',
              background: 'transparent',
              borderBottom: networkTab === tab ? '2px solid #B79145' : '2px solid transparent',
              textTransform: 'capitalize', transition: 'all 0.15s',
            }}>{tab}</button>
          ))}
        </div>
      )}

      {view === 'campus' && (
        <div style={{ display: 'flex', gap: 0, marginBottom: 24, borderBottom: '1px solid #E7E2D8' }}>
          {(['watch', 'feed'] as CampusTab[]).map(tab => (
            <button key={tab} onClick={() => setCampusTab(tab)} style={{
              padding: '12px 22px', border: 'none', cursor: 'pointer',
              fontSize: 13, fontWeight: campusTab === tab ? 700 : 500,
              color: campusTab === tab ? '#121315' : '#6B7280',
              background: 'transparent',
              borderBottom: campusTab === tab ? '2px solid #B79145' : '2px solid transparent',
              textTransform: 'capitalize', transition: 'all 0.15s',
            }}>{tab === 'watch' ? 'Watch' : 'Feed'}</button>
          ))}
        </div>
      )}

      {view === 'howItWorks' ? (
        <IntelligencePage />
      ) : view === 'campus' ? (
        campusTab === 'feed' ? (
          <FeedView
            incidents={allIncidents}
            iceAlerts={iceAlerts}
            campus={selectedCampus}
          />
        ) : (
        <div style={{ maxWidth: 800, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 20 }}>
          {initialLoading && <CampusSkeleton />}

          {/* ── CHAPTER 1: THE HEADLINE ── */}
          <SituationCard risk={selectedRisk} campusName={selectedCampus.name} onBeginProtocol={handleBeginProtocol} />

          {/* ── CHAPTER 2: THE BRIEF — AI summary, first thing they read ── */}
          <div ref={briefingRef}>
            <MorningBriefing campus={selectedCampus} risk={selectedRisk} iceAlerts={iceAlerts}
              incidents={allIncidents} newsItems={newsItems} tempF={tempF}
              onAskPulse={scrollToIntelQuery} />
          </div>

          {/* ── CHAPTER 3: RIGHT NOW — only renders if something active ── */}
          <RightNowBar schoolPeriod={schoolPeriod} minutesToArrival={minutesToArrival(now, selectedCampus)}
            minutesToDismissal={minutesToDismissal(now, selectedCampus)}
            riskLabel={selectedRisk.label as 'LOW' | 'ELEVATED' | 'HIGH' | 'CRITICAL'}
            incidents6h={incidents6h}
            scannerCalls={scannerData?.totalCalls}
            scannerSpikeZones={scannerData?.spikeZones.length} />
          {iceAlerts.length > 0 && (
            <IceIntelligence iceAlerts={iceAlerts} onInitiateCodeWhite={handleInitiateCodeWhite} />
          )}

          {/* ── CHAPTER 4: WHAT HAPPENED — violent crime feed, overnight + today ── */}
          <LastNight campus={selectedCampus} incidents={acuteIncidents}
            citizenIncidents={citizenIncidents} schoolPeriod={schoolPeriod} />
          <IncidentList campus={selectedCampus} incidents={allIncidents}
            contagionZones={selectedRisk.contagionZones} />

          {/* ── CHAPTER 5: THE MAP ── */}
          <CampusMap campus={selectedCampus} risk={selectedRisk} incidents={allIncidents}
            shotSpotterEvents={shotSpotterEvents}
            contagionZones={selectedRisk.contagionZones} corridors={corridors} />

          {/* ── CHAPTER 6: TOOLS — collapsed by default ── */}
          <CampusToolsDrawer>
            <ContextualEducation risk={selectedRisk} iceAlerts={iceAlerts} dataLoaded={!initialLoading} />
            <ContagionPanel zones={selectedRisk.contagionZones}
              inRetaliationWindow={selectedRisk.inRetaliationWindow}
              campusName={selectedCampus.name} campusId={selectedCampusId}
              allRisks={allRisks} forecast={forecast}
              onOpenForecast={scrollToForecast} onBeginProtocol={handleBeginProtocol} />
            <div ref={forecastRef}>
              <WeekForecast forecast={forecast} onScrollToBriefing={scrollToBriefing} />
            </div>
            <SafeCorridorMap campus={selectedCampus} corridors={corridors} schoolPeriod={schoolPeriod} />
            <EmergencyResponse onSelectCode={setActiveProtocol} recommendedCode={recommendedCode} />
            <div ref={intelQueryRef}>
              <IntelQuery campus={selectedCampus} risk={selectedRisk} />
            </div>
          </CampusToolsDrawer>

          {campusMemory.sinceLastVisit && (
            <SinceLastVisitCard data={campusMemory.sinceLastVisit} onDismiss={campusMemory.dismissCard} />
          )}
          <DataFreshness
            cpdLastUpdate={dataFreshness.cpdLastUpdate} cpdCount={dataFreshness.cpdCount}
            citizenLastUpdate={dataFreshness.citizenLastUpdate} citizenCount={dataFreshness.citizenCount}
            shotSpotterStatus={dataFreshness.shotSpotterStatus}
            newsLastUpdate={dataFreshness.newsLastUpdate} newsSourceCount={dataFreshness.newsSourceCount}
            iceAlertCount={iceAlerts.length}
            realtimeCount={dataFreshness.realtimeCount} realtimeLastUpdate={dataFreshness.realtimeLastUpdate}
            newsIncidentCount={dataFreshness.newsIncidentCount}
            scannerCalls={scannerData?.totalCalls}
            scannerSpikeZones={scannerData?.spikeZones.length} />
          <div style={{ fontSize: 11, color: '#6B7280', lineHeight: 1.6, padding: '16px 0', borderTop: '1px solid #E7E2D8', textAlign: 'center' }}>
            Data: Chicago Police Department, CPD Radio (OpenMHz), ShotSpotter acoustic sensors,
            RSS news (Block Club, WGN, ABC7, NBC5, CBS, Sun-Times, WBEZ, Fox 32), Open-Meteo weather.
            <br />Contagion model: Papachristos et al., Yale/UChicago. Risk engine updates every 90 seconds.
          </div>
        </div>
        )
      ) : (
        <div>
          {networkTab === 'dashboard' && (
            <NetworkDashboard risks={allRisks} summary={networkSummary} forecast={networkForecast}
              iceAlerts={iceAlerts} shotSpotterEvents={shotSpotterEvents}
              acuteIncidents={acuteIncidents} onSelectCampus={handleSelectCampusFromNetwork} />
          )}
          {networkTab === 'map' && (
            <div style={{ borderRadius: 12, overflow: 'hidden' }}>
              <NetworkMap risks={allRisks} zones={zones} incidents24h={acuteIncidents}
                iceAlerts={iceAlerts} onSelectCampus={handleSelectCampusFromNetwork} />
            </div>
          )}
          {networkTab === 'news' && (
            <div style={{ maxWidth: 900, margin: '0 auto' }}>
              <NewsView newsItems={newsItems} campusName={selectedCampus.short} />
            </div>
          )}
          {networkTab === 'intelligence' && (
            <div style={{ maxWidth: 1000, margin: '0 auto' }}>
              <Intelligence risks={allRisks} incidents={incidents} zones={zones} />
            </div>
          )}
          {networkTab === 'feed' && (
            <FeedView
              incidents={allIncidents}
              iceAlerts={iceAlerts}
              allCampuses={CAMPUSES}
            />
          )}
        </div>
      )}

      <footer style={{ textAlign: 'center', padding: '20px 16px', marginTop: 32, fontSize: 11, color: '#23272F', borderTop: '1px solid #E7E2D8' }}>
        <div style={{ color: '#23272F', letterSpacing: '0.5px' }}>Slate Watch — Start with the Facts — {weather.temperature.toFixed(0)}°F</div>
        <div style={{ fontSize: 9, color: '#6B7280', marginTop: 4 }}>Madden Education Advisory · Chicago, Illinois · 2026</div>
      </footer>
    </div>
  );
}

function SlateCampusDropdown({ campuses, selectedId, onSelect }: {
  campuses: typeof CAMPUSES; selectedId: number; onSelect: (id: number) => void;
}) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const ref = useRef<HTMLDivElement>(null);
  const selected = campuses.find(c => c.id === selectedId);
  const sorted = [...campuses].sort((a, b) => a.name.localeCompare(b.name));
  const filtered = search.trim()
    ? sorted.filter(c => c.name.toLowerCase().includes(search.toLowerCase()) || c.short.toLowerCase().includes(search.toLowerCase()) || c.communityArea.toLowerCase().includes(search.toLowerCase()))
    : sorted;
  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);
  return (
    <div ref={ref} style={{ position: 'relative' }}>
      <button onClick={() => { setOpen(!open); setSearch(''); }} style={{
        background: '#F7F5F1', border: '1px solid #E7E2D8', borderRadius: 10,
        padding: '8px 18px', fontSize: 13, fontWeight: 600, cursor: 'pointer',
        color: '#121315', display: 'flex', alignItems: 'center', gap: 8,
      }}>
        {selected?.short ?? 'Select campus'}
        <span style={{ fontSize: 10, opacity: 0.5 }}>▼</span>
      </button>
      {open && (
        <div style={{
          position: 'absolute', top: '100%', left: '50%', transform: 'translateX(-50%)',
          marginTop: 4, width: 300, background: '#fff', borderRadius: 12,
          boxShadow: '0 8px 30px rgba(0,0,0,0.15)', zIndex: 2000,
          overflow: 'hidden', border: '1px solid #E7E2D8',
        }}>
          <input autoFocus type="text" placeholder="Search campuses..." value={search} onChange={e => setSearch(e.target.value)}
            style={{ width: '100%', padding: '10px 14px', border: 'none', borderBottom: '1px solid #E7E2D8', fontSize: 13, outline: 'none', color: '#121315', boxSizing: 'border-box' }} />
          <div style={{ maxHeight: 280, overflowY: 'auto' }}>
            {filtered.map(c => (
              <button key={c.id} onClick={() => { onSelect(c.id); setOpen(false); }} style={{
                display: 'block', width: '100%', padding: '10px 14px', border: 'none',
                borderBottom: '1px solid #F7F5F1',
                background: c.id === selectedId ? '#F7F5F1' : '#fff',
                cursor: 'pointer', textAlign: 'left', fontSize: 13,
                color: c.id === selectedId ? '#121315' : '#23272F',
                fontWeight: c.id === selectedId ? 700 : 400,
              }}>
                <div>{c.short}</div>
                <div style={{ fontSize: 11, color: '#6B7280', marginTop: 2 }}>{c.communityArea}</div>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

const SKEL_SHIMMER = `@keyframes pulseShimmer { 0% { background-position: -400px 0; } 100% { background-position: 400px 0; } }`;
function SkeletonBar({ width, height = 16 }: { width: string; height?: number }) {
  return (<div style={{ width, height, borderRadius: 6, background: 'linear-gradient(90deg, #E7E2D8 0%, #F7F5F1 50%, #E7E2D8 100%)', backgroundSize: '800px 100%', animation: 'pulseShimmer 1.5s infinite linear' }} />);
}
function CampusSkeleton() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20, marginBottom: 8 }}>
      <style>{SKEL_SHIMMER}</style>
      <div style={{ padding: 20, borderRadius: 12, borderLeft: '4px solid #E7E2D8', background: '#F7F5F1' }}>
        <SkeletonBar width="85%" height={22} />
        <div style={{ marginTop: 10 }}><SkeletonBar width="60%" /></div>
        <div style={{ marginTop: 16 }}><SkeletonBar width="100%" height={44} /></div>
      </div>
      <div style={{ padding: '14px 20px', borderRadius: 12, background: '#F7F5F1' }}>
        <SkeletonBar width="100%" height={48} />
      </div>
    </div>
  );
}
