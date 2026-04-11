import {
  Injectable,
  ForbiddenException,
  BadRequestException,
} from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";

@Injectable()
export class ChatService {
  constructor(private prisma: PrismaService) {}

  //////////////////////////////////////////////////////
  // 💬 CREATE CHAT SESSION (WITH VERSION 🔥)
  //////////////////////////////////////////////////////
  async createSession(
    documentId: number,
    versionId: number,
    userId: number
  ) {
    if (!documentId || !versionId || !userId) {
      throw new BadRequestException("Invalid data");
    }

    return this.prisma.chatSession.create({
      data: {
        documentId,
        versionId, // ✅ IMPORTANT
        userId,
      },
    });
  }

  //////////////////////////////////////////////////////
  // 💾 SAVE MESSAGE
  //////////////////////////////////////////////////////
  async saveMessage(
    chatSessionId: number,
    role: "user" | "assistant", // ✅ FIXED
    content: string
  ) {
    if (!chatSessionId) {
      throw new BadRequestException("Invalid chatSessionId");
    }

    if (!content?.trim()) {
      throw new BadRequestException("Message cannot be empty");
    }

    return this.prisma.message.create({
      data: {
        chatSessionId,
        role,
        content,
      },
    });
  }

  //////////////////////////////////////////////////////
  // 📥 GET MESSAGES (VERSION SAFE 🔥)
  //////////////////////////////////////////////////////
  async getMessages(chatSessionId: number, userId: number) {
    const chat = await this.prisma.chatSession.findFirst({
      where: {
        id: chatSessionId,
        userId,
      },
    });

    if (!chat) {
      throw new ForbiddenException("Access denied");
    }

    const messages = await this.prisma.message.findMany({
      where: { chatSessionId },
      orderBy: { createdAt: "asc" },
    });

    return {
      messages,
      versionId: chat.versionId, // ✅ FIXED
    };
  }

  //////////////////////////////////////////////////////
  // ❌ DELETE CHAT (SAFE 🔥)
  //////////////////////////////////////////////////////
  async deleteChat(chatSessionId: number, userId: number) {
    const chat = await this.prisma.chatSession.findFirst({
      where: {
        id: chatSessionId,
        userId,
      },
    });

    if (!chat) {
      throw new ForbiddenException("Chat not found");
    }

    // ✅ Only delete chat (not whole document!)
    await this.prisma.chatSession.delete({
      where: { id: chatSessionId },
    });

    return { message: "Chat deleted ✅" };
  }

  //////////////////////////////////////////////////////
  // 📊 GET USER CHATS (SIDEBAR 🔥)
  //////////////////////////////////////////////////////
  async getUserChats(userId: number) {
    if (!userId) {
      throw new BadRequestException("Invalid user");
    }

    return this.prisma.chatSession.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      include: {
        document: {
          select: {
            id: true,
            name: true,
          },
        },
        messages: {
          take: 1,
          orderBy: { createdAt: "asc" },
        },
      },
    });
  }

  //////////////////////////////////////////////////////
  // 🔍 GET QUESTIONS ONLY
  //////////////////////////////////////////////////////
  async getQuestions(chatSessionId: number, userId: number) {
    const chat = await this.prisma.chatSession.findFirst({
      where: {
        id: chatSessionId,
        userId,
      },
    });

    if (!chat) throw new ForbiddenException("Access denied");

    return this.prisma.message.findMany({
      where: {
        chatSessionId,
        role: "user",
      },
      select: {
        id: true,
        content: true,
      },
      orderBy: { createdAt: "asc" },
    });
  }
}