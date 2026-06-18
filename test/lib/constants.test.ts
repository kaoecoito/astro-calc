import { describe, it, expect } from 'vitest';
import { signFromLongitude, SIGNS } from '../../src/lib/constants.js';

describe('signFromLongitude', () => {
  it('retorna áries para longitude 0°', () => {
    const { sign, degree } = signFromLongitude(0);
    expect(sign).toBe('aries');
    expect(degree).toBe(0);
  });

  it('retorna touro para longitude 30°', () => {
    expect(signFromLongitude(30).sign).toBe('taurus');
  });

  it('retorna gêmeos para longitude 60°', () => {
    expect(signFromLongitude(60).sign).toBe('gemini');
  });

  it('retorna peixes para longitude 330°', () => {
    expect(signFromLongitude(330).sign).toBe('pisces');
  });

  it('normaliza longitudes acima de 360°', () => {
    expect(signFromLongitude(360).sign).toBe('aries');
    expect(signFromLongitude(390).sign).toBe('taurus');
  });

  it('normaliza longitudes negativas', () => {
    expect(signFromLongitude(-30).sign).toBe('pisces');
  });

  it('cobre todos os 12 signos em sequência', () => {
    for (let i = 0; i < 12; i++) {
      expect(signFromLongitude(i * 30).sign).toBe(SIGNS[i]);
    }
  });

  it('calcula o grau dentro do signo corretamente', () => {
    // Sol a 15° de Áries = longitude 15°
    const { sign, degree } = signFromLongitude(15);
    expect(sign).toBe('aries');
    expect(degree).toBeCloseTo(15, 1);
  });

  it('retorna grau 0 no início de cada signo', () => {
    expect(signFromLongitude(90).degree).toBe(0); // início de Câncer
  });

  it('retorna grau próximo a 30 no fim de cada signo', () => {
    expect(signFromLongitude(29.99).degree).toBeCloseTo(29.99, 1);
  });
});
