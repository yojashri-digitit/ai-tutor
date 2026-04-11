import { Injectable, BadRequestException } from '@nestjs/common';
import mammoth from 'mammoth';
import { PrismaService } from '../prisma/prisma.service';
import { RagService } from '../rag/rag.service';
import * as crypto from 'crypto';
import type { Express } from 'express';
import { repl } from '@nestjs/core';

const pdfParse = (...args: any[]) => require('pdf-parse')(...args);

type ProcessFileResult = {
  message: string;
  documentId: number;
  versionId: number;
  chatSessionId: number | null;
  reused: boolean;
  updated: boolean;
  replaced: boolean;
  uploadedAt?: Date;
  fileName?: string;
};

@Injectable()
export class DocumentService {
  constructor(
    private prisma: PrismaService,
    private ragService: RagService
  ) {}

  //////////////////////////////////////////////////////
  // 🚀 MAIN FUNCTION
  //////////////////////////////////////////////////////
  async processFile(
    file: Express.Multer.File,
    userId: number,
    replace=false
  ): Promise<ProcessFileResult> {
    if (!file) throw new BadRequestException('No file uploaded');

    ////////////////////////////////////////////
    // 🔥 HASH
    ////////////////////////////////////////////
    const hash = crypto
      .createHash('md5')
      .update(file.buffer)
      .digest('hex');

    ////////////////////////////////////////////
    // 🧠 CHECK DUPLICATE
    ////////////////////////////////////////////
    const existingVersion = await this.prisma.documentVersion.findFirst({
  where: {
    hash,
    document: {
      userId,
    },
  },
  include: {
    document: {
      include: {
        chats: {
          orderBy: { createdAt: "desc" },
          take: 1,
        },
      },
    },
  },
});
 if (existingVersion && !replace) {
  const existingChat = existingVersion.document.chats[0];

  return {
    message: '⚠️ File already exists',
    documentId: existingVersion.documentId,
    versionId: existingVersion.id,
    chatSessionId: existingChat?.id || null,

    reused: true,
    updated: false,
    replaced: false,

    uploadedAt: existingVersion.createdAt,
    fileName: existingVersion.document.name,
  };
}

    ////////////////////////////////////////////
    // 🔁 REUSE EXISTING FILE
    ////////////////////////////////////////////
  if (existingVersion && replace) {
  await this.prisma.chunk.deleteMany({
    where: {
      version: {
        documentId: existingVersion.documentId,
      },
    },
  });

  await this.prisma.documentVersion.deleteMany({
    where: {
      documentId: existingVersion.documentId,
    },
  });
}

    ////////////////////////////////////////////
    // 📄 PARSE FILE
    ////////////////////////////////////////////
    const text = await this.parseFile(file);

    if (!text || text.trim().length < 20) {
      throw new BadRequestException('Invalid document');
    }

    ////////////////////////////////////////////
    // 🔍 FIND DOCUMENT
    ////////////////////////////////////////////
    let document: any = await this.prisma.document.findFirst({
      where: { userId, name: file.originalname },
      include: {
        versions: { orderBy: { createdAt: 'desc' }, take: 1 },
      },
    });

    //////////////////////////////////////////////////////
    // 🆕 CREATE NEW DOCUMENT
    //////////////////////////////////////////////////////
    if (!document) {
      document = await this.prisma.document.create({
        data: {
          name: file.originalname,
          fileType: file.mimetype,
          fileSize: file.size,
          userId,
        },
      });

      const version = await this.prisma.documentVersion.create({
        data: {
          documentId: document.id,
          versionNumber: 1,
          hash,
        },
      });

      await this.storeChunks(text, version.id);

      const chat = await this.prisma.chatSession.create({
        data: {
          documentId: document.id,
          versionId: version.id, // 🔥 IMPORTANT
          userId,
        },
      });

      return {
        message: '✅ Document uploaded',
        documentId: document.id,
        versionId: version.id,
        chatSessionId: chat.id,
        reused: false,
        updated: false,
        replaced: false,
      };
    }

    //////////////////////////////////////////////////////
    // 🔄 CREATE NEW VERSION
    //////////////////////////////////////////////////////
    const oldVersion = document.versions?.[0];

    const version = await this.prisma.documentVersion.create({
      data: {
        documentId: document.id,
        versionNumber: (oldVersion?.versionNumber || 0) + 1,
        hash,
      },
    });

    await this.storeChunks(text, version.id);

    const chat = await this.prisma.chatSession.create({
      data: {
        documentId: document.id,
        versionId: version.id, // 🔥 IMPORTANT
        userId,
      },
    });

    return {
      message: '🟡 Document updated',
      documentId: document.id,
      versionId: version.id,
      chatSessionId: chat.id,
      reused: false,
      updated: true,
      replaced: false,
    };
  }

  //////////////////////////////////////////////////////
  // 📄 FILE PARSER
  //////////////////////////////////////////////////////
  async parseFile(file: Express.Multer.File): Promise<string> {
    if (file.mimetype === 'application/pdf') {
      const data = await pdfParse(file.buffer);
      return data.text;
    }

    if (file.mimetype.includes('word')) {
      const result = await mammoth.extractRawText({
        buffer: file.buffer,
      });
      return result.value;
    }

    throw new BadRequestException('Unsupported file');
  }

  //////////////////////////////////////////////////////
  // ✂️ CHUNKING
  //////////////////////////////////////////////////////
  chunkText(text: string): string[] {
    return text
      .split(/\n\s*\n/)
      .map((c) => c.trim())
      .filter((c) => c.length > 80)
      .slice(0, 200);
  }

  //////////////////////////////////////////////////////
  // 🧠 STORE CHUNKS
  //////////////////////////////////////////////////////
  async storeChunks(text: string, versionId: number) {
    const chunks = this.chunkText(text);

    for (const chunk of chunks) {
      const embedding = await this.ragService.getEmbedding(chunk);
      if (!embedding?.length) continue;

      await this.prisma.$executeRawUnsafe(`
        INSERT INTO "Chunk" (content, embedding, "versionId")
        VALUES (
          '${chunk.replace(/'/g, "''")}',
          '[${embedding.join(',')}]'::vector,
          ${versionId}
        );
      `);
    }
  }

  //////////////////////////////////////////////////////
  // 📂 SIDEBAR
  //////////////////////////////////////////////////////
  async getUserDocuments(userId: number) {
    return this.prisma.document.findMany({
      where: { userId },
      include: {
        versions: {
          orderBy: { createdAt: 'desc' },
          take: 1,
        },
        chats: {
          orderBy: { createdAt: 'desc' },
          take: 1,
        },
      },
    });
  }
}