import { Injectable, BadRequestException } from '@nestjs/common';
import axios from 'axios';
import { PrismaService } from '../prisma/prisma.service';
import { ChatService } from '../chat/chat.service';

@Injectable()
export class RagService {
  constructor(
    private prisma: PrismaService,
    private chatService: ChatService
  ) {}

  //////////////////////////////////////////////////////
  // 🔥 EMBEDDING
  //////////////////////////////////////////////////////
  async getEmbedding(text: string): Promise<number[]> {
    try {
      if (!text || text.trim().length < 3) return [];

      const res = await axios.post('http://localhost:11434/api/embeddings', {
        model: 'nomic-embed-text',
        prompt: text,
      });

      return res.data?.embedding || [];
    } catch (err: any) {
      console.error("❌ Embedding error:", err.message);
      return [];
    }
  }

  //////////////////////////////////////////////////////
  // 🚀 ASK QUESTION (HYBRID FINAL 🔥)
  //////////////////////////////////////////////////////
  async askQuestion(
    question: string,
    versionId: number,
    chatSessionId: number
  ) {
    try {
      ////////////////////////////////////////////
      // ✅ VALIDATION
      ////////////////////////////////////////////
      if (!question?.trim()) {
        throw new BadRequestException('Enter a valid question');
      }

      if (!versionId) {
        throw new BadRequestException('versionId required');
      }

      if (!chatSessionId) {
        throw new BadRequestException('chatSessionId required');
      }

      ////////////////////////////////////////////
      // 💾 SAVE USER MESSAGE
      ////////////////////////////////////////////
      await this.chatService.saveMessage(
        chatSessionId,
        "user",
        question
      );

      ////////////////////////////////////////////
      // 🔥 EMBEDDING
      ////////////////////////////////////////////
      const embedding = await this.getEmbedding(question);

      if (!embedding.length) {
        throw new BadRequestException('Embedding failed');
      }

      const vector = `[${embedding.join(',')}]`;

      ////////////////////////////////////////////
      // 🔥 KEYWORD EXTRACTION (HYBRID)
      ////////////////////////////////////////////
      const keywords = question
        .toLowerCase()
        .split(" ")
        .filter((w) => w.length > 3)
        .slice(0, 5);

      const keywordCondition = keywords.length
        ? keywords.map((w) => `content ILIKE '%${w}%'`).join(" OR ")
        : "FALSE";

      ////////////////////////////////////////////
      // 🔍 HYBRID SEARCH
      ////////////////////////////////////////////
      const results = await this.prisma.$queryRawUnsafe(`
        SELECT content,
          (embedding <-> '${vector}'::vector) AS vector_score,
          CASE WHEN ${keywordCondition} THEN 0 ELSE 0.3 END AS keyword_score
        FROM "Chunk"
        WHERE "versionId" = ${versionId}
        ORDER BY (embedding <-> '${vector}'::vector) +
                 (CASE WHEN ${keywordCondition} THEN 0 ELSE 0.3 END)
        LIMIT 15;
      `) as { content: string }[];

      console.log("🔍 Hybrid chunks:", results.length);

      ////////////////////////////////////////////
      // ❌ NO RESULTS
      ////////////////////////////////////////////
      if (!results.length) {
        const fallback = "No relevant content found in this document.";

        await this.chatService.saveMessage(
          chatSessionId,
          "assistant",
          fallback
        );

        return { answer: fallback, sources: [] };
      }

      ////////////////////////////////////////////
      // 🧠 CONTEXT
      ////////////////////////////////////////////
      const context = results
        .map((r) => r.content)
        .join('\n\n')
        .slice(0, 8000);

      ////////////////////////////////////////////
      // 🔥 MODE DETECTION
      ////////////////////////////////////////////
      const isDetailed =
        question.toLowerCase().includes("explain") ||
        question.toLowerCase().includes("detail") ||
        question.toLowerCase().includes("elaborate");

      ////////////////////////////////////////////
      // 🤖 LLM CALL (FIXED 🔥)
      ////////////////////////////////////////////
      const response = await axios.post(
        "https://openrouter.ai/api/v1/chat/completions",
        {
          model: "meta-llama/llama-3-8b-instruct",
          messages: [
            {
              role: "system",
              content: `
You are an AI Tutor.

RULES:

1. NORMAL:
- Answer ONLY from context

2. DETAILED:
- Use context + external knowledge
- Separate clearly:
  - From Document
  - Additional Explanation

3. IRRELEVANT:
- If not related → say "Not related to document"
`,
            },
            {
              role: "user",
              content: `
Context:
${context}

Question:
${question}

Mode: ${isDetailed ? "DETAILED" : "STRICT"}

Answer:
`,
            },
          ],
          temperature: 0.2,
        },
        {
          headers: {
            Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`,
          },
        }
      );

      ////////////////////////////////////////////
      // 🧠 RESPONSE CLEAN
      ////////////////////////////////////////////
      let answer =
        response.data?.choices?.[0]?.message?.content?.trim() ||
        "Not found in document";

      if (answer.length < 5) {
        answer = "Not found in document";
      }

      ////////////////////////////////////////////
      // 💾 SAVE AI MESSAGE
      ////////////////////////////////////////////
      await this.chatService.saveMessage(
        chatSessionId,
        "assistant",
        answer
      );

      ////////////////////////////////////////////
      // ✅ RETURN
      ////////////////////////////////////////////
      return {
        answer,
        sources: results.map((r, i) => ({
          id: i + 1,
          preview: r.content.slice(0, 120),
        })),
      };

    } catch (error: any) {
      console.error("❌ RAG ERROR:", error.message);
      throw new BadRequestException('Failed to generate answer');
    }
  }
}