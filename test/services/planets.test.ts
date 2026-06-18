import { describe, it, expect, vi } from 'vitest';

// Mock do sweph: Quíron (id 15) falha como se o arquivo seas_18.se1 faltasse;
// os demais corpos calculam normalmente.
vi.mock('sweph', () => ({
  set_ephe_path: vi.fn(),
  close: vi.fn(),
  constants: { SEFLG_MOSEPH: 4, SEFLG_SPEED: 256, SE_GREG_CAL: 1 },
  calc_ut: vi.fn((_jd: number, id: number) => {
    if (id === 15) {
      // Quíron sem arquivo de efeméride
      return { flag: -1, error: "SwissEph file 'seas_18.se1' not found", data: [0, 0, 0, 0, 0, 0] };
    }
    // Demais corpos: longitude fictícia, velocidade positiva (direto)
    return { flag: 0, error: '', data: [100 + id, 0, 0, 0.5, 0, 0] };
  }),
}));

const { computePlanets } = await import('../../src/services/planets.js');

describe('computePlanets', () => {
  it('omite o Quíron com elegância quando o arquivo de efeméride está ausente', () => {
    const bodies = computePlanets(2448058);
    const names = bodies.map((b) => b.name);
    // 11 corpos core, Quíron omitido
    expect(bodies).toHaveLength(11);
    expect(names).not.toContain('chiron');
    expect(names).toContain('sun');
    expect(names).toContain('lilith');
  });

  it('inclui todos os corpos core', () => {
    const names = computePlanets(2448058).map((b) => b.name);
    for (const core of ['sun', 'moon', 'mercury', 'venus', 'mars', 'jupiter', 'saturn', 'uranus', 'neptune', 'pluto', 'lilith']) {
      expect(names).toContain(core);
    }
  });
});
