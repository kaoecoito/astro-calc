import { toJulianDayUT } from './datetime.js';
import { computePlanets } from './planets.js';
import { houseOfLongitude } from './houses.js';
import { computeTransitAspects } from './aspects.js';
import type { PlanetPosition } from '../lib/types.js';
import type { TransitInput } from '../schemas/input.js';
import type { NatalChart, TransitChart } from '../schemas/output.js';

// Planetas focados por periodicidade
const DAILY_FOCUS = new Set(['moon', 'sun', 'mercury', 'venus', 'mars']);
const MONTHLY_FOCUS = new Set(['sun', 'jupiter', 'saturn', 'uranus', 'neptune', 'pluto']);

export function buildTransitChart(input: TransitInput, natalChart: NatalChart): TransitChart {
  const jd = toJulianDayUT(input.targetDate, input.targetTime, input.targetTimezone);

  // Cast necessário: spread dilui o tipo literal de PlanetName para string no TS
  const allTransitPlanets: PlanetPosition[] = computePlanets(jd).map((p) => ({
    ...p,
    house: houseOfLongitude(p.longitude, natalChart.houses.cusps),
  })) as PlanetPosition[];

  // Filtra planetas relevantes para a periodicidade solicitada
  const focusList = input.mode === 'monthly' ? MONTHLY_FOCUS : DAILY_FOCUS;
  const filteredPlanets = allTransitPlanets.filter((p) => focusList.has(p.name));

  // Cast igualmente necessário para natalChart.planets
  const natalPlanets = natalChart.planets as unknown as PlanetPosition[];
  const aspectsMap = computeTransitAspects(filteredPlanets, natalPlanets);

  const planetsWithAspects = filteredPlanets.map((p) => ({
    ...p,
    aspectsToNatal: aspectsMap[p.name] ?? [],
  }));

  return {
    date: input.targetDate,
    mode: input.mode,
    planets: planetsWithAspects,
  };
}
