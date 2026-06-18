import { calc_ut } from 'sweph';
import { CALC_FLAGS } from './ephemeris.js';
import { PLANET_IDS, MVP_PLANETS, signFromLongitude } from '../lib/constants.js';
import type { PlanetName } from '../lib/constants.js';
import { EphemerisError } from '../lib/types.js';
import type { PlanetPosition } from '../lib/types.js';

// Calcula posições de todos os planetas do MVP para um dado Julian Day
// Casa de cada planeta é atribuída posteriormente em natal.ts
export function computePlanets(jd: number): Omit<PlanetPosition, 'house'>[] {
  return MVP_PLANETS.map((name) => computePlanet(jd, name));
}

function computePlanet(jd: number, name: PlanetName): Omit<PlanetPosition, 'house'> {
  const id = PLANET_IDS[name];
  const result = calc_ut(jd, id, CALC_FLAGS);

  if (result.error) {
    throw new EphemerisError(`Erro ao calcular ${name}: ${result.error}`, 'PLANET_CALC_ERROR');
  }

  // data[0] = longitude eclíptica, data[3] = velocidade em longitude
  const longitude = result.data[0];
  const speed = result.data[3];
  const { sign, degree } = signFromLongitude(longitude);

  return {
    name,
    sign,
    degree,
    longitude,
    retrograde: speed < 0,
  };
}
