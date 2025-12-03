/* eslint-disable prettier/prettier */
import { InsigthsService } from '$/services/insigths/insigths.service';
import { Module } from '@nestjs/common';
import {} from '$/schemas/insights/insight.schema';

@Module({
  providers: [InsigthsService],
  exports: [InsigthsService],
})
export class InsightsModule {}
