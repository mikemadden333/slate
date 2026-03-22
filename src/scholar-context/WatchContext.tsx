/**
 * WatchContext — shared state bridge between SentinelApp and SlateShell.
 * Allows the ASK SLATE bar to have full network context without coupling modules.
 * SentinelApp publishes state here. SlateShell reads it.
 */
import { createContext, useContext } from 'react';

export interface WatchState {
  campusCount: number;
  elevatedCount: number;
  violentIncidents24h: number;
  contagionZones: number;
  retaliationWindows: number;
  iceAlerts: number;
  sourcesLive: number;
  selectedCampusName: string;
  networkSummaryText: string;
}

const defaultState: WatchState = {
  campusCount: 0,
  elevatedCount: 0,
  violentIncidents24h: 0,
  contagionZones: 0,
  retaliationWindows: 0,
  iceAlerts: 0,
  sourcesLive: 0,
  selectedCampusName: '',
  networkSummaryText: '',
};

export const WatchContext = createContext<{
  state: WatchState;
  setState: (s: Partial<WatchState>) => void;
}>({
  state: defaultState,
  setState: () => {},
});

export const useWatchContext = () => useContext(WatchContext);

