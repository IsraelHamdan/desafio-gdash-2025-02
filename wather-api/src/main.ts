import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { FastifyAdapter, NestFastifyApplication } from '@nestjs/platform-fastify';
import helmet from '@fastify/helmet';
import cors from '@fastify/cors';


async function bootstrap() {
  const app = await NestFactory.create<NestFastifyApplication>(AppModule, new FastifyAdapter());
  
  await app.register(helmet)
  
  await app.register(cors, {origin: true, credentials: true})

  app.getHttpAdapter().getInstance().addHook('onSend', (request, reply, payload, done) => {
    reply.header('Content-Type', 'application/json');
    done();
  });
  
  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();
