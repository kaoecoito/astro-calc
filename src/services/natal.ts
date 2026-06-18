import { resolveDateTime } from './datetime.js';
import { computePlanets } from './planets.js';
import { computeHouses, houseOfLongitude } from './houses.js';
import { computeAspects } from './aspects.js';
import type { PlanetPosition } from '../lib/types.js';
import type { NatalInput } from '../schemas/input.js';
import type { NatalChart } from '../schemas/output.js';

export function buildNatalChart(input: NatalInput): NatalChart {
  // Resolve a hora local para UTC tratando horário de verão automaticamente
  const resolved = resolveDateTime(input.date, input.time, input.timezone, input.dst);
  const jd = resolved.julianDayUT;

  const planetsWithoutHouse = computePlanets(jd);
  const houses = computeHouses(jd, input.latitude, input.longitude, input.houseSystem);

  // Atribui casa a cada planeta após ter calculado as cúspides
  // Cast necessário: spread dilui o tipo literal de PlanetName para string no TS
  const planets = planetsWithoutHouse.map((p) => ({
    ...p,
    house: houseOfLongitude(p.longitude, houses.cusps),
  })) as PlanetPosition[];

  const aspects = computeAspects(planets);

  return {
    planets,
    houses,
    aspects,
    timeResolution: {
      utc: resolved.utc,
      utcOffset: resolved.utcOffset,
      dstApplied: resolved.dstApplied,
      ambiguous: resolved.ambiguous,
      adjusted: resolved.adjusted,
    },
  };
}
