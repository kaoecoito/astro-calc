import 'dotenv/config';
import Fastify, { type FastifyError } from 'fastify';
import { serializerCompiler, validatorCompiler } from 'fastify-type-provider-zod';
import { initEphemeris, closeEphemeris } from './services/ephemeris.js';
import natalRoute from './routes/natal.js';
import transitsRoute from './routes/transits.js';
import progressionsRoute from './routes/progressions.js';

const PORT = parseInt(process.env.PORT ?? '3001', 10);
const LOG_LEVEL = process.env.LOG_LEVEL ?? 'info';

const app = Fastify({ logger: { level: LOG_LEVEL } });

app.setValidatorCompiler(validatorCompiler);
app.setSerializerCompiler(serializerCompiler);

// Handler centralizado de erros — não loga dados sensíveis do usuário
app.setErrorHandler((error: FastifyError, _request, reply) => {
  if (error.validation) {
    return reply.status(400).send({
      error: { code: 'VALIDATION_ERROR', message: error.message },
    });
  }
  app.log.error({ name: error.name, code: error.code }, error.message);
  return reply.status(500).send({
    error: { code: 'INTERNAL_ERROR', message: 'Erro interno do servidor' },
  });
});

app.get('/health', async () => ({ status: 'ok' }));

await app.register(natalRoute);
await app.register(transitsRoute);
await app.register(progressionsRoute);

initEphemeris();

const shutdown = async (): Promise<void> => {
  await app.close();
  closeEphemeris();
  process.exit(0);
};

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);

try {
  await app.listen({ port: PORT, host: '0.0.0.0' });
} catch (err) {
  app.log.error(err);
  process.exit(1);
}
