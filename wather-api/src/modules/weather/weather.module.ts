/* eslint-disable prettier/prettier */
import { WeatherController } from '$/controllers/weather/weather.controller';
import { WeatherService } from '$/services/weather/weather.service';
import { Module } from '@nestjs/common';
import { RabbitmqModule } from '../rabbitmq/rabbitmq.module';
import { RabbitmqService } from '$/services/rabbitmq/rabbitmq.service';
import { MongooseModule } from '@nestjs/mongoose';
import {
  WeatherLog,
  WeatherLogSchema,
} from '$/schemas/weather/weatherLog.schema';
import { Location, LocSchema } from '$/schemas/weather/locations.schema';

@Module({
  controllers: [WeatherController],
  providers: [WeatherService, RabbitmqService],
  imports: [
    RabbitmqModule,
    MongooseModule.forFeature([
      { name: WeatherLog.name, schema: WeatherLogSchema },
      { name: Location.name, schema: LocSchema },
    ]),
  ],
})
export class WeatherModule {}
