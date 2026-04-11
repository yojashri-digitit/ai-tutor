import { Module } from '@nestjs/common';
import { RagService } from './rag.service'; 
import { Prisma } from '@prisma/client';
import { PrismaModule } from 'src/prisma/prisma.module';
import { RagController } from './rag.controller';
import { ChatModule } from 'src/chat/chat.module';
@Module({
    imports: [PrismaModule,ChatModule],
  providers: [RagService],
  controllers: [RagController],
  exports: [RagService], // 👈 IMPORTANT
})
export class RagModule {}