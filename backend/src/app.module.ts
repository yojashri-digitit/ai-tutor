import { DocumentController } from './document/document.controller';
import { DocumentService } from './document/document.service';
import { RagService } from './rag/rag.service';
import { RagController } from './rag/rag.controller';
import { Module } from '@nestjs/common';  
import { DocumentModule } from './document/document.module';

import { Throttle, ThrottlerModule } from "@nestjs/throttler";
import { RagModule } from './rag/rag.module';
import { PrismaModule } from './prisma/prisma.module';
import { TutorModule } from './tutor/tutor.module';
import { ConfigModule } from '@nestjs/config/dist/config.module';
import { AuthModule } from './auth/auth.module';
import { ChatModule } from './chat/chat.module';
@Module({
  imports: [
    DocumentModule,PrismaModule,RagModule, TutorModule,ChatModule,
    ThrottlerModule.forRoot({
      throttlers:[
        {
          ttl: 60,
          limit:10,
        }
      ],
    }),
    ConfigModule.forRoot({
      isGlobal: true, // 🔥 important
    }),
    AuthModule,
    
  ],
  controllers: [DocumentController, RagController],
  providers: [DocumentService, RagService],
})
export class AppModule {}