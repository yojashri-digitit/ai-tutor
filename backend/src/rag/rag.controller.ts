import {
  Controller,
  Post,
  Body,
  BadRequestException,
  HttpException,
  HttpStatus,
  Req,
  UseGuards,
} from "@nestjs/common";
import { RagService } from "./rag.service";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { Request } from "express";

@Controller("rag")
@UseGuards(JwtAuthGuard)
export class RagController {
  constructor(private ragService: RagService) {}

  //////////////////////////////////////////////////////
  // 💬 ASK QUESTION (FINAL CLEAN VERSION 🔥)
  //////////////////////////////////////////////////////
  @Post("ask")
  async ask(
    @Body("question") question: string,
    @Body("versionId") versionId: number,
    @Body("chatSessionId") chatSessionId: number,
    @Req() req: Request & { user: any }
  ) {
    try {
      ////////////////////////////////////////////
      // ✅ VALIDATION
      ////////////////////////////////////////////
      if (!question || question.trim().length < 3) {
        throw new BadRequestException("Enter a valid question");
      }

      if (!versionId || isNaN(Number(versionId))) {
        throw new BadRequestException("Valid versionId is required");
      }

      if (!chatSessionId || isNaN(Number(chatSessionId))) {
        throw new BadRequestException("Valid chatSessionId is required");
      }

      const userId = req.user?.id;

      console.log("💬 Question:", question);
      console.log("📄 Version:", versionId);
      console.log("💬 Chat:", chatSessionId);
      console.log("👤 User:", userId);

      ////////////////////////////////////////////
      // 🔥 CALL RAG SERVICE (handles saving internally)
      ////////////////////////////////////////////
      const result = await this.ragService.askQuestion(
        question.trim(),
        Number(versionId),
        Number(chatSessionId) // ✅ IMPORTANT
      );

      ////////////////////////////////////////////
      // ✅ RESPONSE
      ////////////////////////////////////////////
      return {
        success: true,
        answer: result.answer,
        sources: result.sources || [],
      };

    } catch (error: any) {
      console.error("❌ RAG CONTROLLER ERROR:", error.message);

      throw new HttpException(
        {
          success: false,
          message: error.message || "Failed to process question",
        },
        HttpStatus.BAD_REQUEST
      );
    }
  }
}