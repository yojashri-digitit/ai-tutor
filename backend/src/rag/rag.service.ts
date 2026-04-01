import { Injectable } from '@nestjs/common';
import axios from 'axios';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class RagService {
  constructor(private prisma: PrismaService) {}

  // 🔥 FINAL EMBEDDING FUNCTION
  async getEmbedding(text: string): Promise<number[]> {
    try {
      const response = await axios.post(
        'http://localhost:11434/api/embeddings',
        {
          model: 'nomic-embed-text',
          prompt: text, // ✅ correct field
        }
      );

      console.log("FULL EMBED RESPONSE:", response.data);

      const embedding = response.data.embedding;

      if (!embedding || embedding.length === 0) {
        console.warn("⚠️ Empty embedding returned");
        return [];
      }

      return embedding;

    } catch (error: any) {
      console.error("❌ EMBEDDING ERROR:", error.response?.data || error.message);
      return []; // prevent crash
    }
  }

  // 🚀 RAG QUESTION ANSWERING
  async askQuestion(question: string): Promise<string> {
    try {
      const questionEmbedding = await this.getEmbedding(question);

      if (!questionEmbedding || questionEmbedding.length === 0) {
        throw new Error('Embedding failed');
      }

      const results = await this.prisma.$queryRawUnsafe(`
        SELECT content
        FROM "Chunk"
        ORDER BY embedding <-> '[${questionEmbedding.join(',')}]'::vector
        LIMIT 10;
      `) as Array<{ content: string }>;

      console.log("🔍 Chunks fetched:", results.length);

      const context = results
        .map((r) => r.content)
        .join('\n')
        .slice(0, 4000);

      if (!context) {
        return "No relevant context found in documents.";
      }

      const response = await axios.post(
        "https://openrouter.ai/api/v1/chat/completions",
        {
          model: "meta-llama/llama-3-8b-instruct",
          messages: [
            {
              role: "user",
              content: `
You are an AI Tutor.

Answer using ALL relevant points from the context.
If multiple points exist, list ALL clearly.

If answer is not in context, say "Not found in document".

Context:
${context}

Question:
${question}

Answer:
              `,
            },
          ],
        },
        {
          headers: {
            Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`,
            "Content-Type": "application/json",
          },
        }
      );

      return response.data.choices[0].message.content;

    } catch (error: any) {
      console.error("❌ RAG ERROR:", error.response?.data || error.message);
      throw new Error('Failed to generate answer');
    }
  }
}