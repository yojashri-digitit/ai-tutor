import { Injectable } from '@nestjs/common';
import axios from 'axios';
import { PptService } from '../ppt/ppt.service';

@Injectable()
export class TutorService {
  constructor(private pptService: PptService) {}

  // ================= SLIDE PLAN =================
 getSlidePlan(slides: number): string[] {

  // ❗ reserve last slide for Conclusion
  const contentSlides = slides - 1;

  const base = [
    "Introduction",
    "Definition",
    "Core Concept",
    "Working Principle",
    "Algorithm",
    "Example",
    "Advantages",
    "Limitations",
    "Applications"
  ];

  const extraTopics = [
    "Performance Analysis",
    "Optimization Techniques",
    "Real-World Use Case",
    "System Design Insight",
    "Comparative Analysis"
  ];

  let plan = [...base];
  let i = 0;

  while (plan.length < contentSlides) {
    plan.push(extraTopics[i % extraTopics.length]);
    i++;
  }

  plan = plan.slice(0, contentSlides);

  return plan;
}
  // ================= SAFE JSON =================
 safeJsonParse(content: string) {
  try {
    if (!content) return null;

    let clean = content
      .replace(/```json/g, '')
      .replace(/```/g, '')
      .trim();

    const start = clean.indexOf('{');
    const end = clean.lastIndexOf('}');

    if (start === -1 || end === -1) return null;

    clean = clean.substring(start, end + 1);

    return JSON.parse(clean);

  } catch (err) {
    console.log("❌ JSON parse failed");
    return null;
  }
}

  // ================= REGENERATE SINGLE SLIDE =================
  async regenerateSlide(topic: string, heading: string) {

    const prompt = `
Generate content for ONE PPT slide.

Topic: ${topic}
Slide Title: ${heading}


=====================================

STRUCTURE (MANDATORY):

- First slide: Title
- Last slide: Conclusion (MANDATORY)

Core slides must include:

1. Introduction
2. Definition
3. Core Concept (ONLY ONE SLIDE)
4. Working Principle (WITH DIAGRAM)
5. Algorithm OR Example
6. Applications (ONLY ONE SLIDE)
7. Conclusion

-------------------------------------

ADAPTIVE RULE:

- If slides are less:
  → Merge sections (Algorithm + Example)
  → Remove Mathematical Insight if not relevant

- DO NOT include Mathematical Insight unless topic contains formulas
- DO NOT split Core Concept into multiple slides
- ONLY split if topic explicitly contains multiple subtopics

=====================================

BULLET RULE:

- No visual → EXACTLY 5 bullets
- With visual → EXACTLY 3 bullets
- Algorithm → full steps allowed

-------------------------------------

CONTENT RULES (VERY STRICT):

FOR ALL SLIDES (EXCEPT APPLICATIONS):

- Each bullet MUST be a COMPLETE SENTENCE
- Each bullet MUST contain 12–20 words
- Each bullet MUST explain WHY or HOW
- Each bullet MUST include technical reasoning or system behavior

✔ GOOD:
"Entity Relationship Model organizes data into entities and relationships to reduce redundancy in database design"

❌ BAD:
"Foundation of DBMS"
"Visual representation"
"Important concept"

-------------------------------------

APPLICATION RULE (SPECIAL CASE):

- ONLY for Applications slide:
  → Use SHORT KEYWORDS (1–4 words)
  → NO sentences

✔ Example:
- Database Design
- Schema Modeling
- Data Warehousing
- Query Optimization
- Knowledge Systems

-------------------------------------

VISUAL RULE:

- Core Concept → IMAGE
- Working Principle → DIAGRAM (Mermaid ONLY)
- Applications → IMAGE
- Algorithm → NO diagram

-------------------------------------

DIAGRAM RULE (STRICT):

- MUST return valid Mermaid code
- MUST start with "graph TD"
- MUST represent the actual system flow (NOT generic flowchart)

-------------------------------------

QUALITY CONTROL:

- No repetition
- No vague wording
- No filler text
- Maintain academic tone

=====================================

OUTPUT STRICT JSON:

{
  "title": "",
  "slides": [
    {
      "heading": "",
      "points": [],
      "diagramCode": "",
      "formula": ""
    }
  ]
}
`;

    try {
      const res = await axios.post(
        "https://openrouter.ai/api/v1/chat/completions",
        {
           model: "meta-llama/llama-3-8b-instruct",
          messages: [{ role: "user", content: prompt }],
          temperature: 0.7
        },
        {
          headers: {
            Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`
          },
          timeout: 60000 // 🔥 IMPORTANT

        }
      );

      const parsed = this.safeJsonParse(
        res.data.choices[0].message.content
      );
if (parsed && Array.isArray(parsed.slides)) {
  const slide = parsed.slides[0];

  if (slide?.points?.length >= 3) {
    return slide.points.slice(0, 5);
  }
}

    } catch (err) {
      console.log("⚠️ Regeneration failed:", heading);
    }

    // 🔥 fallback (never empty)
    return [
      `${topic} ${heading} affects system performance in real-world scenarios`,
      `${topic} ${heading} involves multiple components interacting within the system`,
      `${topic} ${heading} improves efficiency and scalability across environments`,
      `${topic} ${heading} contributes to optimized resource utilization`,
      `${topic} ${heading} plays a key role in system design and implementation`
    ];
  }

  // ================= MAIN =================
async generateContent(course: string, topic: string, slides: number) {

  const slidePlan = this.getSlidePlan(slides);

  const prompt = `
Generate EXACTLY ${slides} PPT slides on "${topic}"

Rules:
- Each slide must have heading + EXACTLY 5 bullet points
- Working Principle MUST include Mermaid diagram (graph TD)
- Last slide MUST be Conclusion
- DO NOT return fewer slides
- DO NOT return extra slides
- Return ONLY valid JSON (no text, no explanation)

Format:
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

  let parsed;

  try {
    const response = await axios.post(
      "https://openrouter.ai/api/v1/chat/completions",
      {
        model: "meta-llama/llama-3-8b-instruct",
        messages: [{ role: "user", content: prompt }],
        temperature: 0.2
      },
      {
        headers: {
          Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`,
        },
        timeout: 120000
      }
    );

    console.log("🧠 RAW AI OUTPUT:", response.data.choices[0].message.content);

    parsed = this.safeJsonParse(
      response.data.choices[0].message.content
    );

  } catch (err) {
    console.log("❌ AI FAILED → using full fallback");
    parsed = null;
  }

  let aiSlides = parsed?.slides || [];

  // ✅ FORCE LENGTH (VERY IMPORTANT)
  while (aiSlides.length < slides) {
    aiSlides.push(null);
  }

 const finalSlides: {
  heading: string;
  points: string[];
  diagramCode: string;
}[] = [];

for (let i = 0; i < slidePlan.length; i++) {
  const heading = slidePlan[i];
  const aiSlide = aiSlides[i];

  let points = aiSlide?.points || [];

  points = [...new Set(points)];

  if (!aiSlide || !points || points.length < 3) {
    console.log("⚠️ Using fallback:", heading);

    points = [
      `${heading} explains the concept of ${topic}`,
      `${heading} improves system efficiency and performance`,
      `${heading} is widely used in real-world applications`,
      `${heading} helps in designing optimized systems`,
      `${heading} plays an important role in ${topic}`
    ];
  }

  finalSlides.push({
    heading,
    points: points.slice(0, 5),
    diagramCode: aiSlide?.diagramCode || ""
  });
}

  console.log("FINAL SLIDES:", finalSlides.length);

  return {
    title: parsed?.title || topic,
    slides: finalSlides.slice(0, slides),
  };
}
async generateQuiz(topic: string, slides: any[]) {

  const prompt = `
Generate 5 multiple choice questions from the topic and slides.

Topic: ${topic}

Rules:
- 5 questions
- Each has 4 options
- Only 1 correct answer
- Questions must be concept-based
Return ONLY JSON.
Do NOT include any text before or after JSON.
Return JSON:
{
  "questions": [
    {
      "question": "",
      "options": ["", "", "", ""],
      "answer": ""
    }
  ]
}
`;

  try {
    const res = await axios.post(
      "https://openrouter.ai/api/v1/chat/completions",
      {
          model: "meta-llama/llama-3-8b-instruct",
        messages: [{ role: "user", content: prompt }],
        temperature: 0.5
      },
      {
        headers: {
          Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`
        },
        timeout: 60000 // 🔥 IMPORTANT
      }
    );

    const parsed = this.safeJsonParse(
      res.data.choices[0].message.content
    );

    return parsed || { questions: [] };

  } catch (err) {
    return { questions: [] };
  }
}
async explainSlide(topic: string, heading: string, points: string[]) {

  const prompt = `
Explain this slide in simple terms.

Topic: ${topic}
Slide: ${heading}

Content:
${points.join("\n")}

Rules:
- Simple explanation
- Real-world analogy if possible
- 5-6 lines

Return JSON:
{
  "explanation": ""
}
`;

  try {
    const res = await axios.post(
      "https://openrouter.ai/api/v1/chat/completions",
      {
          model: "meta-llama/llama-3-8b-instruct",
        messages: [{ role: "user", content: prompt }],
        temperature: 0.6
      },
      {
        headers: {
          Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`
        },
        timeout: 60000 // 🔥 IMPORTANT
      }
    );

    const parsed = this.safeJsonParse(
      res.data.choices[0].message.content
    );

    return parsed || { explanation: "" };

  } catch {
    return { explanation: "" };
  }
}
evaluateSlides(slides: any[]) {

  let score = 0;

  let clarity = 0;
  let depth = 0;
  let structure = 0;
  let visuals = 0;

  slides.forEach(slide => {

    const points = slide.points || [];

    // Structure
    if (points.length === 5) structure += 1;

    // Clarity
    if (points.every(p => p.length > 20)) clarity += 1;

    // Depth
    if (points.some(p => p.includes("because") || p.includes("improves"))) {
      depth += 1;
    }

    // Visuals
    if (slide.diagramCode) visuals += 1;

  });

  score = clarity + depth + structure + visuals;

  return {
    score: Math.min(score * 2, 40),
    breakdown: {
      clarity,
      depth,
      structure,
      visuals
    },
    improvements: [
      "Add more real-world examples",
      "Increase explanation depth",
      "Use diagrams where possible"
    ]
  };
}
async chat({ course, question }: any) {
  const prompt = `
You are an AI Tutor for ${course}.

Answer the question clearly and concisely:
${question}
`;

  try {
    const res = await axios.post(
      "https://openrouter.ai/api/v1/chat/completions",
      {
      model: "meta-llama/llama-3-8b-instruct",
        messages: [{ role: "user", content: prompt }],
        temperature: 0.7
      },
      {
        headers: {
          Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`
        },
        timeout: 60000 // 🔥 IMPORTANT
      }
    );

    const response = res.data.choices[0].message.content;

    return {
      content: response,
    };
  } catch (err) {
    return {
      content: "I could not generate a response. Please try again.",
    };
  }
}
  // ================= PPT =================
  async generatePPT(course: string, topic: string, slides: number) {
    const content = await this.generateContent(course, topic, slides);
    const filePath = await this.pptService.createPPT(content, slides);

return {
  slides: content.slides,
  file: filePath,
};
  }
}