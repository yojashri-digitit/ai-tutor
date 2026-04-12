import {
  Injectable,
  BadRequestException,
  HttpException,
  HttpStatus,
} from "@nestjs/common";
import axios from "axios";
import { PrismaService } from "../prisma/prisma.service";
import { ChatService } from "../chat/chat.service";

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

      const res = await axios.post("http://localhost:11434/api/embeddings", {
        model: "nomic-embed-text",
        prompt: text,
      });

      return res.data?.embedding || [];
    } catch (err: any) {
      console.error("❌ Embedding error:", err.message);
      return [];
    }
  }

  //////////////////////////////////////////////////////
  // 🚀 MAIN ASK FUNCTION (FINAL 🔥)
  //////////////////////////////////////////////////////
  async askQuestion(
    question: string,
    versionId: number | null,
    chatSessionId: number | null,
    userId: number, // ✅ FIXED
    course?: string
  ) {
    try {
      ////////////////////////////////////////////
      // ✅ VALIDATION
      ////////////////////////////////////////////
      if (!question?.trim()) {
        throw new BadRequestException("Enter a valid question");
      }

      if (!userId) {
        throw new BadRequestException("User required");
      }

      if (!question || question.trim().length < 3) {
  throw new BadRequestException("Invalid topic");
}

const invalidWords = ["abc", "xyz", "asdf", "mmmm"];

if (invalidWords.includes(question.toLowerCase())) {
  throw new BadRequestException("Invalid topic provided");
}

// extra strong validation
if (!/[a-zA-Z]{3,}/.test(question)) {
  throw new BadRequestException("Enter meaningful topic");
}
      ////////////////////////////////////////////
      // 🆕 CREATE CHAT IF NOT EXISTS
      ////////////////////////////////////////////
      if (!chatSessionId) {
        const newChat = await this.chatService.createSession(
          userId,
         null,
         null
        );
        chatSessionId = newChat.id;
      }

      ////////////////////////////////////////////
      // 🚫 RATE LIMIT
      ////////////////////////////////////////////
      const recent = await this.prisma.message.count({
        where: {
          chatSessionId,
          createdAt: {
            gte: new Date(Date.now() - 60 * 1000),
          },
        },
      });

      if (recent > 10) {
        throw new HttpException(
          "Too many requests, slow down",
          HttpStatus.TOO_MANY_REQUESTS
        );
      }

      ////////////////////////////////////////////
      // 💾 SAVE USER MESSAGE
      ////////////////////////////////////////////
      await this.chatService.saveMessage(chatSessionId, "user", question);

      ////////////////////////////////////////////
      // 🧠 CONTEXT (DOC MODE)
      ////////////////////////////////////////////
      let context = "";

      if (versionId) {
        const embedding = await this.getEmbedding(question);

        if (embedding.length) {
          const vector = `[${embedding.join(",")}]`;

          const results = await this.prisma.$queryRawUnsafe(`
            SELECT content
            FROM "Chunk"
            WHERE "versionId" = ${versionId}
            ORDER BY embedding <-> '${vector}'::vector
            LIMIT 10;
          `) as { content: string }[];

          context = results
            .map((r) => r.content)
            .join("\n\n")
            .slice(0, 6000);
        }
      }

      ////////////////////////////////////////////
      // 🔥 PROMPT (SMART MODE)
      ////////////////////////////////////////////
      const isDocMode = !!versionId;

      const prompt = `
You are an AI Tutor.

MODE:
${isDocMode ? "DOCUMENT MODE (strictly use context)" : "TOPIC MODE (generate notes)"}

Course: ${course || "General"}
Topic: ${question}

${context ? `Context:\n${context}` : ""}

Generate structured notes:

FORMAT:
# ${question}

## 1. Introduction
## 2. Key Concepts
## 3. Detailed Explanation
## 4. Examples
## 5. Important Points
## 6. Summary

STYLE:
- Clear
- Structured
- Student-friendly
`;

      ////////////////////////////////////////////
      // 🤖 PRIMARY MODEL
      ////////////////////////////////////////////
      let answer = "";

      try {
        const response = await axios.post(
          "https://openrouter.ai/api/v1/chat/completions",
          {
            model: "meta-llama/llama-3-8b-instruct",
            messages: [{ role: "user", content: prompt }],
            temperature: 0.3,
          },
          {
            headers: {
              Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`,
            },
          }
        );

        answer = response.data?.choices?.[0]?.message?.content || "";
      } catch {
        console.log("⚠️ Primary model failed");
      }

      ////////////////////////////////////////////
      // 🔁 FALLBACK MODEL
      ////////////////////////////////////////////
      if (!answer || answer.length < 20) {
        const fallback = await axios.post(
          "https://openrouter.ai/api/v1/chat/completions",
          {
            model: "mistralai/mistral-7b-instruct",
            messages: [{ role: "user", content: prompt }],
          },
          {
            headers: {
              Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`,
            },
          }
        );

        answer =
          fallback.data?.choices?.[0]?.message?.content ||
          "Failed to generate";
      }

      ////////////////////////////////////////////
      // 🧠 EVALUATION MODEL
      ////////////////////////////////////////////
      try {
        const evalRes = await axios.post(
          "https://openrouter.ai/api/v1/chat/completions",
          {
            model: "meta-llama/llama-3-8b-instruct",
            messages: [
              {
                role: "user",
                content: `Rate this answer out of 10:\n${answer}`,
              },
            ],
          },
          {
            headers: {
              Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`,
            },
          }
        );

        console.log(
          "📊 Quality:",
          evalRes.data?.choices?.[0]?.message?.content
        );
      } catch {
        console.log("⚠️ Evaluation skipped");
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
        chatSessionId, // 🔥 IMPORTANT for frontend
      };
    } catch (error: any) {
      console.error("❌ RAG ERROR:", error.message);
      throw new BadRequestException("Failed to generate answer");
    }
  }
}