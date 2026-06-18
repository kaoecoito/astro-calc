import { describe, it, expect } from 'vitest';
import { vi } from 'vitest';

// Mock apenas o julday do sweph; a lógica de horário de verão usa luxon (real)
vi.mock('sweph', () => ({
  julday: vi.fn((year: number, month: number, day: number, hour: number) => {
    // JD aproximado suficiente para os testes — a precisão real vem do sweph
    return 2451545.0 + (year - 2000) * 365.25 + (month - 1) * 30 + day + hour / 24;
  }),
  set_ephe_path: vi.fn(),
  close: vi.fn(),
  constants: { SEFLG_MOSEPH: 4, SEFLG_SPEED: 256, SE_GREG_CAL: 1 },
}));

const { resolveDateTime, toJulianDayUT, dateToJulianDayNoon } = await import(
  '../../src/services/datetime.js'
);

describe('resolveDateTime — detecção de horário de verão', () => {
  it('detecta horário PADRÃO em data de inverno (São Paulo, julho/1990)', () => {
    const r = resolveDateTime('1990-07-15', '14:30', 'America/Sao_Paulo');
    expect(r.dstApplied).toBe(false);
    expect(r.utcOffset).toBe('-03:00');
    expect(r.ambiguous).toBe(false);
    expect(r.adjusted).toBe(false);
  });

  it('detecta HORÁRIO DE VERÃO automaticamente em data de verão (São Paulo, janeiro/1990)', () => {
    const r = resolveDateTime('1990-01-15', '14:30', 'America/Sao_Paulo');
    expect(r.dstApplied).toBe(true);
    expect(r.utcOffset).toBe('-02:00');
  });

  it('não aplica horário de verão após a abolição no Brasil (2025)', () => {
    const r = resolveDateTime('2025-01-15', '14:30', 'America/Sao_Paulo');
    expect(r.dstApplied).toBe(false);
    expect(r.utcOffset).toBe('-03:00');
  });

  it('força horário padrão com dst=off mesmo em data de verão', () => {
    const r = resolveDateTime('1990-01-15', '14:30', 'America/Sao_Paulo', 'off');
    expect(r.dstApplied).toBe(false);
    expect(r.utcOffset).toBe('-03:00');
  });

  it('força horário de verão com dst=on mesmo em data de inverno', () => {
    const r = resolveDateTime('1990-07-15', '14:30', 'America/Sao_Paulo', 'on');
    expect(r.dstApplied).toBe(true);
    expect(r.utcOffset).toBe('-02:00');
  });

  it('dst=on não inventa horário de verão quando a zona não tinha DST no ano', () => {
    const r = resolveDateTime('2025-01-15', '14:30', 'America/Sao_Paulo', 'on');
    expect(r.dstApplied).toBe(false);
    expect(r.utcOffset).toBe('-03:00');
  });

  it('sinaliza ambiguidade na volta do horário de verão (Nova York, 2023-11-05 01:30)', () => {
    const r = resolveDateTime('2023-11-05', '01:30', 'America/New_York');
    expect(r.ambiguous).toBe(true);
    // default na sobreposição é o horário padrão
    expect(r.dstApplied).toBe(false);
    expect(r.utcOffset).toBe('-05:00');
  });

  it('permite forçar DST na hora ambígua com dst=on', () => {
    const r = resolveDateTime('2023-11-05', '01:30', 'America/New_York', 'on');
    expect(r.dstApplied).toBe(true);
    expect(r.utcOffset).toBe('-04:00');
  });

  it('sinaliza ajuste no salto do início do horário de verão (Nova York, 2023-03-12 02:30)', () => {
    const r = resolveDateTime('2023-03-12', '02:30', 'America/New_York');
    expect(r.adjusted).toBe(true);
  });

  it('lança EphemerisError para data inválida', async () => {
    const { EphemerisError } = await import('../../src/lib/types.js');
    expect(() => resolveDateTime('9999-99-99', '00:00', 'UTC')).toThrow(EphemerisError);
  });

  it('produz um Julian Day numérico', () => {
    const r = resolveDateTime('1990-06-15', '14:30', 'America/Sao_Paulo');
    expect(typeof r.julianDayUT).toBe('number');
  });
});

describe('toJulianDayUT', () => {
  it('retorna apenas o Julian Day (number)', () => {
    const jd = toJulianDayUT('1990-06-15', '14:30', 'America/Sao_Paulo');
    expect(typeof jd).toBe('number');
  });
});

describe('dateToJulianDayNoon', () => {
  it('retorna um Julian Day numérico para a data', () => {
    const jd = dateToJulianDayNoon('2000-01-01');
    expect(typeof jd).toBe('number');
  });
});
