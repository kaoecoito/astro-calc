import { z } from 'zod';
import { SIGNS, HOUSE_SYSTEMS, ASPECTS, MVP_PLANETS } from '../lib/constants.js';

const planetNameSchema = z.enum(MVP_PLANETS as [string, ...string[]]);
const signSchema = z.enum(SIGNS);
const houseSystemSchema = z.enum(Object.keys(HOUSE_SYSTEMS) as [string, ...string[]]);
const aspectNameSchema = z.enum(ASPECTS.map((a) => a.name) as [string, ...string[]]);

export const PlanetPositionSchema = z.object({
  name: planetNameSchema,
  sign: signSchema,
  degree: z.number(),
  longitude: z.number(),
  house: z.number().int().min(1).max(12),
  retrograde: z.boolean(),
});

export const HouseDataSchema = z.object({
  system: houseSystemSchema,
  cusps: z.array(z.number()).length(12), // índices 0–11 = casas 1–12
  ascendant: z.number(),
  midheaven: z.number(),
});

export const AspectSchema = z.object({
  from: planetNameSchema,
  to: planetNameSchema,
  type: aspectNameSchema,
  orb: z.number(),
  applying: z.boolean().optional(),
});

// Metadados de como a hora local foi resolvida para UTC (transparência do horário de verão)
export const TimeResolutionSchema = z.object({
  utc: z.string(),
  utcOffset: z.string(), // ex: "-03:00"
  dstApplied: z.boolean(), // horário de verão foi aplicado
  ambiguous: z.boolean(), // hora caiu na sobreposição da volta do horário de verão
  adjusted: z.boolean(), // hora caiu no salto inexistente do início do horário de verão
});

export const NatalChartSchema = z.object({
  planets: z.array(PlanetPositionSchema),
  houses: HouseDataSchema,
  aspects: z.array(AspectSchema),
  timeResolution: TimeResolutionSchema,
});

export const TransitPlanetPositionSchema = PlanetPositionSchema.extend({
  aspectsToNatal: z.array(AspectSchema),
});

export const TransitChartSchema = z.object({
  date: z.string(),
  mode: z.enum(['daily', 'weekly', 'monthly']),
  planets: z.array(TransitPlanetPositionSchema),
});

export const ProgressionChartSchema = z.object({
  progressedDate: z.string(),
  yearsElapsed: z.number(),
  planets: z.array(PlanetPositionSchema),
  aspects: z.array(AspectSchema),
});

export const ErrorResponseSchema = z.object({
  error: z.object({
    code: z.string(),
    message: z.string(),
  }),
});

export type NatalChart = z.infer<typeof NatalChartSchema>;
export type TransitChart = z.infer<typeof TransitChartSchema>;
export type ProgressionChart = z.infer<typeof ProgressionChartSchema>;
