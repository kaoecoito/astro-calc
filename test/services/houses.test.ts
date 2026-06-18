import { describe, it, expect } from 'vitest';
import { houseOfLongitude } from '../../src/services/houses.js';

// Cúspides de referência — 12 elementos (índice 0 = casa 1, índice 11 = casa 12)
const MOCK_CUSPS = [
  15,   // casa 1 (Asc)
  45,   // casa 2
  75,   // casa 3
  105,  // casa 4 (IC)
  135,  // casa 5
  165,  // casa 6
  195,  // casa 7 (Desc)
  225,  // casa 8
  255,  // casa 9
  285,  // casa 10 (MC)
  315,  // casa 11
  345,  // casa 12
];

describe('houseOfLongitude', () => {
  it('coloca planeta na casa 1', () => {
    expect(houseOfLongitude(20, MOCK_CUSPS)).toBe(1);
  });

  it('coloca planeta na casa 10 (região do MC)', () => {
    expect(houseOfLongitude(290, MOCK_CUSPS)).toBe(10);
  });

  it('trata wrap-around entre casa 12 e casa 1 (cruzamento de 0°)', () => {
    // Cúspide 12 é 345°, próxima (casa 1) é 15° → longitude 5° cai na casa 12
    expect(houseOfLongitude(5, MOCK_CUSPS)).toBe(12);
    expect(houseOfLongitude(355, MOCK_CUSPS)).toBe(12);
  });

  it('planeta exatamente na cúspide pertence àquela casa', () => {
    expect(houseOfLongitude(15, MOCK_CUSPS)).toBe(1);
    expect(houseOfLongitude(285, MOCK_CUSPS)).toBe(10);
  });

  it('normaliza longitudes acima de 360°', () => {
    expect(houseOfLongitude(380, MOCK_CUSPS)).toBe(1); // 380° = 20°
  });

  it('coloca planeta na última casa (12)', () => {
    expect(houseOfLongitude(350, MOCK_CUSPS)).toBe(12);
  });
});
