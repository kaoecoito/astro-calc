import { calc_ut } from 'sweph';
import { CALC_FLAGS } from './ephemeris.js';
import { PLANET_IDS, CORE_BODIES, OPTIONAL_BODIES, signFromLongitude } from '../lib/constants.js';
import type { PlanetName } from '../lib/constants.js';
import { EphemerisError } from '../lib/types.js';
import type { PlanetPosition } from '../lib/types.js';

type BodyPosition = Omit<PlanetPosition, 'house'>;

// Calcula posições dos corpos do MVP para um dado Julian Day.
// Corpos core (Sol→Plutão, Lilith) funcionam em modo Moshier e são obrigatórios.
// Corpos opcionais (Quíron) exigem arquivos de efeméride; se ausentes, são omitidos.
// A casa de cada corpo é atribuída posteriormente em natal.ts.
export function computePlanets(jd: number): BodyPosition[] {
  const core = CORE_BODIES.map((name) => computeBody(jd, name, true)).filter(isPresent);
  const optional = OPTIONAL_BODIES.map((name) => computeBody(jd, name, false)).filter(isPresent);
  return [...core, ...optional];
}

function isPresent(body: BodyPosition | null): body is BodyPosition {
  return body !== null;
}

// required=true lança em erro de cálculo; required=false retorna null
// (corpo depende de arquivos de efeméride que podem não estar presentes)
function computeBody(jd: number, name: PlanetName, required: boolean): BodyPosition | null {
  const id = PLANET_IDS[name];
  const result = calc_ut(jd, id, CALC_FLAGS);

  if (result.error) {
    if (required) {
      throw new EphemerisError(`Erro ao calcular ${name}: ${result.error}`, 'PLANET_CALC_ERROR');
    }
    return null;
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
