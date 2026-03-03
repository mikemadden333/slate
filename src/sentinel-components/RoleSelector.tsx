import { useState } from 'react';
import { Building2, GraduationCap, Shield, ArrowLeft } from 'lucide-react';
import { NOBLE, BG, TEXT, STATUS } from '../theme/colors';
import { CAMPUSES } from '../sentinel-data/campuses';
import { fmtNum } from '../theme/formatters';

interface RoleSelectorProps {
  onSelectNetwork: () => void;
  onSelectCampus: (campusName: string) => void;
}

export default function RoleSelector({ onSelectNetwork, onSelectCampus }: RoleSelectorProps) {
  const [showCampusPicker, setShowCampusPicker] = useState(false);

  return (
    <div style={{
      minHeight: '100vh',
      background: BG.app,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontFamily: "'Inter', sans-serif",
      padding: 32,
    }}>
      <div style={{
        maxWidth: 800,
        width: '100%',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
      }}>
        {/* Header Logo */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: 12,
          marginBottom: 8,
        }}>
          <Shield size={36} color={NOBLE.navy} strokeWidth={1.8} />
          <div style={{
            fontSize: 24,
            fontWeight: 800,
            color: NOBLE.navy,
            letterSpacing: '0.06em',
          }}>
            NOBLE SCHOOLS
          </div>
        </div>

        <div style={{
          fontSize: 13,
          fontWeight: 500,
          color: TEXT.muted,
          textTransform: 'uppercase',
          letterSpacing: '2px',
          marginBottom: 32,
        }}>
          Financial Intelligence Platform
        </div>

        {!showCampusPicker ? (
          <>
            <div style={{
              fontSize: 20,
              fontWeight: 500,
              color: TEXT.primary,
              marginBottom: 28,
            }}>
              Select your view
            </div>

            {/* Role Cards */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: 20,
              width: '100%',
            }}>
              <RoleCard
                icon={Building2}
                title="Network Leadership"
                subtitle="CFO, President & Senior Leaders"
                description="Full network financial intelligence across all 17 campuses, scenario modeling, covenant analysis, and enterprise-wide metrics."
                onClick={onSelectNetwork}
              />
              <RoleCard
                icon={GraduationCap}
                title="Campus Leadership"
                subtitle="Principals & Campus Teams"
                description="Your campus financial health, budget performance, enrollment metrics, and network context."
                onClick={() => setShowCampusPicker(true)}
              />
            </div>
          </>
        ) : (
          <>
            <button
              onClick={() => setShowCampusPicker(false)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                alignSelf: 'flex-start',
                background: 'none',
                border: 'none',
                color: NOBLE.navy,
                fontSize: 14,
                fontFamily: "'Inter', sans-serif",
                fontWeight: 500,
                cursor: 'pointer',
                marginBottom: 16,
                padding: 0,
              }}
            >
              <ArrowLeft size={16} />
              Back
            </button>

            <div style={{
              fontSize: 20,
              fontWeight: 500,
              color: TEXT.primary,
              marginBottom: 24,
            }}>
              Select Your Campus
            </div>

            {/* Campus Grid */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(4, 1fr)',
              gap: 12,
              width: '100%',
            }}>
              {[...CAMPUSES].sort((a, b) => a.name.localeCompare(b.name)).map(campus => (
                <CampusCard
                  key={campus.name}
                  name={campus.name}
                  ehh={campus.ehh}
                  retention={campus.retention}
                  onClick={() => onSelectCampus(campus.name)}
                />
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

function RoleCard({
  icon: Icon,
  title,
  subtitle,
  description,
  onClick,
}: {
  icon: typeof Building2;
  title: string;
  subtitle: string;
  description: string;
  onClick: () => void;
}) {
  const [hovered, setHovered] = useState(false);

  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        background: BG.card,
        border: `1px solid ${hovered ? NOBLE.navy : BG.border}`,
        borderRadius: 16,
        padding: 32,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 12,
        cursor: 'pointer',
        transition: 'all 0.2s ease',
        boxShadow: hovered
          ? '0 8px 24px rgba(0,68,125,0.12)'
          : '0 1px 3px rgba(0,0,0,0.04)',
        transform: hovered ? 'translateY(-2px)' : 'translateY(0)',
        textAlign: 'center',
      }}
    >
      <Icon size={48} color={NOBLE.navy} strokeWidth={1.5} />
      <div style={{
        fontSize: 18,
        fontWeight: 700,
        color: TEXT.primary,
        fontFamily: "'DM Sans', sans-serif",
      }}>
        {title}
      </div>
      <div style={{
        fontSize: 14,
        color: TEXT.muted,
      }}>
        {subtitle}
      </div>
      <div style={{
        fontSize: 13,
        color: TEXT.dim,
        lineHeight: 1.5,
      }}>
        {description}
      </div>
    </button>
  );
}

function CampusCard({
  name,
  ehh,
  retention,
  onClick,
}: {
  name: string;
  ehh: number;
  retention: number;
  onClick: () => void;
}) {
  const [hovered, setHovered] = useState(false);

  const dotColor = retention >= 0.93 ? STATUS.green
    : retention >= 0.89 ? STATUS.amber
    : STATUS.red;

  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        background: BG.card,
        border: `1px solid ${hovered ? NOBLE.navy : BG.border}`,
        borderRadius: 12,
        padding: '16px 16px',
        display: 'flex',
        flexDirection: 'column',
        gap: 6,
        cursor: 'pointer',
        transition: 'all 0.2s ease',
        boxShadow: hovered
          ? '0 4px 12px rgba(0,68,125,0.10)'
          : '0 1px 3px rgba(0,0,0,0.04)',
        transform: hovered ? 'translateY(-2px)' : 'translateY(0)',
        textAlign: 'left',
      }}
    >
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: 8,
      }}>
        <div style={{
          width: 8,
          height: 8,
          borderRadius: '50%',
          background: dotColor,
          flexShrink: 0,
        }} />
        <div style={{
          fontSize: 14,
          fontWeight: 600,
          color: TEXT.primary,
          fontFamily: "'DM Sans', sans-serif",
        }}>
          {name}
        </div>
      </div>
      <div style={{
        fontSize: 12,
        fontFamily: "'DM Mono', monospace",
        color: TEXT.muted,
        paddingLeft: 16,
      }}>
        {fmtNum(ehh)} students
      </div>
    </button>
  );
}
