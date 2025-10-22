import { CLUBS } from './constants';

export type Club = typeof CLUBS[number];

export type TrajectoryPoint = {
  x: number;
  y: number;
};

export interface SwingStats {
  ballSpeed: number;
  clubHeadSpeed: number;
  launchAngle: number;
  distance: number;
}

export interface SwingData {
  id: string;
  club: Club;
  impactFrameUrl: string; // base64 data URL of the impact frame
  stats: SwingStats;
  trajectory: TrajectoryPoint[];
  tips: string[];
  timestamp: number;
}

export interface AnalysisResultData extends SwingData {}

export type View = 'ANALYSIS' | 'HISTORY';