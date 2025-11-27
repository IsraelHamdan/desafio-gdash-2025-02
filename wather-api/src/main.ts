/* eslint-disable prettier/prettier */
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import {
  FastifyAdapter,
  NestFastifyApplication,
} from '@nestjs/platform-fastify';
import helmet from '@fastify/helmet';
import cors from '@fastify/cors';
import cookie from '@fastify/cookie';

async function bootstrap() {
  const app = await NestFactory.create<NestFastifyApplication>(
    AppModule,
    new FastifyAdapter(),
  );

  await app.register(helmet);

  await app.register(cors, { origin: true, credentials: true });

  app
    .getHttpAdapter()
    .getInstance()
    .addHook('onSend', (request, reply, payload, done) => {
      reply.header('Content-Type', 'application/json');
      done();
    });

  await app.register(cookie, {
    secret: process.env.COOKIE_SECRET ?? 'dev-cookie-secret',
  });

  const port = Number(process.env.PORT || 300);

  await app.listen(port, '0.0.0.0');
}
bootstrap();
