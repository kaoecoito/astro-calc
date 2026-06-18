import { z } from 'zod';
import { HOUSE_SYSTEMS } from '../lib/constants.js';

// Valida timezone IANA usando a API Intl nativa do Node
const ianaTimezone = z.string().refine(
  (tz) => {
    try {
      Intl.DateTimeFormat(undefined, { timeZone: tz });
      return true;
    } catch {
      return false;
    }
  },
  { message: 'Timezone IANA inválido' },
);

export const NatalInputSchema = z.object({
  date: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Data deve estar no formato YYYY-MM-DD')
    .refine((d) => !isNaN(Date.parse(d)), 'Data inválida'),
  time: z.string().regex(/^\d{2}:\d{2}$/, 'Hora deve estar no formato HH:mm'),
  timezone: ianaTimezone,
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180),
  houseSystem: z
    .enum(Object.keys(HOUSE_SYSTEMS) as [keyof typeof HOUSE_SYSTEMS])
    .default('placidus'),
});

export type NatalInput = z.infer<typeof NatalInputSchema>;

export const TransitInputSchema = z.object({
  natal: NatalInputSchema,
  targetDate: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Data deve estar no formato YYYY-MM-DD')
    .refine((d) => !isNaN(Date.parse(d)), 'Data inválida'),
  targetTime: z.string().regex(/^\d{2}:\d{2}$/, 'Hora deve estar no formato HH:mm').default('12:00'),
  targetTimezone: ianaTimezone.default('UTC'),
  mode: z.enum(['daily', 'weekly', 'monthly']).default('daily'),
});

export type TransitInput = z.infer<typeof TransitInputSchema>;

export const ProgressionInputSchema = z.object({
  natal: NatalInputSchema,
  targetDate: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Data deve estar no formato YYYY-MM-DD')
    .refine((d) => !isNaN(Date.parse(d)), 'Data inválida'),
});

export type ProgressionInput = z.infer<typeof ProgressionInputSchema>;
