import { useState, useCallback, useRef } from 'react';
import {
  LayoutDashboard,
  TrendingUp,
  Building2,
  Users,
  Shield,
  SlidersHorizontal,
  Receipt,
  DollarSign,
  ArrowLeftRight,
  Printer,
  ChevronRight,
} from 'lucide-react';
import { NOBLE, BG, TEXT } from './theme/colors';
import SectionHeader from './sentinel-components/SectionHeader';
import SplashScreen from './sentinel-components/SplashScreen';
import RoleSelector from './sentinel-components/RoleSelector';
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

/* ── Network module types ─────────────────────────────────── */

type NetworkModule =
  | 'command-center'
  | 'financial-trajectory'
  | 'campus-intelligence'
  | 'enrollment-observatory'
  | 'covenant-stress-lab'
  | 'scenario-war-room'
  | 'nst-spending'
  | 'compensation-radar';

type CampusModule =
  | 'campus-overview'
  | 'network-context'
  | 'budget-detail';

type AnyModule = NetworkModule | CampusModule;

interface NavItem {
  id: AnyModule;
  label: string;
  icon: typeof LayoutDashboard;
}

const NETWORK_NAV: NavItem[] = [
  { id: 'command-center', label: 'Command Center', icon: LayoutDashboard },
  { id: 'financial-trajectory', label: 'Financial Trajectory', icon: TrendingUp },
  { id: 'campus-intelligence', label: 'Campus Intelligence', icon: Building2 },
  { id: 'enrollment-observatory', label: 'Enrollment Observatory', icon: Users },
  { id: 'covenant-stress-lab', label: 'Covenant Stress Lab', icon: Shield },
  { id: 'scenario-war-room', label: 'Scenario War Room', icon: SlidersHorizontal },
  { id: 'nst-spending', label: 'NST Spending', icon: Receipt },
  { id: 'compensation-radar', label: 'Compensation Radar', icon: DollarSign },
];

const CAMPUS_NAV: NavItem[] = [
  { id: 'campus-overview', label: 'Campus Overview', icon: LayoutDashboard },
  { id: 'network-context', label: 'Network Context', icon: Building2 },
  { id: 'budget-detail', label: 'Budget Detail', icon: Receipt },
];

const MODULE_LABELS: Record<string, string> = {
  'command-center': 'Command Center',
  'financial-trajectory': 'Financial Trajectory',
  'campus-intelligence': 'Campus Intelligence',
  'enrollment-observatory': 'Enrollment Observatory',
  'covenant-stress-lab': 'Covenant Stress Lab',
  'scenario-war-room': 'Scenario War Room',
  'nst-spending': 'NST Spending',
  'compensation-radar': 'Compensation Radar',
  'campus-overview': 'Campus Overview',
  'network-context': 'Network Context',
  'budget-detail': 'Budget Detail',
};

const MODULE_SUBTITLES: Record<string, string> = {
  'command-center': 'Executive overview of Noble Schools financial health',
  'financial-trajectory': 'FY20–FY26 revenue, expenses, EBITDA, and DSCR trends',
  'campus-intelligence': '17-campus financial comparison and per-pupil analysis',
  'enrollment-observatory': 'Enrollment scenarios and CPS market share projections',
  'covenant-stress-lab': 'Bond covenant compliance and distance-to-danger metrics',
  'scenario-war-room': 'Three-scenario FY27–FY31 financial projections',
  'nst-spending': 'Network Support Team departmental budget variance',
  'compensation-radar': 'Personnel cost drivers, CPS salary gap, and benefits pressure',
};

/* ── App ──────────────────────────────────────────────────── */

export default function LedgerApp() {
  const [showSplash, setShowSplash] = useState(true);
  const [userRole, setUserRole] = useState<'network' | 'campus' | null>(null);
  const [selectedCampus, setSelectedCampus] = useState<string | null>(null);
  const [activeModule, setActiveModule] = useState<AnyModule>('command-center');
  const [fadeKey, setFadeKey] = useState(0);
  const mainRef = useRef<HTMLElement>(null);

  const handleSplashComplete = useCallback(() => setShowSplash(false), []);

  const handleSelectNetwork = useCallback(() => {
    setUserRole('network');
    setSelectedCampus(null);
    setActiveModule('command-center');
  }, []);

  const handleSelectCampus = useCallback((name: string) => {
    setUserRole('campus');
    setSelectedCampus(name);
    setActiveModule('campus-overview');
  }, []);

  const handleSwitchView = useCallback(() => {
    setUserRole(null);
    setSelectedCampus(null);
  }, []);

  const handleNavClick = useCallback((id: AnyModule) => {
    setActiveModule(id);
    setFadeKey(k => k + 1);
    // Scroll to top on module switch
    if (mainRef.current) {
      mainRef.current.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }, []);

  // Splash screen
  if (showSplash) {
    return <SplashScreen onComplete={handleSplashComplete} />;
  }

  // Role selector
  if (userRole === null) {
    return <RoleSelector onSelectNetwork={handleSelectNetwork} onSelectCampus={handleSelectCampus} />;
  }

  // Dashboard
  const navItems = userRole === 'network' ? NETWORK_NAV : CAMPUS_NAV;
  const breadcrumbRoot = userRole === 'network' ? 'Network' : selectedCampus ?? 'Campus';

  return (
    <div style={{
      display: 'flex',
      height: '100vh',
      background: BG.app,
      fontFamily: "'Inter', sans-serif",
    }}>
      {/* Sidebar — Noble Navy */}
      <aside style={{
        width: 280,
        minWidth: 280,
        background: BG.sidebar,
        display: 'flex',
        flexDirection: 'column',
        position: 'fixed',
        top: 0,
        left: 0,
        bottom: 0,
        zIndex: 100,
      }}>
        {/* Logo Area */}
        <div style={{
          padding: '24px 20px 20px',
          borderBottom: '1px solid rgba(255,255,255,0.12)',
        }}>
          <div style={{
            background: BG.surface,
            borderRadius: 8,
            padding: '14px 16px',
          }}>
            <div style={{
              fontSize: 16,
              fontWeight: 800,
              color: NOBLE.navy,
              letterSpacing: '0.08em',
              fontFamily: "'Inter', sans-serif",
            }}>
              NOBLE SCHOOLS
            </div>
          </div>
          <div style={{
            fontSize: 13,
            color: NOBLE.gold,
            fontFamily: "'Inter', sans-serif",
            fontWeight: 500,
            marginTop: 8,
            paddingLeft: 2,
          }}>
            Financial Intelligence Platform
          </div>
        </div>

        {/* Navigation */}
        <nav style={{
          flex: 1,
          overflowY: 'auto',
          padding: '12px 0',
        }}>
          {navItems.map(item => (
            <SidebarNavItem
              key={item.id}
              item={item}
              active={activeModule === item.id}
              onClick={handleNavClick}
            />
          ))}
        </nav>

        {/* Footer — role badge + switch view */}
        <div style={{
          padding: '12px 20px 16px',
          borderTop: '1px solid rgba(255,255,255,0.12)',
        }}>
          {/* Role badge */}
          <div style={{
            fontSize: 12,
            fontFamily: "'DM Mono', monospace",
            color: userRole === 'campus' ? NOBLE.gold : TEXT.onNavyMuted,
            marginBottom: 8,
          }}>
            {userRole === 'campus' && selectedCampus
              ? `${selectedCampus} Campus`
              : 'Network View'
            }
          </div>

          {/* Switch view */}
          <button
            onClick={handleSwitchView}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              background: 'none',
              border: 'none',
              color: TEXT.onNavyMuted,
              fontSize: 11,
              fontFamily: "'Inter', sans-serif",
              cursor: 'pointer',
              padding: 0,
              transition: 'color 0.15s ease',
            }}
            onMouseEnter={e => (e.currentTarget.style.color = TEXT.onNavy)}
            onMouseLeave={e => (e.currentTarget.style.color = TEXT.onNavyMuted)}
          >
            <ArrowLeftRight size={12} />
            Switch View
          </button>

          {/* Date + Print hint */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginTop: 8,
          }}>
            <div style={{
              fontSize: 11,
              color: TEXT.onNavyMuted,
              fontFamily: "'Inter', sans-serif",
            }}>
              FY26 YTD Jan 2026
            </div>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: 4,
              fontSize: 10,
              color: TEXT.onNavyMuted,
              opacity: 0.6,
            }}>
              <Printer size={10} />
              Ctrl+P
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main
        ref={mainRef}
        style={{
          marginLeft: 280,
          flex: 1,
          overflowY: 'auto',
          padding: 32,
          background: BG.app,
        }}
      >
        {/* Breadcrumb */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: 6,
          fontSize: 12,
          fontFamily: "'Inter', sans-serif",
          color: TEXT.dim,
          marginBottom: 16,
        }}>
          <span>{breadcrumbRoot}</span>
          <ChevronRight size={12} />
          <span style={{ color: TEXT.muted }}>
            {MODULE_LABELS[activeModule] ?? activeModule}
          </span>
        </div>

        {/* Module content with fade transition */}
        <div
          key={fadeKey}
          style={{
            animation: 'fadeIn 0.3s ease-out',
          }}
        >
          {userRole === 'network' ? (
            <NetworkModuleView module={activeModule as NetworkModule} />
          ) : (
            <CampusModuleView module={activeModule as CampusModule} campusName={selectedCampus!} />
          )}
        </div>
      </main>
    </div>
  );
}

/* ── Module renderers ─────────────────────────────────────── */

function NetworkModuleView({ module }: { module: NetworkModule }) {
  switch (module) {
    case 'command-center': return <CommandCenter />;
    case 'financial-trajectory': return <FinancialTrajectory />;
    case 'campus-intelligence': return <CampusIntelligence />;
    case 'enrollment-observatory': return <EnrollmentObservatory />;
    case 'covenant-stress-lab': return <CovenantStressLab />;
    case 'scenario-war-room': return <ScenarioWarRoom />;
    case 'nst-spending': return <NSTTracker />;
    case 'compensation-radar': return <CompensationRadar />;
    default:
      return (
        <div>
          <SectionHeader title="Module" subtitle={MODULE_SUBTITLES[module] ?? ''} />
          <div style={{ color: TEXT.dim, fontSize: 14, padding: '40px 0', textAlign: 'center' }}>
            Module content coming soon.
          </div>
        </div>
      );
  }
}

function CampusModuleView({ module, campusName }: { module: CampusModule; campusName: string }) {
  switch (module) {
    case 'campus-overview': return <CampusDashboard campusName={campusName} />;
    case 'network-context': return <CampusNetworkContext campusName={campusName} />;
    case 'budget-detail': return <CampusBudgetDetail campusName={campusName} />;
    default: return <CampusDashboard campusName={campusName} />;
  }
}

/* ── Sidebar nav item ─────────────────────────────────────── */

function SidebarNavItem({
  item,
  active,
  onClick,
}: {
  item: NavItem;
  active: boolean;
  onClick: (id: AnyModule) => void;
}) {
  const [hovered, setHovered] = useState(false);
  const Icon = item.icon;

  return (
    <button
      onClick={() => onClick(item.id)}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 12,
        width: '100%',
        padding: '11px 20px',
        fontSize: 14,
        fontFamily: "'Inter', sans-serif",
        fontWeight: active ? 600 : 400,
        color: active ? NOBLE.gold : hovered ? TEXT.onNavy : TEXT.onNavyMuted,
        background: active ? BG.sidebarActive : hovered ? BG.sidebarHover : 'transparent',
        border: 'none',
        borderLeft: active ? `3px solid ${NOBLE.gold}` : '3px solid transparent',
        cursor: 'pointer',
        transition: 'color 0.15s ease, background 0.15s ease',
        textAlign: 'left',
      }}
    >
      <Icon size={18} />
      <span>{item.label}</span>
    </button>
  );
}
