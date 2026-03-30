// src/rag/rag.controller.ts

import { Controller, Post, Body } from '@nestjs/common';
import { RagService } from './rag.service';

@Controller('rag')
export class RagController {
  constructor(private ragService: RagService) {}

  @Post('ask')
  async ask(@Body('question') question: string) {
    return this.ragService.askQuestion(question);
  }
}