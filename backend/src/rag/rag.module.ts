import { Module } from '@nestjs/common';
import { RagService } from './rag.service'; 
import { Prisma } from '@prisma/client';
import { PrismaModule } from 'src/prisma/prisma.module';
@Module({
    imports: [PrismaModule],
  providers: [RagService],
  exports: [RagService], // 👈 IMPORTANT
})
export class RagModule {}