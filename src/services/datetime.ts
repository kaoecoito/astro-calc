import { DateTime } from 'luxon';
import { julday } from 'sweph';
import { SE_GREG_CAL } from './ephemeris.js';
import { EphemerisError } from '../lib/types.js';

// Converte data/hora local com timezone para Julian Day em UT
export function toJulianDayUT(date: string, time: string, timezone: string): number {
  const [hour, minute] = time.split(':').map(Number);

  const local = DateTime.fromObject(
    {
      year: parseInt(date.slice(0, 4)),
      month: parseInt(date.slice(5, 7)),
      day: parseInt(date.slice(8, 10)),
      hour,
      minute,
    },
    { zone: timezone },
  );

  if (!local.isValid) {
    throw new EphemerisError(
      `Data/hora inválida: ${local.invalidReason ?? 'erro desconhecido'}`,
      'INVALID_DATETIME',
    );
  }

  const utc = local.toUTC();
  const hourDecimal = utc.hour + utc.minute / 60 + utc.second / 3600;

  return julday(utc.year, utc.month, utc.day, hourDecimal, SE_GREG_CAL);
}

// JD para "agora" em UTC
export function nowJulianDayUT(): number {
  const utc = DateTime.utc();
  const hourDecimal = utc.hour + utc.minute / 60 + utc.second / 3600;
  return julday(utc.year, utc.month, utc.day, hourDecimal, SE_GREG_CAL);
}

// Data ISO → JD ao meio-dia UTC (padrão para progressões)
export function dateToJulianDayNoon(date: string): number {
  const year = parseInt(date.slice(0, 4));
  const month = parseInt(date.slice(5, 7));
  const day = parseInt(date.slice(8, 10));
  return julday(year, month, day, 12, SE_GREG_CAL);
}
