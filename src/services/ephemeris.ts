import { set_ephe_path, close, constants } from 'sweph';

export const { SEFLG_MOSEPH, SEFLG_SPEED, SE_GREG_CAL } = constants;

// Com EPHE_PATH definido, omite SEFLG_MOSEPH para permitir leitura dos arquivos .se1
// (necessário para Quíron via seas_18.se1). Sem EPHE_PATH, força modo Moshier.
export const CALC_FLAGS = (process.env.EPHE_PATH ? 0 : SEFLG_MOSEPH) | SEFLG_SPEED;

export function initEphemeris(): void {
  const ephePath = process.env.EPHE_PATH ?? '';
  // Com SEFLG_MOSEPH ativo, a efeméride Moshier é usada independente do path
  set_ephe_path(ephePath);
}

export function closeEphemeris(): void {
  close();
}
