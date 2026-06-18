import { describe, it, expect, vi } from 'vitest';

// Mock do sweph: houses() retorna cúspides e pontos fixos para validar o formato
vi.mock('sweph', () => ({
  houses: vi.fn(() => ({
    flag: 0,
    data: {
      // 12 cúspides
      houses: [15, 45, 75, 105, 135, 165, 195, 225, 255, 285, 315, 345],
      // points: [ascendant, mc, ...] — Asc 15° (Áries), MC 285° (Capricórnio)
      points: [15, 285, 0, 0, 0, 0, 0, 0],
    },
  })),
  set_ephe_path: vi.fn(),
  close: vi.fn(),
  constants: { SEFLG_MOSEPH: 4, SEFLG_SPEED: 256, SE_GREG_CAL: 1 },
}));

const { computeHouses } = await import('../../src/services/houses.js');

describe('computeHouses — ascendente e meio do céu com signo', () => {
  it('retorna o ascendente já resolvido em signo e grau', () => {
    const result = computeHouses(2448058, -23.55, -46.63, 'placidus');
    expect(result.ascendant).toEqual({ longitude: 15, sign: 'aries', degree: 15 });
  });

  it('retorna o meio do céu já resolvido em signo e grau', () => {
    const result = computeHouses(2448058, -23.55, -46.63, 'placidus');
    expect(result.midheaven).toEqual({ longitude: 285, sign: 'capricorn', degree: 15 });
  });

  it('mantém as 12 cúspides como longitudes', () => {
    const result = computeHouses(2448058, -23.55, -46.63, 'placidus');
    expect(result.cusps).toHaveLength(12);
  });
});
