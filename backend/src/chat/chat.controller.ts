import {
  Controller,
  Get,
  Param,
  Delete,
  UseGuards,
  Req,
  BadRequestException,
} from "@nestjs/common";
import { ChatService } from "./chat.service";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { Request } from "express";

@Controller("chat")
@UseGuards(JwtAuthGuard)
export class ChatController {
  constructor(private readonly chatService: ChatService) {}

  //////////////////////////////////////////////////////
  // 📊 GET ALL CHATS (SIDEBAR)
  //////////////////////////////////////////////////////
  @Get()
  async getUserChats(@Req() req: Request & { user: any }) {
    const userId = req.user?.id;

    const chats = await this.chatService.getUserChats(userId);

    // ✅ FORMAT FOR FRONTEND
    const formatted = chats.map((chat) => ({
      id: chat.id,
      document: chat.document,
      versionId: chat.versionId, // 🔥 IMPORTANT
      createdAt: chat.createdAt,
    }));

    return {
      success: true,
      chats: formatted,
    };
  }

  //////////////////////////////////////////////////////
  // 📥 GET SINGLE CHAT
  //////////////////////////////////////////////////////
  @Get(":id")
  async getMessages(
    @Param("id") id: string,
    @Req() req: Request & { user: any }
  ) {
    const chatId = Number(id);
    const userId = req.user?.id;

    if (!chatId) throw new BadRequestException("Invalid chatId");

    const result = await this.chatService.getMessages(chatId, userId);

    return {
      success: true,
      messages: result.messages,
      versionId: result.versionId, // 🔥 CRITICAL
    };
  }

  //////////////////////////////////////////////////////
  // ❌ DELETE CHAT
  //////////////////////////////////////////////////////
  @Delete(":id")
  async deleteChat(
    @Param("id") id: string,
    @Req() req: Request & { user: any }
  ) {
    const chatId = Number(id);
    const userId = req.user?.id;

    await this.chatService.deleteChat(chatId, userId);

    return {
      success: true,
      message: "Chat deleted",
    };
  }

  //////////////////////////////////////////////////////
  // 🔍 QUESTIONS
  //////////////////////////////////////////////////////
  @Get("questions/:id")
  async getQuestions(
    @Param("id") id: string,
    @Req() req: Request & { user: any }
  ) {
    const chatId = Number(id);
    const userId = req.user?.id;

    const questions = await this.chatService.getQuestions(chatId, userId);

    return {
      success: true,
      questions,
    };
  }
}