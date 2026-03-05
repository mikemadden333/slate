// @ts-nocheck
import { useState, useCallback, useRef } from 'react';
import { LedgerProvider } from './ledger-context/LedgerDataContext';
import DataUploadPanel from './ledger-modules/DataUploadPanel';
import CommandCenter from './ledger-modules/CommandCenter';
import FinancialTrajectory from './ledger-modules/FinancialTrajectory';
import CampusIntelligence from './ledger-modules/CampusIntelligence';
import EnrollmentObservatory from './ledger-modules/EnrollmentObservatory';
import CovenantStressLab from './ledger-modules/CovenantStressLab';
import ScenarioWarRoom from './ledger-modules/ScenarioWarRoom';
import NSTTracker from './ledger-modules/NSTTracker';
import CompensationRadar from './ledger-modules/CompensationRadar';
import CampusDashboard from './ledger-modules/CampusDashboard';
import CampusNetworkContext from './ledger-modules/CampusNetworkContext';
import CampusBudgetDetail from './ledger-modules/CampusBudgetDetail';

const CAMPUSES = [
  'Baker College Prep', 'Chicago Bulls College Prep', 'Butler College Prep',
  'Gary Comer College Prep', 'DRW College Prep', 'Golder College Prep',
  'Hansberry College Prep', 'Johnson College Prep', 'Mansueto High School',
  'Muchin College Prep', 'Noble Street College Prep', 'Pritzker College Prep',
  'Rauner College Prep', 'Rowe-Clark Math \& Science', 'ITW David Speer Academy',
  'The Noble Academy', 'UIC College Prep',
];

type NetworkModule = 'command-center' | 'financial-trajectory' | 'campus-intelligence' | 'enrollment-observatory' | 'covenant-stress-lab' | 'scenario-war-room' | 'nst-spending' | 'compensation-radar';
type CampusModule = 'campus-overview' | 'network-context' | 'budget-detail';
type AnyModule = NetworkModule | CampusModule;

const NETWORK_TABS: { id: NetworkModule; label: string }[] = [
  { id: 'command-center', label: 'Command Center' },
  { id: 'financial-trajectory', label: 'Financial Trajectory' },
  { id: 'campus-intelligence', label: 'Campus Intelligence' },
  { id: 'enrollment-observatory', label: 'Enrollment' },
  { id: 'covenant-stress-lab', label: 'Covenant Stress Lab' },
  { id: 'scenario-war-room', label: 'Scenario War Room' },
  { id: 'nst-spending', label: 'NST Spending' },
  { id: 'compensation-radar', label: 'Compensation Radar' },
];

const CAMPUS_TABS: { id: CampusModule; label: string }[] = [
  { id: 'campus-overview', label: 'Campus Overview' },
  { id: 'network-context', label: 'Network Context' },
  { id: 'budget-detail', label: 'Budget Detail' },
];

export default function LedgerApp() {
  const [viewMode, setViewMode] = useState<'network' | 'campus'>('network');
  const [activeModule, setActiveModule] = useState<AnyModule>('command-center');
  const [selectedCampus, setSelectedCampus] = useState<string | null>(null);
  const contentRef = useRef<HTMLDivElement>(null);

  const handleModuleChange = useCallback((mod: AnyModule) => {
    setActiveModule(mod);
    contentRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  const handleBackToNetwork = useCallback(() => {
    setViewMode('network');
    setActiveModule('command-center');
    setSelectedCampus(null);
  }, []);

  const tabs = viewMode === 'network' ? NETWORK_TABS : CAMPUS_TABS;

  const renderModule = () => {
    switch (activeModule) {
      case 'command-center': return <CommandCenter />;
      case 'financial-trajectory': return <FinancialTrajectory />;
      case 'campus-intelligence': return <CampusIntelligence />;
      case 'enrollment-observatory': return <EnrollmentObservatory />;
      case 'covenant-stress-lab': return <CovenantStressLab />;
      case 'scenario-war-room': return <ScenarioWarRoom />;
      case 'nst-spending': return <NSTTracker />;
      case 'compensation-radar': return <CompensationRadar />;
      case 'campus-overview': return <CampusDashboard campusName={selectedCampus ?? ''} />;
      case 'network-context': return <CampusNetworkContext campusName={selectedCampus ?? ''} />;
      case 'budget-detail': return <CampusBudgetDetail campusName={selectedCampus ?? ''} />;
      default: return <CommandCenter />;
    }
  };

  return (
    <LedgerProvider>
    <div style={{ fontFamily: "'Inter', system-ui, sans-serif", color: '#0D1117' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16, gap: 12 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <button onClick={handleBackToNetwork} style={{
            padding: '9px 20px', borderRadius: 10, border: 'none', cursor: 'pointer',
            fontSize: 13, fontWeight: viewMode === 'network' ? 700 : 500,
            color: viewMode === 'network' ? '#0D1117' : '#4A5568',
            background: viewMode === 'network' ? '#E8EDF2' : 'transparent',
          }}>Network</button>
          <button onClick={() => { if (!selectedCampus) setSelectedCampus(CAMPUSES[0]); setViewMode('campus'); setActiveModule('campus-overview'); }} style={{
            padding: '9px 20px', borderRadius: 10, border: 'none', cursor: 'pointer',
            fontSize: 13, fontWeight: viewMode === 'campus' ? 700 : 500,
            color: viewMode === 'campus' ? '#0D1117' : '#4A5568',
            background: viewMode === 'campus' ? '#E8EDF2' : 'transparent',
          }}>Campus</button>
        </div>
        {viewMode === 'campus' && (
          <select value={selectedCampus ?? ''} onChange={e => setSelectedCampus(e.target.value)} style={{
            padding: '8px 14px', borderRadius: 10, border: '1px solid #E8EDF2',
            fontSize: 13, fontWeight: 600, color: '#0D1117', background: '#F0F4F8', cursor: 'pointer',
          }}>
            {CAMPUSES.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
        )}
      </div>

      <div style={{ display: 'flex', gap: 0, marginBottom: 24, overflowX: 'auto', borderBottom: '1px solid #E8EDF2' }}>
        {tabs.map(tab => (
          <button key={tab.id} onClick={() => handleModuleChange(tab.id)} style={{
            padding: '12px 20px', border: 'none', cursor: 'pointer',
            fontSize: 13, fontWeight: activeModule === tab.id ? 700 : 500,
            color: activeModule === tab.id ? '#0D1117' : '#4A5568',
            background: 'transparent', whiteSpace: 'nowrap',
            borderBottom: activeModule === tab.id ? '2px solid #F0B429' : '2px solid transparent',
            transition: 'all 0.15s',
          }}>{tab.label}</button>
        ))}
      </div>

      <DataUploadPanel />
      <div ref={contentRef}>{renderModule()}</div>

      <footer style={{ textAlign: 'center', padding: '20px 16px', marginTop: 32, fontSize: 11, color: '#4A5568', borderTop: '1px solid #E8EDF2' }}>
        <div>Slate Ledger — Noble Schools — $240M Annual Budget — FY2026</div>
        <div style={{ fontSize: 9, color: '#94A3B8', marginTop: 4 }}>Slate Systems, LLC · Madden Advisory Group · 2026</div>
      </footer>
    </div>
    </LedgerProvider>
  );
}
