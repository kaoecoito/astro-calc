import { ASPECTS } from '../lib/constants.js';
import type { PlanetName, AspectName } from '../lib/constants.js';
import type { Aspect, PlanetPosition } from '../lib/types.js';

// Distância angular mínima entre dois pontos na eclíptica
function angularDistance(a: number, b: number): number {
  const diff = Math.abs(a - b) % 360;
  return diff > 180 ? 360 - diff : diff;
}

// Calcula todos os aspectos maiores entre planetas
export function computeAspects(planets: PlanetPosition[]): Aspect[] {
  const aspects: Aspect[] = [];

  for (let i = 0; i < planets.length; i++) {
    for (let j = i + 1; j < planets.length; j++) {
      const p1 = planets[i];
      const p2 = planets[j];
      const aspect = findAspect(p1, p2);
      if (aspect) aspects.push(aspect);
    }
  }

  return aspects;
}

// Calcula aspectos entre planetas em trânsito e planetas natais
export function computeTransitAspects(
  transitPlanets: PlanetPosition[],
  natalPlanets: PlanetPosition[],
): Record<PlanetName, Aspect[]> {
  const result: Partial<Record<PlanetName, Aspect[]>> = {};

  for (const transit of transitPlanets) {
    const aspects: Aspect[] = [];
    for (const natal of natalPlanets) {
      const aspect = findAspect(transit, natal);
      if (aspect) {
        aspects.push({ ...aspect, from: transit.name, to: natal.name });
      }
    }
    result[transit.name] = aspects;
  }

  return result as Record<PlanetName, Aspect[]>;
}

function findAspect(
  p1: PlanetPosition,
  p2: PlanetPosition,
): Aspect | null {
  const separation = angularDistance(p1.longitude, p2.longitude);

  for (const { name, angle, orb } of ASPECTS) {
    const diff = Math.abs(separation - angle);
    if (diff <= orb) {
      return {
        from: p1.name,
        to: p2.name,
        type: name as AspectName,
        orb: Math.round(diff * 100) / 100,
        applying: isApplying(p1, p2, angle),
      };
    }
  }

  return null;
}

// Determina se o aspecto está aplicando (orbe diminuindo) ou separando
function isApplying(p1: PlanetPosition, p2: PlanetPosition, targetAngle: number): boolean {
  const currentSep = angularDistance(p1.longitude, p2.longitude);
  // Simula 1 grau de movimento proporcional à velocidade relativa
  const futureP1Lon = p1.longitude + 0.01;
  const futureSep = angularDistance(futureP1Lon, p2.longitude);
  const futureOrb = Math.abs(futureSep - targetAngle);
  const currentOrb = Math.abs(currentSep - targetAngle);
  return futureOrb < currentOrb;
}
