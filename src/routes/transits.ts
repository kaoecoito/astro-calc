import type { FastifyPluginAsyncZod } from 'fastify-type-provider-zod';
import { TransitInputSchema } from '../schemas/input.js';
import { TransitChartSchema, ErrorResponseSchema } from '../schemas/output.js';
import { buildNatalChart } from '../services/natal.js';
import { buildTransitChart } from '../services/transits.js';
import { EphemerisError } from '../lib/types.js';

const transitsRoute: FastifyPluginAsyncZod = async (app) => {
  app.post('/v1/transits', {
    schema: {
      body: TransitInputSchema,
      response: {
        200: TransitChartSchema,
        422: ErrorResponseSchema,
      },
    },
  }, async (request, reply) => {
    try {
      const natalChart = buildNatalChart(request.body.natal);
      const transitChart = buildTransitChart(request.body, natalChart);
      return transitChart;
    } catch (err) {
      if (err instanceof EphemerisError) {
        return reply.status(422).send({ error: { code: err.code, message: err.message } });
      }
      throw err;
    }
  });
};

export default transitsRoute;
