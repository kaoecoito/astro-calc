import { toJulianDayUT } from './datetime.js';
import { computePlanets } from './planets.js';
import { computeHouses, houseOfLongitude } from './houses.js';
import { computeAspects } from './aspects.js';
import type { PlanetPosition } from '../lib/types.js';
import type { NatalInput } from '../schemas/input.js';
import type { NatalChart } from '../schemas/output.js';

export function buildNatalChart(input: NatalInput): NatalChart {
  const jd = toJulianDayUT(input.date, input.time, input.timezone);

  const planetsWithoutHouse = computePlanets(jd);
  const houses = computeHouses(jd, input.latitude, input.longitude, input.houseSystem);

  // Atribui casa a cada planeta após ter calculado as cúspides
  // Cast necessário: spread dilui o tipo literal de PlanetName para string no TS
  const planets = planetsWithoutHouse.map((p) => ({
    ...p,
    house: houseOfLongitude(p.longitude, houses.cusps),
  })) as PlanetPosition[];

  const aspects = computeAspects(planets);

  return { planets, houses, aspects };
}
