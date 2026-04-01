import { Module } from '@nestjs/common';
import { RagService } from './rag.service'; 
import { Prisma } from '@prisma/client';
import { PrismaModule } from 'src/prisma/prisma.module';
import { RagController } from './rag.controller';
@Module({
    imports: [PrismaModule],
  providers: [RagService],
  controllers: [RagController],
  exports: [RagService], // 👈 IMPORTANT
})
export class RagModule {}