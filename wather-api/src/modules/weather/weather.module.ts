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
import { InsightsModule } from '../insights/insights.module';
import { WeatherInsight, WeatherInsightSchema } from '$/schemas/insights/insight.schema';
import { ExportModule } from '../export/export.module';
import { ExportService } from '$/services/export/export.service';

@Module({
  controllers: [WeatherController],
  providers: [WeatherService, RabbitmqService, ExportService],
  imports: [
    RabbitmqModule,
    MongooseModule.forFeature([
      { name: WeatherLog.name, schema: WeatherLogSchema },
      { name: Location.name, schema: LocSchema },
      { name: WeatherInsight.name, schema: WeatherInsightSchema },

    ]),
    InsightsModule,
    ExportModule
  ],
  
})
export class WeatherModule {}
