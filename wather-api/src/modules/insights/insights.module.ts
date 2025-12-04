/* eslint-disable prettier/prettier */
import { WeatherInsight, WeatherInsightSchema } from '$/schemas/insights/insight.schema';
import { InsigthsService } from '$/services/insigths/insigths.service';
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';

@Module({
  imports: [
    ConfigModule,
    MongooseModule.forFeature([
      { name: WeatherInsight.name, schema: WeatherInsightSchema },
    ]),
  ],
  providers: [InsigthsService],
  exports: [InsigthsService],
})
export class InsightsModule {}
