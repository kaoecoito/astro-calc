import { describe, it, expect, vi } from 'vitest';

// Mock dos exports nomeados do sweph
vi.mock('sweph', () => ({
  julday: vi.fn((year: number, month: number, day: number, hour: number) => {
    // J2000.0: 2000-01-01 12:00 UTC → JD 2451545.0
    if (year === 2000 && month === 1 && day === 1 && Math.abs(hour - 12) < 0.01) {
      return 2451545.0;
    }
    // 1990-06-15 UTC (qualquer hora)
    if (year === 1990 && month === 6 && day === 15) {
      return 2448058.0 + hour / 24;
    }
    return 2451545.0 + (year - 2000) * 365.25;
  }),
  set_ephe_path: vi.fn(),
  close: vi.fn(),
  constants: {
    SEFLG_MOSEPH: 4,
    SEFLG_SPEED: 256,
    SE_GREG_CAL: 1,
  },
}));

const { toJulianDayUT, dateToJulianDayNoon } = await import('../../src/services/datetime.js');

describe('toJulianDayUT', () => {
  it('converte data/hora com timezone de São Paulo para JD', () => {
    // 1990-06-15 14:30 BRT (UTC-3) = 1990-06-15 17:30 UTC
    const jd = toJulianDayUT('1990-06-15', '14:30', 'America/Sao_Paulo');
    // 17:30 UTC → hora decimal ≈ 17.5 → JD ≈ 2448058.0 + 17.5/24
    expect(jd).toBeGreaterThan(2448058);
    expect(jd).toBeLessThan(2448059);
  });

  it('lança EphemerisError para data inválida', async () => {
    const { EphemerisError } = await import('../../src/lib/types.js');
    expect(() => toJulianDayUT('9999-99-99', '00:00', 'UTC')).toThrow(EphemerisError);
  });
});

describe('dateToJulianDayNoon', () => {
  it('retorna JD J2000.0 para 2000-01-01', () => {
    const jd = dateToJulianDayNoon('2000-01-01');
    expect(jd).toBeCloseTo(2451545.0, 1);
  });
});
