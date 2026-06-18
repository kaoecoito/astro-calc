import { describe, it, expect } from 'vitest';
import { computeAspects } from '../../src/services/aspects.js';
import type { PlanetPosition } from '../../src/lib/types.js';

function makePlanet(name: string, longitude: number): PlanetPosition {
  return {
    name: name as PlanetPosition['name'],
    sign: 'aries',
    degree: longitude % 30,
    longitude,
    house: 1,
    retrograde: false,
  };
}

describe('computeAspects', () => {
  it('detecta conjunção (0°, dentro do orbe)', () => {
    const planets = [makePlanet('sun', 10), makePlanet('moon', 15)];
    const aspects = computeAspects(planets);
    expect(aspects).toHaveLength(1);
    expect(aspects[0].type).toBe('conjunction');
    expect(aspects[0].orb).toBeCloseTo(5, 1);
  });

  it('detecta oposição (180°)', () => {
    const planets = [makePlanet('sun', 0), makePlanet('moon', 180)];
    const aspects = computeAspects(planets);
    expect(aspects[0].type).toBe('opposition');
    expect(aspects[0].orb).toBeCloseTo(0, 2);
  });

  it('detecta trígono (120°)', () => {
    const planets = [makePlanet('sun', 0), makePlanet('moon', 120)];
    const aspects = computeAspects(planets);
    expect(aspects[0].type).toBe('trine');
  });

  it('detecta quadratura (90°)', () => {
    const planets = [makePlanet('sun', 0), makePlanet('moon', 90)];
    const aspects = computeAspects(planets);
    expect(aspects[0].type).toBe('square');
  });

  it('detecta sextil (60°)', () => {
    const planets = [makePlanet('sun', 0), makePlanet('moon', 60)];
    const aspects = computeAspects(planets);
    expect(aspects[0].type).toBe('sextile');
  });

  it('não detecta aspecto fora do orbe', () => {
    // Separação de 50° — sem aspecto definido dentro do orbe
    const planets = [makePlanet('sun', 0), makePlanet('moon', 50)];
    const aspects = computeAspects(planets);
    expect(aspects).toHaveLength(0);
  });

  it('trata wrap-around de longitude (ex: 355° e 2° = conjunção, separação 7°)', () => {
    // Separação angular: |355 - 2| = 353 > 180 → 360 - 353 = 7° → dentro do orbe de 8°
    const planets = [makePlanet('sun', 355), makePlanet('moon', 2)];
    const aspects = computeAspects(planets);
    expect(aspects).toHaveLength(1);
    expect(aspects[0].type).toBe('conjunction');
    expect(aspects[0].orb).toBeCloseTo(7, 1);
  });

  it('inclui campo applying no resultado', () => {
    const planets = [makePlanet('sun', 0), makePlanet('moon', 5)];
    const aspects = computeAspects(planets);
    expect(aspects[0]).toHaveProperty('applying');
  });
});
