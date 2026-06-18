import { toJulianDayUT } from './datetime.js';
import { computePlanets } from './planets.js';
import { houseOfLongitude } from './houses.js';
import { computeAspects } from './aspects.js';
import type { ProgressionInput } from '../schemas/input.js';
import type { ProgressionChart } from '../schemas/output.js';

// Progressão secundária: 1 dia após o nascimento = 1 ano de vida
// JD progredido = JD natal + N dias (onde N = anos decorridos)
export function buildProgressionChart(input: ProgressionInput, natalHouseCusps: number[]): ProgressionChart {
  const natalJd = toJulianDayUT(input.natal.date, input.natal.time, input.natal.timezone);

  const natalDate = new Date(input.natal.date);
  const targetDate = new Date(input.targetDate);
  const yearsElapsed = (targetDate.getTime() - natalDate.getTime()) / (365.25 * 24 * 60 * 60 * 1000);

  // JD progredido: natal + anos decorridos (1 dia = 1 ano)
  const progressedJd = natalJd + yearsElapsed;

  const planetsWithoutHouse = computePlanets(progressedJd);
  const planets = planetsWithoutHouse.map((p) => ({
    ...p,
    house: houseOfLongitude(p.longitude, natalHouseCusps),
  }));

  const aspects = computeAspects(planets);

  // Data correspondente ao JD progredido (para referência)
  const progressedDate = julianDayToISO(progressedJd);

  return {
    progressedDate,
    yearsElapsed: Math.round(yearsElapsed * 100) / 100,
    planets,
    aspects,
  };
}

// Conversão básica JD → data ISO — algoritmo de Jean Meeus, cap. 7
function julianDayToISO(jd: number): string {
  // Algoritmo de Julian Day → calendário gregoriano (Jean Meeus, cap. 7)
  const z = Math.floor(jd + 0.5);
  const gregCorrection = (): number => {
    const alpha = Math.floor((z - 1867216.25) / 36524.25);
    return z + 1 + alpha - Math.floor(alpha / 4);
  };
  const a = z < 2299161 ? z : gregCorrection();
  const b = a + 1524;
  const c = Math.floor((b - 122.1) / 365.25);
  const d = Math.floor(365.25 * c);
  const e = Math.floor((b - d) / 30.6001);

  const day = b - d - Math.floor(30.6001 * e);
  const month = e < 14 ? e - 1 : e - 13;
  const year = month > 2 ? c - 4716 : c - 4715;

  return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
}
