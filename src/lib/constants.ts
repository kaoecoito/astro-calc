// IDs dos corpos/pontos conforme Swiss Ephemeris
export const PLANET_IDS = {
  sun: 0,
  moon: 1,
  mercury: 2,
  venus: 3,
  mars: 4,
  jupiter: 5,
  saturn: 6,
  uranus: 7,
  neptune: 8,
  pluto: 9,
  // Lua Negra Lilith média (apogeu lunar médio) — ponto calculado, não um planeta
  lilith: 12,
  // Quíron — asteroide/centauro; EXIGE o arquivo de efeméride seas_18.se1
  chiron: 15,
} as const;

export type PlanetName = keyof typeof PLANET_IDS;

// Corpos disponíveis no modo Moshier (sem arquivos de efeméride externos)
export const CORE_BODIES: PlanetName[] = [
  'sun',
  'moon',
  'mercury',
  'venus',
  'mars',
  'jupiter',
  'saturn',
  'uranus',
  'neptune',
  'pluto',
  'lilith',
];

// Corpos que exigem arquivos de efeméride de asteroides (seas_18.se1).
// Calculados quando o arquivo está presente; omitidos com elegância quando não.
export const OPTIONAL_BODIES: PlanetName[] = ['chiron'];

// Todos os corpos que podem aparecer na resposta
export const ALL_BODIES: PlanetName[] = [...CORE_BODIES, ...OPTIONAL_BODIES];

// Flags de cálculo da Swiss Ephemeris
export const SEFLG_MOSEPH = 4; // modo Moshier (sem arquivos .se1)
export const SEFLG_SPEED = 256; // inclui velocidade (necessário para detectar retrógrado)
export const SE_GREG_CAL = 1; // calendário gregoriano

// Sistemas de casas suportados (código → char do Swiss Ephemeris)
export const HOUSE_SYSTEMS = {
  placidus: 'P',
  koch: 'K',
  'whole-sign': 'W',
  equal: 'E',
  regiomontanus: 'R',
  campanus: 'C',
} as const;

export type HouseSystem = keyof typeof HOUSE_SYSTEMS;

// Signos do zodíaco em ordem
export const SIGNS = [
  'aries',
  'taurus',
  'gemini',
  'cancer',
  'leo',
  'virgo',
  'libra',
  'scorpio',
  'sagittarius',
  'capricorn',
  'aquarius',
  'pisces',
] as const;

export type ZodiacSign = (typeof SIGNS)[number];

// Derivar signo e grau a partir da longitude eclíptica
export function signFromLongitude(longitude: number): { sign: ZodiacSign; degree: number } {
  const normalized = ((longitude % 360) + 360) % 360;
  const index = Math.floor(normalized / 30);
  const degree = normalized - index * 30;
  return { sign: SIGNS[index], degree: Math.round(degree * 100) / 100 };
}

// Aspectos maiores com orbes padrão (em graus)
export const ASPECTS = [
  { name: 'conjunction', angle: 0, orb: 8 },
  { name: 'opposition', angle: 180, orb: 8 },
  { name: 'trine', angle: 120, orb: 7 },
  { name: 'square', angle: 90, orb: 7 },
  { name: 'sextile', angle: 60, orb: 5 },
] as const;

export type AspectName = (typeof ASPECTS)[number]['name'];
