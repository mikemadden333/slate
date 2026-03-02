/**
 * useRetaliationWindow — Hook that returns retaliation window state for a campus.
 * When active, the entire app responds: banner, pulse, map zoom, dismissal urgency.
 */

import { useMemo } from 'react';
import type { ContagionZone, CampusRisk, SchoolPeriod } from '../sentinel-engine/types';

export interface RetaliationWindowState {
  active: boolean;
  zone: ContagionZone | null;
  hoursElapsed: number;
  hoursRemaining: number;
  percentComplete: number;
  address: string;
  distance: number;
  schoolPeriod: SchoolPeriod;
  minutesToDismissal: number;
  dismissalDuringWindow: boolean;
}

export function useRetaliationWindow(risk: CampusRisk): RetaliationWindowState {
  return useMemo(() => {
    const zone = risk.contagionZones.find(z => z.retWin && z.ageH >= 18 && z.ageH <= 72) ?? null;
    if (!zone || !risk.inRetaliationWindow) {
      return {
        active: false,
        zone: null,
        hoursElapsed: 0,
        hoursRemaining: 0,
        percentComplete: 0,
        address: '',
        distance: 0,
        schoolPeriod: risk.schoolPeriod,
        minutesToDismissal: risk.minutesToDismissal,
        dismissalDuringWindow: false,
      };
    }

    const hoursElapsed = Math.max(0, zone.ageH - 18); // Hours into 18-72h window
    const hoursRemaining = Math.max(0, 72 - zone.ageH);
    const windowDuration = 54; // 72 - 18
    const percentComplete = Math.min(100, Math.max(0, (hoursElapsed / windowDuration) * 100));
    const dismissalDuringWindow = risk.minutesToDismissal > 0 && risk.minutesToDismissal <= hoursRemaining * 60;

    return {
      active: true,
      zone,
      hoursElapsed: Math.round(zone.ageH),
      hoursRemaining: Math.round(hoursRemaining),
      percentComplete,
      address: zone.block || 'Address unavailable',
      distance: zone.distanceFromCampus ?? 0,
      schoolPeriod: risk.schoolPeriod,
      minutesToDismissal: risk.minutesToDismissal,
      dismissalDuringWindow,
    };
  }, [risk]);
}
