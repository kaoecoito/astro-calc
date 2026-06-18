import type { ZodiacSign, PlanetName, HouseSystem, AspectName } from './constants.js';

export interface PlanetPosition {
  name: PlanetName;
  sign: ZodiacSign;
  degree: number;
  longitude: number;
  house: number;
  retrograde: boolean;
}

export interface HouseData {
  system: HouseSystem;
  cusps: number[]; // [cusp1, ..., cusp12] — 12 elementos, índice 0 = casa 1
  ascendant: number;
  midheaven: number;
}

export interface Aspect {
  from: PlanetName;
  to: PlanetName;
  type: AspectName;
  orb: number;
  applying?: boolean;
}

export interface NatalChart {
  planets: PlanetPosition[];
  houses: HouseData;
  aspects: Aspect[];
}

export interface TransitPlanetPosition extends PlanetPosition {
  aspectsToNatal: Aspect[];
}

export interface TransitChart {
  date: string;
  mode: 'daily' | 'weekly' | 'monthly';
  planets: TransitPlanetPosition[];
}

export interface ProgressionChart {
  progressedDate: string;
  yearsElapsed: number;
  planets: PlanetPosition[];
  aspects: Aspect[];
}

// Erro de cálculo da efeméride
export class EphemerisError extends Error {
  constructor(
    message: string,
    public readonly code: string,
  ) {
    super(message);
    this.name = 'EphemerisError';
  }
}
