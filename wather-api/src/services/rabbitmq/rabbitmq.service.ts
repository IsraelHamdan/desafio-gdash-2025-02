/* eslint-disable prettier/prettier */
/* eslint-disable @typescript-eslint/no-redundant-type-constituents */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-call */

import {
  Injectable,
  Logger,
  OnModuleDestroy,
  OnModuleInit,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as amqp from 'amqplib';

@Injectable()
export class RabbitmqService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(RabbitmqService.name);

  private connection: any | null = null;
  private channel: any | null = null;

  private readonly rabbitURL: string;

  constructor(private readonly config: ConfigService) {
    this.rabbitURL =
      this.config.get<string>('RABBITMQ_URL') ??
      'amqp://guest:guest@rabbitmq:5672/';
  }

  async onModuleInit() {
    this.logger.log(`🔌 Conectando ao RabbitMQ: ${this.rabbitURL}`);
    this.connection = await amqp.connect(this.rabbitURL);
    this.logger.log('✅ Conectado ao RabbitMQ');

    this.channel = await this.connection.createChannel();
    this.logger.log('✅ Canal RabbitMQ criado');
  }

  async onModuleDestroy() {
    this.logger.log('🛑 Fechando conexão RabbitMQ...');
    await this.channel?.close();
    await this.connection?.close();
  }

  async sendToQueue(queue: string, payload: unknown) {
    if (!this.channel) {
      this.logger.error('❌ Canal RabbitMQ não inicializado');
      throw new Error('RabbitMQ channel not initialized');
    }

    await this.channel.assertQueue(queue, { durable: true });
    const body = Buffer.from(JSON.stringify(payload));

    this.logger.log(`📤 Enviando mensagem para fila '${queue}'`);
    this.logger.debug(
      `📦 Payload: ${JSON.stringify(payload).substring(0, 200)}...`,
    );

    this.channel.sendToQueue(queue, body, { persistent: true });
    this.logger.log(`✅ Mensagem enviada para '${queue}'`);
  }
}
