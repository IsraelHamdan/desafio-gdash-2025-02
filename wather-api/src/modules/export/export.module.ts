/* eslint-disable prettier/prettier */
import { ExportService } from '$/services/export/export.service';
import { Module } from '@nestjs/common';

@Module({
  providers: [ExportService],
  exports: [ExportService]
})
export class ExportModule {}
