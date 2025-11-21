import { Module } from '@nestjs/common';
import { ArgonService } from 'src/services/argon/argon.service';

@Module({
  providers: [ArgonService], 
  exports: [ArgonService]
})
export class ArgonModule {}
