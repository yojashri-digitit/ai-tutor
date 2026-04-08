import { Injectable } from '@nestjs/common';
import * as path from 'path';
import * as fs from 'fs';
import PptxGenJS from 'pptxgenjs';
import { exec } from 'child_process';

@Injectable()
export class PptService {

  // ================= CLEAN TEXT =================
  cleanText(text: string) {
    if (!text) return "";
    return text
      .replace(/[^\x00-\x7F]/g, '')
      .replace(/[_\-]{2,}/g, '')
      .replace(/[^\w\s.,():%]/g, '')
      .replace(/\s+/g, ' ')
      .trim();
  }

  // ================= GENERATE DIAGRAM =================
  async generateDiagram(code: string, fileName: string): Promise<string> {
    return new Promise((resolve, reject) => {
      const inputPath = path.join(__dirname, `../../${fileName}.mmd`);
      const outputPath = path.join(__dirname, `../../${fileName}.png`);

      fs.writeFileSync(inputPath, code);

      exec(`npx mmdc -i ${inputPath} -o ${outputPath}`, (err) => {
        if (err) {
          console.log("Diagram generation failed:", err.message);
          return reject(err);
        }
        resolve(outputPath);
      });
    });
  }

  // ================= DIAGRAM CHECK =================
  shouldShowDiagram(heading: string): boolean {
    const allowed = ["working", "algorithm", "example"];
    return allowed.some(key =>
      heading?.toLowerCase().includes(key)
    );
  }

  // ================= MAIN =================
  async createPPT(data: any, totalSlides: number): Promise<string> {
    const pptx = new PptxGenJS();
    pptx.layout = 'LAYOUT_16x9';

    // ================= SLIDE DISTRIBUTION =================
    // totalSlides includes title + conclusion
    const contentSlidesCount = totalSlides - 2;
    const contentSlides = (data.slides || []).slice(0, contentSlidesCount);

    // ================= TITLE SLIDE =================
    const titleSlide = pptx.addSlide();

    titleSlide.addText(this.cleanText(data.title || "Lecture"), {
      x: 1,
      y: 2,
      w: 8,
      fontSize: 36,
      bold: true,
      align: "center",
    });

    titleSlide.addText("AI Generated Presentation", {
      x: 1,
      y: 3,
      w: 8,
      fontSize: 18,
      align: "center",
      color: "666666",
    });

    // ================= CONTENT SLIDES =================
    for (const slideData of contentSlides) {
      if (!slideData?.heading) continue;

      const slide = pptx.addSlide();

      // 🔹 TITLE
      slide.addText(this.cleanText(slideData.heading), {
        x: 0.5,
        y: 1.8,
        w: 9,
        fontSize: 28,
        bold: true,
      });

      // 🔹 DIVIDER
      slide.addShape("rect", {
        x: 0.5,
        y: 1.4,
        w: 9,
        h: 0.015,
        fill: { color: "666666" },
      });

      const contentY = 2.2;

      // ================= DIAGRAM CHECK =================
      const hasDiagram =
        slideData.diagramCode &&
        this.shouldShowDiagram(slideData.heading);

      // ================= BULLET RULES =================
      let points = (slideData.points || [])
        .filter((p: string) => p && p.trim())
        .map((p: string) => this.cleanText(p));

      if (hasDiagram) {
        points = points.slice(0, 3); // STRICT 3 bullets
      } else {
        points = points.slice(0, 5); // 3–5 bullets
      }

      // 🔥 SINGLE LINE CONTROL (NO OVERFLOW)
      points = points.map((p: string) => p.slice(0, 80));

      // ================= LAYOUT =================
      const textWidth = hasDiagram ? 4.5 : 8.5;

      slide.addText(
        points.map((p: string) => ({
          text: p,
          options: { bullet: true }
        })),
        {
          x: 0.7,
          y: contentY,
          w: textWidth,
          fontSize: 20,
          lineSpacing: 30,
        }
      );

      // ================= DIAGRAM =================
      if (hasDiagram) {
        try {
          const diagramPath = await this.generateDiagram(
            slideData.diagramCode,
            `diagram-${Date.now()}`
          );

          slide.addImage({
            path: diagramPath,
            x: 5.5,
            y: contentY,
            w: 4,
            h: 3,
          });

        } catch (err) {
          console.log("Diagram failed");
        }
      }

      // ================= OPTIONAL CODE =================
      if (slideData.code) {
        slide.addText(this.cleanText(slideData.code), {
          x: 0.7,
          y: 5.2,
          w: 8.5,
          fontSize: 12,
          fontFace: "Courier New",
        });
      }
    }

    // ================= CONCLUSION SLIDE =================
    const conclusionSlide = pptx.addSlide();

    conclusionSlide.addText("Conclusion", {
      x: 0.5,
      y: 0.4,
      fontSize: 30,
      bold: true,
    });

    const conclusionPoints = [
      "Concept provides strong theoretical understanding",
      "Improves system performance and efficiency",
      "Widely used in real-world applications",
      "Helps in designing optimized solutions",
      "Foundation for advanced concepts"
    ];

    conclusionSlide.addText(
      conclusionPoints.map(p => ({
        text: this.cleanText(p),
        options: { bullet: true }
      })),
      {
        x: 0.7,
        y: 2.2,
        w: 8.5,
        fontSize: 22,
        lineSpacing: 32,
      }
    );

    // ================= SAVE FILE =================
    const fileName = `ppt-${Date.now()}.pptx`;
    const filePath = path.join(__dirname, '../../', fileName);

    await pptx.writeFile({ fileName: filePath });

    return filePath;
  }
}