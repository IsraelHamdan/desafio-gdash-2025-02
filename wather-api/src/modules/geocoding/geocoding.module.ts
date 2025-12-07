/* eslint-disable prettier/prettier */
import { GeocodingService } from '$/services/geocoding/geocoding.service';
import { HttpModule } from '@nestjs/axios';
import { Module } from '@nestjs/common';

@Module({
  imports: [HttpModule],
  providers: [GeocodingService],
  exports: [GeocodingService]
})
export class GeocodingModule {}
