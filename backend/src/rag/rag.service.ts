// src/rag/rag.service.ts

import { Injectable } from '@nestjs/common';
import axios from 'axios';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class RagService {
  constructor(private prisma: PrismaService) {}

  async getEmbedding(text: string) {
    const res = await axios.post(
      'http://localhost:11434/api/embed',
      {
        model: 'llama3:8b',
        prompt: text
      }
    );

    return res.data.embedding;
  }

  async askQuestion(question: string) {
    const queryEmbedding = await this.getEmbedding(question);

    const chunks: any = await this.prisma.$queryRaw`
      SELECT *, embedding <-> ${queryEmbedding} AS distance
      FROM "Chunk"
      ORDER BY distance ASC
      LIMIT 5;
    `;

    const context = chunks.map(c => c.content).join('\n');

    const prompt = `
    Answer ONLY from context.
    If not found say "Not found in document".

    Context:
    ${context}

    Question:
    ${question}
    `;

    const res = await axios.post(
      'http://localhost:11434/api/generate',
      {
        model: 'llama3:8b',
        prompt,
        stream: false
      }
    );

    return res.data.response;
  }
}