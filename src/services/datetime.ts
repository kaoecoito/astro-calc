import { DateTime, FixedOffsetZone } from 'luxon';
import { julday } from 'sweph';
import { SE_GREG_CAL } from './ephemeris.js';
import { EphemerisError } from '../lib/types.js';

export type DstMode = 'auto' | 'on' | 'off';

export interface ResolvedDateTime {
  julianDayUT: number;
  utc: string; // instante em UTC (ISO)
  utcOffset: string; // offset aplicado, ex: "-03:00"
  utcOffsetMinutes: number;
  dstApplied: boolean; // se o horário de verão foi aplicado
  ambiguous: boolean; // hora caiu na sobreposição da volta do horário de verão
  adjusted: boolean; // hora caiu no salto inexistente do início do horário de verão
}

interface DateParts {
  year: number;
  month: number;
  day: number;
  hour: number;
  minute: number;
}

function parseParts(date: string, time: string): DateParts {
  const [hour, minute] = time.split(':').map(Number);
  return {
    year: parseInt(date.slice(0, 4)),
    month: parseInt(date.slice(5, 7)),
    day: parseInt(date.slice(8, 10)),
    hour,
    minute,
  };
}

// Descobre os dois offsets possíveis da zona no ano: padrão e horário de verão.
// Amostra meados de janeiro e julho para cobrir ambos os hemisférios.
function zoneOffsets(timezone: string, year: number): { standard: number; daylight: number } {
  const jan = DateTime.fromObject({ year, month: 1, day: 15, hour: 12 }, { zone: timezone }).offset;
  const jul = DateTime.fromObject({ year, month: 7, day: 15, hour: 12 }, { zone: timezone }).offset;
  // Horário de verão sempre adianta o relógio, logo tem o offset maior
  return { standard: Math.min(jan, jul), daylight: Math.max(jan, jul) };
}

// Verifica se um offset é uma interpretação válida da hora local na zona real.
// Interpreta a hora de parede no offset fixo e confere se, ao renderizar na zona
// IANA, a mesma hora de parede é preservada (ida e volta).
function offsetIsValid(parts: DateParts, timezone: string, offsetMinutes: number): boolean {
  const atFixed = DateTime.fromObject(parts, { zone: FixedOffsetZone.instance(offsetMinutes) });
  const inZone = atFixed.setZone(timezone);
  return (
    inZone.year === parts.year &&
    inZone.month === parts.month &&
    inZone.day === parts.day &&
    inZone.hour === parts.hour &&
    inZone.minute === parts.minute
  );
}

function formatOffset(minutes: number): string {
  const sign = minutes < 0 ? '-' : '+';
  const abs = Math.abs(minutes);
  const hh = String(Math.floor(abs / 60)).padStart(2, '0');
  const mm = String(abs % 60).padStart(2, '0');
  return `${sign}${hh}:${mm}`;
}

// Resolve data/hora local para UTC tratando horário de verão automaticamente.
// dst: 'auto' deixa a base IANA decidir; 'on'/'off' força quando o usuário sabe.
export function resolveDateTime(
  date: string,
  time: string,
  timezone: string,
  dst: DstMode = 'auto',
): ResolvedDateTime {
  const parts = parseParts(date, time);

  // Validação básica de formato/intervalo
  const probe = DateTime.fromObject(parts, { zone: timezone });
  if (!probe.isValid) {
    throw new EphemerisError(
      `Data/hora inválida: ${probe.invalidReason ?? 'erro desconhecido'}`,
      'INVALID_DATETIME',
    );
  }

  const { standard, daylight } = zoneOffsets(timezone, parts.year);
  const hasDst = standard !== daylight;

  const standardValid = offsetIsValid(parts, timezone, standard);
  const daylightValid = hasDst && offsetIsValid(parts, timezone, daylight);

  let chosenOffset: number;
  let ambiguous = false;
  let adjusted = false;

  if (dst === 'on') {
    // Força horário de verão; se a zona não tinha DST no ano, mantém o padrão
    chosenOffset = hasDst ? daylight : standard;
  } else if (dst === 'off') {
    chosenOffset = standard;
  } else {
    // auto — detecção pela base histórica IANA
    if (standardValid && daylightValid) {
      // Sobreposição (volta do horário de verão): hora ocorre duas vezes.
      // Default para horário padrão; o chamador pode forçar com dst: 'on'.
      ambiguous = true;
      chosenOffset = standard;
    } else if (standardValid) {
      chosenOffset = standard;
    } else if (daylightValid) {
      chosenOffset = daylight;
    } else {
      // Salto (início do horário de verão): hora não existiu no relógio.
      // Interpreta no offset pós-transição (avança a hora).
      adjusted = true;
      chosenOffset = daylight;
    }
  }

  const utc = DateTime.fromObject(parts, { zone: FixedOffsetZone.instance(chosenOffset) }).toUTC();
  const hourDecimal = utc.hour + utc.minute / 60 + utc.second / 3600;
  const julianDayUT = julday(utc.year, utc.month, utc.day, hourDecimal, SE_GREG_CAL);

  return {
    julianDayUT,
    utc: utc.toISO() ?? '',
    utcOffset: formatOffset(chosenOffset),
    utcOffsetMinutes: chosenOffset,
    dstApplied: hasDst && chosenOffset === daylight,
    ambiguous,
    adjusted,
  };
}

// Atalho que retorna apenas o Julian Day (usado por trânsitos e progressões)
export function toJulianDayUT(
  date: string,
  time: string,
  timezone: string,
  dst: DstMode = 'auto',
): number {
  return resolveDateTime(date, time, timezone, dst).julianDayUT;
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
