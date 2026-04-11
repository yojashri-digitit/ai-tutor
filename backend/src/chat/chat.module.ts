import { Module } from "@nestjs/common";
import { ChatService } from "./chat.service";
import { ChatController } from "./chat.controller";
import { PrismaService } from "../prisma/prisma.service";

@Module({
  providers: [ChatService, PrismaService],
  controllers: [ChatController],
  exports: [ChatService], // ✅ EXPORT SERVICE FOR RAG
})
export class ChatModule {}