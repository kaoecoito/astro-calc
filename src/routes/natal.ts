import type { FastifyPluginAsyncZod } from 'fastify-type-provider-zod';
import { NatalInputSchema } from '../schemas/input.js';
import { NatalChartSchema, ErrorResponseSchema } from '../schemas/output.js';
import { buildNatalChart } from '../services/natal.js';
import { EphemerisError } from '../lib/types.js';

const natalRoute: FastifyPluginAsyncZod = async (app) => {
  app.post('/v1/natal', {
    schema: {
      body: NatalInputSchema,
      response: {
        200: NatalChartSchema,
        422: ErrorResponseSchema,
      },
    },
  }, async (request, reply) => {
    try {
      const chart = buildNatalChart(request.body);
      return chart;
    } catch (err) {
      if (err instanceof EphemerisError) {
        return reply.status(422).send({ error: { code: err.code, message: err.message } });
      }
      throw err;
    }
  });
};

export default natalRoute;
