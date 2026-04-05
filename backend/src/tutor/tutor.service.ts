import { Injectable } from '@nestjs/common';
import axios from 'axios';
import { PptService } from '../ppt/ppt.service';

@Injectable()
export class TutorService {
  constructor(private pptService: PptService) {}

  // 🔥 GENERATE CONTENT FROM AI
  async generateContent(course: string, topic: string) {
    try {
      const response = await axios.post(
        "https://openrouter.ai/api/v1/chat/completions",
        {
          model: "meta-llama/llama-3-8b-instruct",
          messages: [
            {
              role: "user",
              content: `
Generate lecture content.

Course: ${course}
Topic: ${topic}

Return strictly in JSON:
{
  "title": "",
  "slides": [
    {
      "heading": "",
      "points": ["", "", ""]
    }
  ]
}
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

      const content = response.data.choices[0].message.content;

      // 🔥 Convert string → JSON
      const jsonStart = content.indexOf('{');
      const jsonEnd = content.lastIndexOf('}') + 1;

      const cleanJson = content.substring(jsonStart, jsonEnd);

      const parsed = JSON.parse(cleanJson);

      return parsed;

    } catch (error: any) {
      console.error("❌ CONTENT ERROR:", error.response?.data || error.message);
      throw new Error('Failed to generate content');
    }
  }

  // 🎯 GENERATE PPT
  async generatePPT(course: string, topic: string) {
    const content = await this.generateContent(course, topic);

    const filePath = await this.pptService.createPPT(content);

    return filePath;
  }
}