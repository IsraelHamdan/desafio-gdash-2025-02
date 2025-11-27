/* eslint-disable prettier/prettier */
import { RabbitmqService } from '$/services/rabbitmq/rabbitmq.service';
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';

@Module({
  imports: [ConfigModule],
  providers: [RabbitmqService],
  exports: [RabbitmqService],
})
export class RabbitmqModule {}
