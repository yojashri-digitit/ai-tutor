import { Injectable } from '@nestjs/common';
import axios from 'axios';
import { PptService } from '../ppt/ppt.service';

@Injectable()
export class TutorService {
  constructor(private pptService: PptService) {}

  // ================= REMOVE DUPLICATES =================
  removeDuplicateSlides(data: any) {
    const seen = new Set();

    data.slides = data.slides.filter((slide: any) => {
      const key = slide.heading + (slide.points || []).join('');
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });

    return data;
  }

  // ================= CLEAN FORMULA (FIX MathJax) =================
  cleanFormula(formula: string) {
    if (!formula) return "";

    return formula
      .replace(/[^\x00-\x7F]/g, '') // remove unicode
      .replace(/\\/g, '\\\\'); // escape backslashes
  }

  // ================= ADVANCED EVALUATION =================
  evaluateSlides(data: any) {
    let score = 0;
    let duplicates = 0;

    const seen = new Set();

    data.slides.forEach((slide: any) => {

      if (slide.heading && slide.points?.length >= 3) score++;

      if (slide.points?.some((p: string) => p.length > 30)) score++;

      if (slide.formula || slide.code || slide.diagram) score++;

      if (slide.imageHint && slide.imageHint.split(' ').length <= 3) score++;

      const key = slide.heading + (slide.points || []).join('');
      if (seen.has(key)) duplicates++;
      seen.add(key);
    });

    console.log("📊 QUALITY SCORE:", score, "/", data.slides.length * 4);
    console.log("🚫 DUPLICATES:", duplicates);

    return { score, duplicates };
  }

  // ================= SAFE JSON PARSER =================
safeJsonParse(content: string) {
  try {
    const match = content.match(/\{[\s\S]*\}/);
    if (!match) throw new Error("No JSON found");

    let cleanJson = match[0];

    // Remove markdown
    cleanJson = cleanJson.replace(/```json/g, '').replace(/```/g, '');

    // Remove control characters
    cleanJson = cleanJson.replace(/[\u0000-\u001F]+/g, '');

    // Fix invalid escape sequences
    cleanJson = cleanJson.replace(/\\(?!["\\/bfnrtu])/g, '\\\\');

    // Fix missing commas
    cleanJson = cleanJson.replace(/"\s*"/g, '","');

    // Fix trailing commas
    cleanJson = cleanJson.replace(/,\s*}/g, '}').replace(/,\s*]/g, ']');

    // Fix r"latex"
    cleanJson = cleanJson.replace(/r"([^"]*)"/g, '"$1"');

    return JSON.parse(cleanJson);

  } catch (err) {
    console.log("⚠️ First parse failed → using fallback");

    try {
      // 🔥 REMOVE MOST ERROR-PRONE FIELDS
      let fallback = content
        .replace(/"code":\s*"[\s\S]*?"/g, '"code": ""')
        .replace(/"formula":\s*"[\s\S]*?"/g, '"formula": ""')
        .replace(/"diagram":\s*"[\s\S]*?"/g, '"diagram": ""');

      const match = fallback.match(/\{[\s\S]*\}/);
      if (!match) throw new Error("Fallback failed");

      let safeJson = match[0];

      // minimal cleaning
      safeJson = safeJson.replace(/[\u0000-\u001F]+/g, '');
      safeJson = safeJson.replace(/,\s*}/g, '}').replace(/,\s*]/g, ']');

      return JSON.parse(safeJson);

    } catch (err2) {
      console.log("❌ Fallback also failed → returning safe default");

      // 🔥 LAST RESORT (never crash API)
      return {
        title: "Generated Topic",
        slides: [
          {
            heading: "Overview",
            points: ["Content could not be generated properly"],
            formula: "",
            code: "",
            diagram: "",
            imageHint: "education concept"
          }
        ]
      };
    }
  }
}

  // ================= GENERATE CONTENT =================
  async generateContent(course: string, topic: string, slides: number) {
    try {

      if (slides < 8) slides = 8;

  
      const prompt = `
You are an IIT professor creating high-quality lecture slides.

Course: ${course}
Topic: ${topic}
Slides Required: ${slides}

STRICT RULES:
- Generate EXACTLY ${slides} slides
- Minimum slides = 8
- Each slide MUST be UNIQUE
- NO repetition

CONTENT RULES:
- Each slide = ONE concept
- Max 5 bullet points
- Each bullet ≤ 15 words
- Each bullet must explain WHY or HOW
- Avoid generic text

STRUCTURE FLOW:
1. Introduction
2. Definition
3. Theory
4. Mathematical Insight
5. Algorithm / Working
6. Example
7. Limitation
8. Application
9+ Advanced topics (if needed)

ADVANCED:
- Include formula (valid LaTeX string, NO r"")
- Include code (if applicable)
- Include diagram explanation

IMAGE RULE (STRICT):
- Each slide MUST include imageHint
- imageHint = 1–3 keywords ONLY
- Example: "svm boundary", "paging diagram"
CRITICAL JSON RULES:
- NEVER use double quotes inside text
- Use single quotes for code
- Avoid special characters like \ or "
- Keep code minimal and safe

OUTPUT:
Return STRICT JSON ONLY (no text outside JSON)
{
  "title": "",
  "slides": [
    {
      "heading": "",
      "points": [],
      "formula": "",
      "code": "",
      "diagram": "",
      "imageHint": ""
    }
  ]
}
`;


      const response = await axios.post(
        "https://openrouter.ai/api/v1/chat/completions",
        {
          model: "openai/gpt-4o-mini", // 🔥 MUCH MORE STABLE
          messages: [{ role: "user", content: prompt }],
          response_format: { type: "json_object" } // 🔥 CRITICAL FIX
        },
        {
          headers: {
            Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`,
            "HTTP-Referer": "http://localhost:3000",
            "X-Title": "AI Tutor",
          },
        }
      );

      const content = response.data.choices[0].message.content;

      // ✅ SAFE PARSE
      const parsed = this.safeJsonParse(content);

      // ✅ CLEAN FORMULAS
      parsed.slides = parsed.slides.map((slide: any) => ({
        ...slide,
        formula: this.cleanFormula(slide.formula)
      }));

      // ✅ REMOVE DUPLICATES
      const cleaned = this.removeDuplicateSlides(parsed);

      // ✅ EVALUATE
      this.evaluateSlides(cleaned);

      return cleaned;

    } catch (error: any) {
      console.error("❌ AI ERROR:", error.response?.data || error.message);
      throw new Error("AI content failed");
    }
  }

  // ================= GENERATE PPT =================
  async generatePPT(course: string, topic: string, slides: number) {
    const content = await this.generateContent(course, topic, slides);
    return this.pptService.createPPT(content);
  }
}