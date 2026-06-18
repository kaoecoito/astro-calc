import type { FastifyPluginAsyncZod } from 'fastify-type-provider-zod';
import { ProgressionInputSchema } from '../schemas/input.js';
import { ProgressionChartSchema, ErrorResponseSchema } from '../schemas/output.js';
import { buildNatalChart } from '../services/natal.js';
import { buildProgressionChart } from '../services/progressions.js';
import { EphemerisError } from '../lib/types.js';

const progressionsRoute: FastifyPluginAsyncZod = async (app) => {
  app.post('/v1/progressions', {
    schema: {
      body: ProgressionInputSchema,
      response: {
        200: ProgressionChartSchema,
        422: ErrorResponseSchema,
      },
    },
  }, async (request, reply) => {
    try {
      const natalChart = buildNatalChart(request.body.natal);
      const progressionChart = buildProgressionChart(request.body, natalChart.houses.cusps);
      return progressionChart;
    } catch (err) {
      if (err instanceof EphemerisError) {
        return reply.status(422).send({ error: { code: err.code, message: err.message } });
      }
      throw err;
    }
  });
};

export default progressionsRoute;
