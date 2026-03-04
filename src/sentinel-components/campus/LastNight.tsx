/**
 * LastNight — "Last Night Near [Campus]" summary card.
 * Visible during PRE_SCHOOL and ARRIVAL periods (before 8am).
 * Pulls from Citizen (fast), news, and CPD data to bridge the CPD reporting lag.
 */

import type { Incident, SchoolPeriod } from '../../sentinel-engine/types';
import type { CitizenIncident } from '../../sentinel-api/citizen';
import type { Campus } from '../../sentinel-data/campuses';
import { Moon } from 'lucide-react';
import { haversine, fmtAgo } from '../../sentinel-engine/geo';

interface Props {
  campus: Campus;
  incidents: Incident[];
  citizenIncidents: CitizenIncident[];
  schoolPeriod: SchoolPeriod;
}

export default function LastNight({ campus, incidents, citizenIncidents, schoolPeriod }: Props) {
  // Only visible during PRE_SCHOOL and ARRIVAL
  if (schoolPeriod !== 'PRE_SCHOOL' && schoolPeriod !== 'ARRIVAL') return null;

  // Filter to overnight (last 12 hours) and within 1.5mi
  const now = Date.now();
  const cutoff = now - 12 * 3_600_000;

  const overnightCPD = incidents.filter(i => {
    const ts = new Date(i.date).getTime();
    if (ts < cutoff) return false;
    return haversine(campus.lat, campus.lng, i.lat, i.lng) <= 1.5;
  });

  const overnightCitizen = citizenIncidents.filter(c => {
    const ts = new Date(c.timestamp).getTime();
    if (ts < cutoff) return false;
    return haversine(campus.lat, campus.lng, c.lat, c.lng) <= 1.5;
  });

  const homicidesCPD = overnightCPD.filter(i => i.type === 'HOMICIDE').length;
  const weaponsCPD = overnightCPD.filter(i =>
    i.type === 'WEAPONS VIOLATION' || i.type === 'HOMICIDE',
  ).length;

  const shootingsCitizen = overnightCitizen.filter(c =>
    c.category === 'SHOOTING' || c.category === 'HOMICIDE',
  ).length;

  const totalEvents = overnightCPD.length + overnightCitizen.length;
  const isEmpty = totalEvents === 0;

  return (
    <div style={{
      background: '#121315',
      borderRadius: 12,
      padding: 20,
      marginBottom: 24,
      color: '#fff',
    }}>
      <div style={{
        display: 'flex', alignItems: 'center', gap: 8,
        marginBottom: 12,
      }}>
        <Moon size={20} style={{ color: '#F0B429' }} />
        <span style={{ fontSize: 18, fontWeight: 700 }}>
          Last Night Near {campus.short}
        </span>
      </div>

      {isEmpty ? (
        <div style={{ fontSize: 15, lineHeight: 1.6, color: 'rgba(255,255,255,0.9)' }}>
          No incidents reported near {campus.short} since yesterday afternoon.
          {new Date().getDay() === 0 || new Date().getHours() < 10 ? (
            <div style={{
              marginTop: 10, padding: '10px 14px',
              background: 'rgba(59,130,246,0.15)', borderRadius: 8,
              border: '1px solid rgba(59,130,246,0.3)',
              fontSize: 13, color: 'rgba(255,255,255,0.85)', lineHeight: 1.5,
            }}>
              CPD incident reports from overnight are typically filed 2–8 hours after the event.
              Citizen scanner data is shown above when available.
            </div>
          ) : (
            ' Your neighborhood was quiet overnight.'
          )}
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <div style={{ fontSize: 15, lineHeight: 1.6, color: 'rgba(255,255,255,0.9)' }}>
            Here is what we know about last night near {campus.short} &mdash;
            some of this may not yet appear in official CPD data.
          </div>

          {/* Summary stats */}
          <div style={{
            display: 'flex', gap: 12, flexWrap: 'wrap',
          }}>
            {overnightCPD.length > 0 && (
              <StatPill
                label="CPD Verified"
                count={overnightCPD.length}
                detail={homicidesCPD > 0
                  ? `${homicidesCPD} homicide${homicidesCPD > 1 ? 's' : ''}, ${weaponsCPD} weapons`
                  : `${weaponsCPD} weapons-related`}
                color="#fff"
                bg="rgba(255,255,255,0.15)"
              />
            )}
            {overnightCitizen.length > 0 && (
              <StatPill
                label="Citizen (Live)"
                count={overnightCitizen.length}
                detail={shootingsCitizen > 0
                  ? `${shootingsCitizen} shooting${shootingsCitizen > 1 ? 's' : ''} reported`
                  : 'scanner-derived'}
                color="#0DD4A8"
                bg="rgba(13,212,168,0.15)"
              />
            )}
          </div>

          {/* Recent items */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginTop: 4 }}>
            {overnightCitizen.slice(0, 3).map(c => (
              <div key={c.id} style={{
                padding: '8px 12px',
                background: 'rgba(255,255,255,0.08)',
                borderRadius: 8,
                borderLeft: '3px solid #0DD4A8',
                fontSize: 13,
              }}>
                <div style={{ fontWeight: 600 }}>{c.title}</div>
                <div style={{ color: 'rgba(255,255,255,0.6)', fontSize: 11, marginTop: 2 }}>
                  Scanner-derived · Unverified · {fmtAgo(c.timestamp)}
                </div>
              </div>
            ))}
            {overnightCPD.slice(0, 3).map(i => (
              <div key={i.id} style={{
                padding: '8px 12px',
                background: 'rgba(255,255,255,0.08)',
                borderRadius: 8,
                borderLeft: '3px solid rgba(255,255,255,0.4)',
                fontSize: 13,
              }}>
                <div style={{ fontWeight: 600 }}>{i.type} — {i.block}</div>
                <div style={{ color: 'rgba(255,255,255,0.6)', fontSize: 11, marginTop: 2 }}>
                  CPD Verified · {fmtAgo(i.date)}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div style={{
        marginTop: 12,
        fontSize: 11,
        color: 'rgba(255,255,255,0.5)',
        fontStyle: 'italic',
      }}>
        Official CPD records may not yet reflect all overnight activity.
      </div>
    </div>
  );
}

function StatPill({ label, count, detail, color, bg }: {
  label: string; count: number; detail: string; color: string; bg: string;
}) {
  return (
    <div style={{
      padding: '8px 14px',
      background: bg,
      borderRadius: 8,
      display: 'flex',
      alignItems: 'center',
      gap: 10,
    }}>
      <span style={{ fontSize: 22, fontWeight: 800, color }}>{count}</span>
      <div>
        <div style={{ fontSize: 12, fontWeight: 700, color }}>{label}</div>
        <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.6)' }}>{detail}</div>
      </div>
    </div>
  );
}
