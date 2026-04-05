import { Module } from '@nestjs/common';
import { TutorService } from './tutor.service';
import { TutorController } from './tutor.controller';
import { PptModule } from '../ppt/ppt.module';

@Module({
  imports: [PptModule],
  controllers: [TutorController],
  providers: [TutorService],
})
export class TutorModule {}