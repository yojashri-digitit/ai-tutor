import { Injectable } from '@nestjs/common';
import mammoth from 'mammoth';
import { PrismaService } from '../prisma/prisma.service';
import { RagService } from '../rag/rag.service';
import type { Express } from 'express';

// 🔥 FINAL FIX (force correct function)
const pdfParse = (...args: any[]) =>
  require('pdf-parse')(...args);

@Injectable()
export class DocumentService {
  constructor(
    private prisma: PrismaService,
    private ragService: RagService
  ) {}

  async processFile(file: Express.Multer.File) {
    if (!file) {
      throw new Error('No file uploaded');
    }

    const text = await this.parseFile(file);

    if (!text || text.trim().length < 20) {
      throw new Error('Provide valid text-based document');
    }

    const document = await this.prisma.document.create({
      data: {
        name: file.originalname,
        content: text,
      },
    });

    const chunks = this.chunkText(text);

    for (const chunk of chunks) {
      const embedding = await this.ragService.getEmbedding(chunk);

      await this.prisma.chunk.create({
        data: {
          content: chunk,
          embedding,
          documentId: document.id,
        },
      });
    }

    return {
      message: 'Document processed successfully',
      totalChunks: chunks.length,
    };
  }

  // 📄 FIXED PDF PARSER
  async parseFile(file: Express.Multer.File): Promise<string> {

    if (file.mimetype === 'application/pdf') {
      console.log("Parsing PDF (final fix)...");

      try {
        const data = await pdfParse(file.buffer);

        if (!data.text || data.text.trim().length < 20) {
          throw new Error('Empty PDF');
        }

        return data.text;

      } catch (err) {
        console.error("PDF parsing failed:", err);
        throw new Error('Failed to parse PDF. Ensure it is text-based.');
      }
    }

    if (file.mimetype.includes('word')) {
      const result = await mammoth.extractRawText({
        buffer: file.buffer,
      });

      return result.value;
    }

    throw new Error('Unsupported file type');
  }

  chunkText(text: string) {
    const size = 500;
    const chunks: string[] = [];

    for (let i = 0; i < text.length; i += size) {
      chunks.push(text.slice(i, i + size));
    }

    return chunks;
  }
}