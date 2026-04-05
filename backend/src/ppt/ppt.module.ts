import { Module } from '@nestjs/common';
import { PptService } from './ppt.service';

@Module({
  providers: [PptService],
  exports: [PptService],
})
export class PptModule {}