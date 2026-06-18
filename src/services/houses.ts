import { houses } from 'sweph';
import { HOUSE_SYSTEMS } from '../lib/constants.js';
import type { HouseSystem } from '../lib/constants.js';
import { EphemerisError } from '../lib/types.js';
import type { HouseData } from '../lib/types.js';

// Índices do array points retornado por sweph.houses()
const POINTS = { ascendant: 0, mc: 1 };

export function computeHouses(
  jd: number,
  latitude: number,
  longitude: number,
  system: HouseSystem,
): HouseData {
  const systemCode = HOUSE_SYSTEMS[system];
  const result = houses(jd, latitude, longitude, systemCode);

  // flag < 0 indica erro na Swiss Ephemeris
  if (result.flag < 0) {
    throw new EphemerisError('Erro ao calcular casas astrológicas', 'HOUSE_CALC_ERROR');
  }

  // data.houses: array de 12 elementos (índices 0–11 = casas 1–12)
  // data.points: [ascendant, mc, armc, vertex, ...]
  return {
    system,
    cusps: result.data.houses, // 12 elementos, 0-indexed
    ascendant: result.data.points[POINTS.ascendant],
    midheaven: result.data.points[POINTS.mc],
  };
}

// Determina em qual casa (1–12) cai uma longitude eclíptica
// cusps: array de 12 elementos onde cusps[0] = cúspide da casa 1
export function houseOfLongitude(longitude: number, cusps: number[]): number {
  const lon = ((longitude % 360) + 360) % 360;

  for (let i = 0; i < 12; i++) {
    const cusp = ((cusps[i] % 360) + 360) % 360;
    const nextCusp = ((cusps[(i + 1) % 12] % 360) + 360) % 360;

    if (cusp <= nextCusp) {
      if (lon >= cusp && lon < nextCusp) return i + 1;
    } else {
      // Atravessa 0° (ex: casa 12 → casa 1)
      if (lon >= cusp || lon < nextCusp) return i + 1;
    }
  }

  return 1; // fallback defensivo
}
