import { Injectable } from '@nestjs/common';
import axios from 'axios';
import { PptService } from '../ppt/ppt.service';

@Injectable()
export class TutorService {
  constructor(private pptService: PptService) {}

  // ================= SLIDE PLAN =================
  getSlidePlan(slides: number): string[] {
    const base = [
      "Introduction",
      "Definition",
      "Core Concept",
      "Working Principle",
      "Mathematical Insight",
      "Algorithm",
      "Example",
      "Advantages",
      "Limitations",
      "Applications",
      "Conclusion"
    ];

    if (slides <= base.length) return base.slice(0, slides);

    const extended = [...base];
    for (let i = base.length; i < slides; i++) {
      extended.push(`Advanced Topic ${i - base.length + 1}`);
    }

    return extended;
  }

  // ================= DIAGRAM LOGIC =================
  fixDiagramCode(heading: string) {
    const h = (heading || "").toLowerCase();

    if (h.includes("algorithm")) {
      return `graph TD; Start --> Step1 --> Step2 --> End;`;
    }

    if (h.includes("work")) {
      return `graph LR; Sender --> Channel --> Receiver;`;
    }

    if (h.includes("example")) {
      return `graph TD; Input --> Process --> Output;`;
    }

    return "";
  }

  // ================= SAFE JSON =================
  safeJsonParse(content: string) {
    try {
      const match = content.match(/\{[\s\S]*\}/);
      if (!match) throw new Error("No JSON");

      let clean = match[0];

      clean = clean.replace(/```json/g, '').replace(/```/g, '');
      clean = clean.replace(/[\u0000-\u001F]+/g, '');
      clean = clean.replace(/\\(?!["\\/bfnrtu])/g, '\\\\');
      clean = clean.replace(/,\s*}/g, '}').replace(/,\s*]/g, ']');

      return JSON.parse(clean);

    } catch {
      return {
        title: "Generated Topic",
        slides: []
      };
    }
  }

  // ================= TEXT OVERFLOW CONTROL =================
  trimPoints(points: string[]) {
    return points.map(p => {
      if (p.length > 120) {
        return p.slice(0, 110) + "...";
      }
      return p;
    }).slice(0, 5); // max 5 bullets
  }

  // ================= MAIN =================
  async generateContent(course: string, topic: string, slides: number) {
    try {
      if (slides < 5) slides = 5;

      const slidePlan = this.getSlidePlan(slides).join(", ");

      const prompt = `
You are an expert IIT professor creating high-quality, professional PPT slides.

Course: ${course}
Topic: ${topic}
Slides Required: ${slides}

STRICT RULES:
- Generate EXACTLY ${slides} slides (including title & conclusion if present in plan)
- Do NOT exceed or reduce slide count
- Follow this exact order strictly:
${slidePlan}
- Each slide must cover a UNIQUE concept
- No repetition across slides

-------------------------------------

CONTENT RULES (IIT LEVEL - STRICT):

- Each slide must contain 3 to 5 bullet points ONLY
- Each bullet must be clear, precise, and technically meaningful
- Each bullet should be 10-18 words (single-line, no overflow)
- Avoid long paragraphs

- Each bullet must explain:
  ✔ WHY the concept exists OR
  ✔ HOW it works internally OR
  ✔ WHAT impact it creates

- Avoid generic statements like:
  ❌ "improves performance"
  ❌ "used in many applications"
  ❌ "important concept"

- Use technical vocabulary wherever applicable:
  (e.g., window size, ACK, throughput, buffer, congestion control)

-------------------------------------

SLIDE-SPECIFIC RULES (VERY IMPORTANT):

1. Introduction Slide:
- Focus on problem motivation
- Explain limitations of naive approaches (e.g., stop-and-wait)
- Do NOT give definition directly

2. Definition Slide:
- FIRST bullet MUST start in formal definition style:
  👉 "${topic} is a method..." OR "${topic} is a technique..."
- Keep it crisp and academic
- Remaining bullets explain working intuition or purpose

Example:
✔ "Sliding Window Protocol is a flow control technique used in computer networks"
✔ NOT vague or casual wording

3. Concept / Theory Slides:
- Explain core idea + mechanism
- Include cause-effect relationships

4. Working / Algorithm Slides:
- Step-by-step explanation of process
- Use logical flow (sender → receiver → ACK → adjustment)

5. Example Slide:
- Show practical scenario or data flow
- Explain how concept behaves in real system

6. Advantages / Limitations:
- Must be analytical (not generic)
- Include reasoning (WHY advantage exists)

7. Conclusion Slide:
- Summarize insights (not repeat definition)
- Highlight overall impact and learning

-------------------------------------

LAYOUT RULE:

- If diagram is present → use 2-column layout (text + image)
- If NO diagram → use full-width text
- Do NOT leave empty space

-------------------------------------

DIAGRAM RULE:

- Include diagramCode ONLY for:
  ✔ Working Principle
  ✔ Algorithm
  ✔ Example

- Do NOT include diagrams for:
  Introduction, Definition, Advantages, Conclusion

- Each diagram must be UNIQUE and relevant
- Do NOT repeat diagrams across slides

-------------------------------------

QUALITY CONTROL:

- No repeated points
- No vague wording
- No filler text
- Maintain academic tone throughout

-------------------------------------

OUTPUT FORMAT (STRICT JSON):

{
  "title": "",
  "slides": [
    {
      "heading": "",
      "points": [],
      "diagramCode": ""
    }
  ]
}
`;

      const response = await axios.post(
        "https://openrouter.ai/api/v1/chat/completions",
        {
          model: "openai/gpt-4o-mini",
          messages: [{ role: "user", content: prompt }]
        },
        {
          headers: {
            Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`,
          },
        }
      );

      const parsed = this.safeJsonParse(
        response.data.choices[0].message.content
      );

      let slidesData = Array.isArray(parsed.slides) ? parsed.slides : [];

      // ================= STRICT SLIDE FIX =================
      slidesData = slidesData.slice(0, slides);

      while (slidesData.length < slides) {
        slidesData.push({
          heading: `Concept ${slidesData.length + 1}`,
          points: ["Explains concept", "Shows working", "Gives application"],
          diagramCode: ""
        });
      }

      // ================= PROCESSING =================
      let diagramCount = 0;

      const finalSlides = slidesData.map((slide: any) => {
        let diagram = "";

        if (
          (slide.heading.toLowerCase().includes("work") ||
            slide.heading.toLowerCase().includes("algorithm") ||
            slide.heading.toLowerCase().includes("example")) &&
          diagramCount < 3
        ) {
          diagram = this.fixDiagramCode(slide.heading);
          diagramCount++;
        }

        return {
          heading: slide.heading,
          points: this.trimPoints(slide.points || []),
          diagramCode: diagram
        };
      });

      const finalData = {
        title: parsed.title || topic,
        slides: finalSlides
      };

      // 🔥 IMPROVED EVALUATION
      this.evaluateSlides(finalData);

      return finalData;

    } catch (error: any) {
      console.error("❌ AI ERROR:", error.message);
      throw new Error("AI failed");
    }
  }

  // ================= ADVANCED EVALUATION =================
  evaluateSlides(data: any) {
    let total = 0;
    let max = data.slides.length * 10;

    data.slides.forEach((slide: any) => {
      let score = 0;

      // 1. Heading quality
      if (slide.heading && slide.heading.length > 3) score += 1;

      // 2. Bullet count
      if (slide.points.length >= 3 && slide.points.length <= 5) score += 1;

      // 3. Text length control
      if (slide.points.every((p: string) => p.length < 120)) score += 1;

      // 4. No overflow risk
      if (slide.points.join(" ").length < 400) score += 1;

      // 5. No repetition
      const unique = new Set(slide.points);
      if (unique.size === slide.points.length) score += 1;

      // 6. Diagram relevance
      if (
        slide.diagramCode &&
        (slide.heading.toLowerCase().includes("work") ||
          slide.heading.toLowerCase().includes("algorithm") ||
          slide.heading.toLowerCase().includes("example"))
      ) score += 2;

      // 7. Clean formatting
      if (!slide.points.some((p: string) => p.includes("lorem"))) score += 1;

      // 8. Readability
      if (slide.points.every((p: string) => p.split(" ").length <= 15)) score += 1;

      total += score;
    });

    console.log(`📊 QUALITY SCORE: ${total}/${max}`);
  }

  // ================= PPT =================
  async generatePPT(course: string, topic: string, slides: number) {
    const content = await this.generateContent(course, topic, slides);
    return this.pptService.createPPT(content, slides);
  }
}