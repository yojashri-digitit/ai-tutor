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
    } catch {
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
          model: "openai/gpt-4o-mini",
          messages: [{ role: "user", content: prompt }],
          temperature: 0.7
        },
        {
          headers: {
            Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`
          }
        }
      );

      const parsed = this.safeJsonParse(
        res.data.choices[0].message.content
      );

      if (parsed && Array.isArray(parsed.points) && parsed.points.length >= 3) {
        return parsed.points.slice(0, 5);
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

  const response = await axios.post(
    "https://openrouter.ai/api/v1/chat/completions",
    {
      model: "openai/gpt-4o-mini",
      messages: [{
        role: "user",
        content: `Generate ${slides} PPT slides on ${topic} in JSON format.`
      }],
      temperature: 0.3
    },
    {
      headers: {
        Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`
      }
    }
  );

  const parsed = this.safeJsonParse(
    response.data.choices[0].message.content
  );

  let aiSlides = parsed?.slides || [];

  const finalSlides: {
    heading: string;
    points: string[];
    diagramCode: string;
  }[] = [];

  for (const heading of slidePlan) {

    const aiSlide = aiSlides.find(s =>
      s.heading?.toLowerCase().includes(heading.toLowerCase())
    );

    let points = aiSlide?.points || [];

    // remove duplicates
    points = [...new Set(points)];

    // detect weak slides
    const isWeak =
      points.length < 5 ||
      points.some(p => !p || p.length < 10);

    if (isWeak) {
      console.log("🔄 Fixing:", heading);
      points = await this.regenerateSlide(topic, heading);
    }

    if (!points || points.length === 0) {
      points = await this.regenerateSlide(topic, heading);
    }

    finalSlides.push({
      heading,
      points: points.slice(0, 5),
      diagramCode: aiSlide?.diagramCode || ""
    });
  }

  // 🔥🔥 FINAL FIX: FORCE LAST SLIDE = CONCLUSION (NO EXTRA SLIDE)
  // 🔥 ADD CONCLUSION AS LAST CONTENT SLIDE
finalSlides.push({
  heading: "Conclusion",
  points: [
    `${topic} provides structured understanding of system behavior`,
    `${topic} improves efficiency and scalability in real-world systems`,
    `${topic} helps design optimized and reliable architectures`,
    `${topic} is widely used across multiple domains`,
    `${topic} forms a foundation for advanced concepts`
  ],
  diagramCode: ""
});

  return {
    title: parsed?.title || topic,
    slides: finalSlides
  };
}

  // ================= PPT =================
  async generatePPT(course: string, topic: string, slides: number) {
    const content = await this.generateContent(course, topic, slides);
    return this.pptService.createPPT(content, slides);
  }
}