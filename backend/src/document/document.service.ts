import { Injectable } from '@nestjs/common';
import mammoth from 'mammoth';
import { PrismaService } from '../prisma/prisma.service';
import { RagService } from '../rag/rag.service';
import type { Express } from 'express';

// PDF parser fix
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

    console.log("TEXT LENGTH:", text.length);
    console.log("TEXT SAMPLE:", text.slice(0, 200));

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

    console.log("TOTAL CHUNKS:", chunks.length);

    for (const chunk of chunks) {
      console.log("Processing chunk:", chunk.slice(0, 50));

      const embedding = await this.ragService.getEmbedding(chunk);

      // ✅ SAFETY CHECK (VERY IMPORTANT)
      if (!embedding || embedding.length === 0) {
        console.warn("⚠️ Skipping empty embedding chunk");
        continue;
      }

      await this.prisma.$executeRawUnsafe(`
        INSERT INTO "Chunk" (content, embedding, "documentId")
        VALUES (
          '${chunk.replace(/'/g, "''")}',
          '[${embedding.join(',')}]'::vector,
          ${document.id}
        );
      `);
    }

    return {
      message: 'Document processed successfully',
      totalChunks: chunks.length,
    };
  }

  // 📄 FILE PARSER
  async parseFile(file: Express.Multer.File): Promise<string> {
    if (file.mimetype === 'application/pdf') {
      console.log("Parsing PDF...");

      try {
        const data = await pdfParse(file.buffer);

        if (!data.text || data.text.trim().length < 20) {
          throw new Error('Empty or scanned PDF');
        }

        return data.text;

      } catch (err) {
        console.error("PDF parsing failed:", err);
        throw new Error('Failed to parse PDF. Use text-based PDF.');
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

  // ✅ IMPROVED CHUNKING
  chunkText(text: string) {
    return text
      .split(/\n\s*\n/)
      .map(c => c.trim())
      .filter(c => c.length > 30);
  }
}