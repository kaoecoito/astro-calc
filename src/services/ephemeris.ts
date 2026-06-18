import { set_ephe_path, close, constants } from 'sweph';

export const { SEFLG_MOSEPH, SEFLG_SPEED, SE_GREG_CAL } = constants;

// Flag combinada usada em todos os cálculos de planetas
export const CALC_FLAGS = SEFLG_MOSEPH | SEFLG_SPEED;

export function initEphemeris(): void {
  const ephePath = process.env.EPHE_PATH ?? '';
  // Com SEFLG_MOSEPH ativo, a efeméride Moshier é usada independente do path
  set_ephe_path(ephePath);
}

export function closeEphemeris(): void {
  close();
}
