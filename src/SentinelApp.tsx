/**
 * PULSE 2.0 — Main Application
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
import OnboardingRevelation from './sentinel-components/shared/OnboardingRevelation';
import CampusSelector, { shouldShowSelector, getLastCampusId, saveSelectedCampus, markSelectorDismissed } from './sentinel-components/shared/CampusSelector';
import IntelligencePage from './sentinel-components/shared/IntelligencePage';

type View = 'campus' | 'network' | 'howItWorks';
type NetworkTab = 'dashboard' | 'map' | 'news' | 'intelligence';

export default function App() {
  // --- Navigation ---
  const [view, setView] = useState<View>('campus');
  const [networkTab, setNetworkTab] = useState<NetworkTab>('dashboard');
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
    const merged = [...acuteIncidents, ...incidents, ...realtimeIncidents, ...newsIncidents];
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
  const incidents30d1mi = useMemo(() => {
    return incidents.filter(inc =>
      haversine(selectedCampus.lat, selectedCampus.lng, inc.lat, inc.lng) <= 1.0,
    ).length;
  }, [incidents, selectedCampus]);

  // Retaliation window state
  const retWin = useRetaliationWindow(selectedRisk);

  // Campus memory layer
  const campusMemory = useCampusMemory(selectedCampusId, selectedRisk);

  // Risk-colored header background — deeper red during retaliation window
  const riskColor = selectedRisk ? RISK_COLORS[selectedRisk.label].color : '#1B3A6B';
  const headerBg = view === 'campus'
    ? (retWin.active ? '#7F1D1D' : riskColor)
    : '#1B3A6B';

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

  useEffect(() => {
    void Promise.all([refresh90s(), refresh10min(), refresh30min(), refresh5min(), refreshCitizen()])
      .finally(() => setInitialLoading(false));
    const t90s = setInterval(() => void refresh90s(), 90_000);
    const t10m = setInterval(() => void refresh10min(), 600_000);
    const t30m = setInterval(() => void refresh30min(), 1_800_000);
    const t5m = setInterval(() => void refresh5min(), 300_000);
    const tCit = setInterval(() => void refreshCitizen(), 300_000);
    return () => { clearInterval(t90s); clearInterval(t10m); clearInterval(t30m); clearInterval(t5m); clearInterval(tCit); };
  }, [refresh90s, refresh10min, refresh30min, refresh5min, refreshCitizen]);

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
  return (
    <div style={{ fontFamily: "system-ui, -apple-system, sans-serif", color: '#111827' }}>
      {/* Campus Selector — after splash, before onboarding */}
      {showCampusSelector && (
        <CampusSelector
          onSelectCampus={(id) => {
            setSelectedCampusId(id);
            saveSelectedCampus(id);
            setShowCampusSelector(false);
            setView('campus');
          }}
          onSelectNetwork={() => {
            markSelectorDismissed();
            setShowCampusSelector(false);
            setView('network');
          }}
        />
      )}

      {/* Onboarding */}
      {showOnboarding && (
        <OnboardingRevelation
          campus={selectedCampus}
          incidents30d={incidents30d1mi}
          contagionZoneCount={selectedRisk?.contagionZones.length ?? 0}
          inContagionZone={(selectedRisk?.contagionZones.length ?? 0) > 0}
          onComplete={handleCompleteOnboarding}
        />
      )}

      {/* Protocol Modal */}
      {activeProtocol && (
        <ProtocolModal
          code={activeProtocol}
          campus={selectedCampus}
          risk={selectedRisk}
          onClose={() => setActiveProtocol(null)}
        />
      )}

      {/* Command Center */}
      {showCommandCenter && (
        <CommandCenter
          risks={allRisks}
          incidents={incidents}
          acuteIncidents={acuteIncidents}
          shotSpotterEvents={shotSpotterEvents}
          zones={zones}
          newsItems={newsItems}
          iceAlerts={iceAlerts}
          forecast={networkForecast}
          networkSummary={networkSummary}
          onClose={() => setShowCommandCenter(false)}
          onSelectCampus={handleSelectCampusFromNetwork}
        />
      )}

      {/* 72px Risk-Colored Header */}
      <nav style={{
        height: 72,
        background: headerBg,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 20px',
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        zIndex: 1000,
        transition: 'background 600ms ease',
      }}>
        {/* Left: PULSE + view toggle */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ color: '#fff', fontWeight: 800, fontSize: 22, letterSpacing: 3 }}>
            Sentinel<span style={{ color: '#F0B429' }}>.</span>
          </div>
          <div style={{ display: 'flex', gap: 4 }}>
            <NavBtn label="My Campus" active={view === 'campus'} onClick={() => setView('campus')} />
            <NavBtn label="Network" active={view === 'network'} onClick={() => setView('network')} />
            {view === 'network' && (
              <NavBtn label="Command" active={showCommandCenter} onClick={() => setShowCommandCenter(true)} />
            )}
            <NavBtn label="How It Works" active={view === 'howItWorks'} onClick={() => setView('howItWorks')} />
          </div>
        </div>

        {/* Center: Campus switcher */}
        {view === 'campus' ? (
          <NavCampusSelector
            campuses={CAMPUSES}
            selectedId={selectedCampusId}
            onSelect={setSelectedCampusId}
          />
        ) : view === 'network' ? (
          <div style={{ color: '#fff', fontWeight: 600, fontSize: 16 }}>
            Noble Network
          </div>
        ) : (
          <div style={{ color: '#fff', fontWeight: 600, fontSize: 16 }}>
            How Sentinel Works
          </div>
        )}

        {/* Right: Updated timestamp — green flash on refresh */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: 6,
          color: justRefreshed ? '#86EFAC' : 'rgba(255,255,255,0.8)',
          fontSize: 13,
          transition: 'color 0.5s ease',
        }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M23 4v6h-6M1 20v-6h6" />
            <path d="M3.51 9a9 9 0 0114.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0020.49 15" />
          </svg>
          Updated {updatedAgoText}
        </div>
      </nav>

      {/* Retaliation window banner — persistent, always visible during active window */}
      {view === 'campus' && (
        <RetaliationBanner
          retWin={retWin}
          campusName={selectedCampus.name}
          onBeginProtocol={handleBeginProtocol}
        />
      )}

      {/* Sub-navigation for network view */}
      {view === 'network' && (
        <div style={{
          position: 'fixed',
          top: 72,
          left: 0,
          right: 0,
          height: 48,
          background: '#fff',
          borderBottom: '1px solid #E5E7EB',
          display: 'flex',
          alignItems: 'center',
          gap: 4,
          padding: '0 16px',
          zIndex: 999,
        }}>
          {(['dashboard', 'map', 'news', 'intelligence'] as NetworkTab[]).map(tab => (
            <button
              key={tab}
              onClick={() => setNetworkTab(tab)}
              style={{
                padding: '6px 16px',
                borderRadius: 6,
                fontSize: 14,
                fontWeight: networkTab === tab ? 700 : 400,
                color: networkTab === tab ? '#1B3A6B' : '#6B7280',
                background: networkTab === tab ? '#F3F4F6' : 'transparent',
                border: 'none',
                cursor: 'pointer',
                textTransform: 'capitalize',
                minHeight: 44,
              }}
            >
              {tab}
            </button>
          ))}
        </div>
      )}

      {/* Main content */}
      <main style={{
        marginTop: view === 'network' ? 120 : (72 + retBannerHeight),
        minHeight: 'calc(100vh - 72px)',
        background: view === 'howItWorks' ? 'transparent' : '#fff',
        transition: 'margin-top 200ms ease',
      }}>
        {view === 'howItWorks' ? (
          <IntelligencePage />
        ) : view === 'campus' ? (
          <div style={{ padding: '24px 16px', maxWidth: 800, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 24 }}>
            {initialLoading && <CampusSkeleton />}

            {/* Since you were last here */}
            {campusMemory.sinceLastVisit && (
              <SinceLastVisitCard
                data={campusMemory.sinceLastVisit}
                onDismiss={campusMemory.dismissCard}
              />
            )}

            {/* 1. The Situation */}
            <SituationCard
              risk={selectedRisk}
              campusName={selectedCampus.name}
              onBeginProtocol={handleBeginProtocol}
            />

            {/* Contextual education moments */}
            <ContextualEducation
              risk={selectedRisk}
              iceAlerts={iceAlerts}
              dataLoaded={!initialLoading}
            />

            {/* 2. School Day Bar */}
            <RightNowBar
              schoolPeriod={schoolPeriod}
              minutesToArrival={minutesToArrival(now, selectedCampus)}
              minutesToDismissal={minutesToDismissal(now, selectedCampus)}
              riskLabel={selectedRisk.label as 'LOW' | 'ELEVATED' | 'HIGH' | 'CRITICAL'}
              incidents6h={incidents6h}
            />

            {/* 2.5. Last Night summary — only visible before 8am */}
            <LastNight
              campus={selectedCampus}
              incidents={acuteIncidents}
              citizenIncidents={citizenIncidents}
              schoolPeriod={schoolPeriod}
            />

            {/* 3. Morning Intelligence Briefing */}
            <div ref={briefingRef}>
              <MorningBriefing
                campus={selectedCampus}
                risk={selectedRisk}
                iceAlerts={iceAlerts}
                incidents={allIncidents}
                newsItems={newsItems}
                tempF={tempF}
                onAskPulse={scrollToIntelQuery}
              />
            </div>

            {/* 4. Contagion Intelligence */}
            <ContagionPanel
              zones={selectedRisk.contagionZones}
              inRetaliationWindow={selectedRisk.inRetaliationWindow}
              campusName={selectedCampus.name}
              campusId={selectedCampusId}
              allRisks={allRisks}
              forecast={forecast}
              onOpenForecast={scrollToForecast}
              onBeginProtocol={handleBeginProtocol}
            />

            {/* 5. ICE Intelligence — informational, not emergency */}
            <IceIntelligence iceAlerts={iceAlerts} onInitiateCodeWhite={handleInitiateCodeWhite} />

            {/* 6. Campus Map */}
            <CampusMap
              campus={selectedCampus}
              risk={selectedRisk}
              incidents={allIncidents}
              shotSpotterEvents={shotSpotterEvents}
              contagionZones={selectedRisk.contagionZones}
              corridors={corridors}
            />

            {/* 5. 7-Day Forecast */}
            <div ref={forecastRef}>
              <WeekForecast
                forecast={forecast}
                onScrollToBriefing={scrollToBriefing}
              />
            </div>

            {/* 6. Recent Incidents */}
            <IncidentList
              campus={selectedCampus}
              incidents={allIncidents}
              contagionZones={selectedRisk.contagionZones}
            />

            {/* 7. Safe Corridors */}
            <SafeCorridorMap campus={selectedCampus} corridors={corridors} schoolPeriod={schoolPeriod} />

            {/* 9. Emergency Response */}
            <EmergencyResponse
              onSelectCode={setActiveProtocol}
              recommendedCode={recommendedCode}
            />

            {/* 10. Ask Sentinel */}
            <div ref={intelQueryRef}>
              <IntelQuery campus={selectedCampus} risk={selectedRisk} />
            </div>

            {/* 11. Data Freshness */}
            <DataFreshness
              cpdLastUpdate={dataFreshness.cpdLastUpdate}
              cpdCount={dataFreshness.cpdCount}
              citizenLastUpdate={dataFreshness.citizenLastUpdate}
              citizenCount={dataFreshness.citizenCount}
              shotSpotterStatus={dataFreshness.shotSpotterStatus}
              newsLastUpdate={dataFreshness.newsLastUpdate}
              newsSourceCount={dataFreshness.newsSourceCount}
              iceAlertCount={iceAlerts.length}
              realtimeCount={dataFreshness.realtimeCount}
              realtimeLastUpdate={dataFreshness.realtimeLastUpdate}
              newsIncidentCount={dataFreshness.newsIncidentCount}
            />

            {/* 12. Data Source Footer */}
            <div style={{
              fontSize: 11, color: '#9CA3AF', lineHeight: 1.6,
              padding: '16px 0', borderTop: '1px solid #E5E7EB',
              textAlign: 'center',
            }}>
              Data: Chicago Police Department (CPD), ShotSpotter acoustic sensors, Citizen app scanner feed,
              RSS news (Block Club, WGN, ABC7, NBC, Sun-Times, WBEZ, Chalkbeat), Open-Meteo weather.
              <br />
              Contagion model: Papachristos et al., Yale/UChicago. Risk engine updates every 90 seconds.
            </div>
          </div>
        ) : (
          <div>
            {networkTab === 'dashboard' && (
              <NetworkDashboard
                risks={allRisks}
                summary={networkSummary}
                forecast={networkForecast}
                iceAlerts={iceAlerts}
                shotSpotterEvents={shotSpotterEvents}
                acuteIncidents={acuteIncidents}
                onSelectCampus={handleSelectCampusFromNetwork}
              />
            )}
            {networkTab === 'map' && (
              <div style={{ padding: 16 }}>
                <NetworkMap
                  risks={allRisks}
                  zones={zones}
                  incidents24h={acuteIncidents}
                  iceAlerts={iceAlerts}
                  onSelectCampus={handleSelectCampusFromNetwork}
                />
              </div>
            )}
            {networkTab === 'news' && (
              <div style={{ padding: 16, maxWidth: 900, margin: '0 auto' }}>
                <NewsView newsItems={newsItems} campusName={selectedCampus.short} />
              </div>
            )}
            {networkTab === 'intelligence' && (
              <div style={{ padding: 16, maxWidth: 1000, margin: '0 auto' }}>
                <Intelligence risks={allRisks} incidents={incidents} zones={zones} />
              </div>
            )}
          </div>
        )}
      </main>

      {/* Floating help button */}
      {!showCampusSelector && (
        <button
          onClick={() => setView('howItWorks')}
          style={{
            position: 'fixed', bottom: 24, right: 24, zIndex: 900,
            width: 48, height: 48, borderRadius: '50%',
            background: '#1B3A6B', color: '#F0B429', border: 'none',
            fontSize: 22, fontWeight: 700, cursor: 'pointer',
            boxShadow: '0 4px 12px rgba(0,0,0,0.25)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            transition: 'transform 200ms ease, box-shadow 200ms ease',
          }}
          title="How Sentinel Works"
          onMouseEnter={e => { e.currentTarget.style.transform = 'scale(1.1)'; }}
          onMouseLeave={e => { e.currentTarget.style.transform = 'scale(1)'; }}
        >
          ?
        </button>
      )}

      {/* Footer */}
      <footer style={{
        textAlign: 'center',
        padding: '16px',
        fontSize: 12,
        color: '#1B3A6B',
        borderTop: '1px solid #E5E7EB',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 6,
      }}>
        <svg width="14" height="17" viewBox="0 0 28 34" style={{ flexShrink: 0 }}>
          <path d="M14 1L2 7v12c0 9.3 5.1 17.9 12 21.5 6.9-3.6 12-12.2 12-21.5V7L14 1z"
            fill="#1B3A6B" stroke="#F0B429" strokeWidth="1.5"/>
          <text x="14" y="20" textAnchor="middle" fill="#fff" fontSize="9"
            fontWeight="800" fontFamily="system-ui">N</text>
        </svg>
        <span>Slate Sentinel — Noble Schools — Chicago, Illinois — {weather.temperature.toFixed(0)}°F</span>
      </footer>
    </div>
  );
}

function NavBtn({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      style={{
        background: active ? 'rgba(255,255,255,0.22)' : 'transparent',
        color: '#fff',
        border: '1px solid rgba(255,255,255,0.3)',
        borderRadius: 8,
        padding: '8px 16px',
        cursor: 'pointer',
        fontSize: 14,
        fontWeight: active ? 700 : 400,
        minHeight: 44,
        borderBottom: active ? '3px solid #F0B429' : '3px solid transparent',
      }}
    >
      {label}
    </button>
  );
}

function NavCampusSelector({ campuses, selectedId, onSelect }: {
  campuses: typeof CAMPUSES;
  selectedId: number;
  onSelect: (id: number) => void;
}) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const ref = useRef<HTMLDivElement>(null);

  const selected = campuses.find(c => c.id === selectedId);
  const sorted = [...campuses].sort((a, b) => a.name.localeCompare(b.name));
  const filtered = search.trim()
    ? sorted.filter(c =>
        c.name.toLowerCase().includes(search.toLowerCase()) ||
        c.short.toLowerCase().includes(search.toLowerCase()) ||
        c.communityArea.toLowerCase().includes(search.toLowerCase())
      )
    : sorted;

  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  return (
    <div ref={ref} style={{ position: 'relative' }}>
      <button
        onClick={() => { setOpen(!open); setSearch(''); }}
        style={{
          background: 'rgba(255,255,255,0.18)',
          color: '#fff',
          border: '1px solid rgba(255,255,255,0.35)',
          borderRadius: 8,
          padding: '8px 16px',
          fontSize: 15,
          fontWeight: 600,
          cursor: 'pointer',
          minHeight: 44,
          display: 'flex',
          alignItems: 'center',
          gap: 8,
        }}
      >
        {selected?.short ?? 'Select campus'}
        <span style={{ fontSize: 10, opacity: 0.7 }}>▼</span>
      </button>
      {open && (
        <div style={{
          position: 'absolute',
          top: '100%',
          left: '50%',
          transform: 'translateX(-50%)',
          marginTop: 4,
          width: 280,
          background: '#fff',
          borderRadius: 10,
          boxShadow: '0 8px 30px rgba(0,0,0,0.25)',
          zIndex: 2000,
          overflow: 'hidden',
        }}>
          <input
            autoFocus
            type="text"
            placeholder="Search campuses..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            style={{
              width: '100%',
              padding: '10px 14px',
              border: 'none',
              borderBottom: '1px solid #E5E7EB',
              fontSize: 14,
              outline: 'none',
              color: '#111827',
              boxSizing: 'border-box',
            }}
          />
          <div style={{ maxHeight: 260, overflowY: 'auto' }}>
            {filtered.map(c => (
              <button
                key={c.id}
                onClick={() => { onSelect(c.id); setOpen(false); }}
                style={{
                  display: 'block',
                  width: '100%',
                  padding: '10px 14px',
                  border: 'none',
                  borderBottom: '1px solid #F3F4F6',
                  background: c.id === selectedId ? '#EEF2F9' : '#fff',
                  cursor: 'pointer',
                  textAlign: 'left',
                  fontSize: 14,
                  color: c.id === selectedId ? '#1B3A6B' : '#374151',
                  fontWeight: c.id === selectedId ? 700 : 400,
                  minHeight: 44,
                }}
              >
                <div>{c.short}</div>
                <div style={{ fontSize: 11, color: '#9CA3AF' }}>{c.communityArea}</div>
              </button>
            ))}
            {filtered.length === 0 && (
              <div style={{ padding: '16px 14px', color: '#9CA3AF', fontSize: 13, textAlign: 'center' }}>
                No campuses match "{search}"
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

const SKEL_SHIMMER = `
@keyframes pulseShimmer {
  0% { background-position: -400px 0; }
  100% { background-position: 400px 0; }
}
`;

function SkeletonBar({ width, height = 16 }: { width: string; height?: number }) {
  return (
    <div style={{
      width, height, borderRadius: 4,
      background: 'linear-gradient(90deg, #E5E7EB 0%, #F3F4F6 50%, #E5E7EB 100%)',
      backgroundSize: '800px 100%',
      animation: 'pulseShimmer 1.5s infinite linear',
    }} />
  );
}

function CampusSkeleton() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20, marginBottom: 8 }}>
      <style>{SKEL_SHIMMER}</style>
      {/* Situation card skeleton */}
      <div style={{ padding: 20, borderRadius: 12, borderLeft: '6px solid #E5E7EB', background: '#FAFAFA' }}>
        <SkeletonBar width="85%" height={22} />
        <div style={{ marginTop: 10 }}><SkeletonBar width="60%" /></div>
        <div style={{ marginTop: 16 }}><SkeletonBar width="100%" height={44} /></div>
        <div style={{ marginTop: 16, display: 'flex', alignItems: 'center', gap: 12 }}>
          <SkeletonBar width="60px" height={48} />
          <SkeletonBar width="80px" height={24} />
        </div>
        <div style={{ marginTop: 12 }}><SkeletonBar width="100%" height={12} /></div>
      </div>
      {/* School day bar skeleton */}
      <div style={{ padding: '14px 20px', borderRadius: 12, background: '#FAFAFA' }}>
        <SkeletonBar width="100%" height={48} />
      </div>
      {/* Briefing skeleton */}
      <div style={{ padding: 20, borderRadius: 12, borderLeft: '4px solid #E5E7EB', background: '#FEF9EC' }}>
        <SkeletonBar width="60%" height={20} />
        <div style={{ marginTop: 16 }}><SkeletonBar width="90%" height={18} /></div>
        <div style={{ marginTop: 12 }}><SkeletonBar width="80%" height={18} /></div>
        <div style={{ marginTop: 12 }}><SkeletonBar width="70%" height={18} /></div>
      </div>
    </div>
  );
}
