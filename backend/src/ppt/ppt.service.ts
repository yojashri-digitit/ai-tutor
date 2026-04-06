import { Injectable } from '@nestjs/common';
import * as path from 'path';
import * as fs from 'fs';
import PptxGenJS from 'pptxgenjs';
import axios from 'axios';

const mjAPI = require("mathjax-node");

mjAPI.config({
  MathJax: { SVG: { font: "TeX" } }
});
mjAPI.start();

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

  // ================= FORMULA =================
  async renderFormula(latex: string, fileName: string): Promise<string> {
    return new Promise((resolve, reject) => {
      mjAPI.typeset(
        { math: latex, format: "TeX", svg: true },
        (data: any) => {
          if (!data.svg) return reject("Formula failed");
          const filePath = path.join(__dirname, '../../', fileName);
          fs.writeFileSync(filePath, data.svg);
          resolve(filePath);
        }
      );
    });
  }

  // ================= SAFE IMAGE FETCH =================
async fetchImage(query: string): Promise<string | null> {
  try {
    const safeQuery = `${query} diagram`;

    const url = `https://loremflickr.com/800/400/${encodeURIComponent(safeQuery)}`;
    const filePath = path.join(__dirname, `../../img-${Date.now()}.jpg`);

    const response = await axios({
      url,
      method: 'GET',
      responseType: 'stream',
      timeout: 2000, // 🔥 VERY IMPORTANT (reduce wait)
    });

    const writer = fs.createWriteStream(filePath);
    response.data.pipe(writer);

    return new Promise((resolve, reject) => {
      writer.on('finish', () => resolve(filePath));
      writer.on('error', reject);
    });

  } catch {
    return null; // 🔥 instant skip
  }
}

  // ================= MAIN =================
  async createPPT(data: any): Promise<string> {
    const pptx = new PptxGenJS();
    pptx.layout = 'LAYOUT_16x9';

    // 🎯 TITLE SLIDE
    const titleSlide = pptx.addSlide();

    titleSlide.addText(this.cleanText(data.title || "Lecture"), {
      x: 1,
      y: 2,
      w: 8,
      fontSize: 36,
      bold: true,
      align: "center",
    });

    titleSlide.addText("AI Generated Lecture", {
      x: 1,
      y: 3,
      w: 8,
      fontSize: 18,
      align: "center",
      color: "666666",
    });

    // 🔥 LIMIT IMAGE USAGE
   let imageCount = 0;
const MAX_IMAGES = 3; // 🔥 reduce from 5 → 3

    // 🎯 CONTENT SLIDES
    for (const slideData of data.slides) {
      if (!slideData?.heading) continue;

      const slide = pptx.addSlide();

      // 🔹 TITLE
      slide.addText(this.cleanText(slideData.heading), {
        x: 0.5,
        y: 0.5,
        w: 9,
        fontSize: 28,
        bold: true,
      });

      // 🔹 DIVIDER
      slide.addShape("rect", {
        x: 0.5,
        y: 1.0,
        w: 9,
        h: 0.015,
        fill: { color: "666666" },
      });

      const contentY = 3.3;

      // 🔹 BULLETS
      const points = (slideData.points || [])
        .filter((p: string) => p && p.trim())
        .slice(0, 5)
        .map((p: string) => this.cleanText(p));

      slide.addText(
        points.map((p: string) => ({
          text: p,
          options: { bullet: true }
        })),
        {
          x: 0.7,
          y: contentY,
          w: 4.5,
          fontSize: 20,
          lineSpacing: 30,
        }
      );

      // 🔹 IMAGE (LIMITED + SAFE)
let imageAdded = false;

if (slideData.imageHint && imageCount < MAX_IMAGES) {
  const imgPath = await this.fetchImage(slideData.imageHint);

  if (imgPath) {
    slide.addImage({
      path: imgPath,
      x: 5.5,
      y: contentY,
      w: 4,
      h: 3,
    });

    imageCount++;
  }
}
// 🔥 CLEAN FALLBACK (no ugly text)
if (!imageAdded) {
  slide.addShape("rect", {
    x: 5.5,
    y: 2.2,
    w: 4,
    h: 3,
    fill: { color: "F5F5F5" },
  });

  slide.addText("No Image", {
    x: 6.5,
    y: 3.2,
    fontSize: 14,
    color: "888888",
  });
}

      // 🔹 FORMULA
      // if (slideData.formula && slideData.formula.length < 50) {
      //   try {
      //     const formulaPath = await this.renderFormula(
      //       slideData.formula,
      //       `formula-${Date.now()}.svg`
      //     );

      //     slide.addImage({
      //       path: formulaPath,
      //       x: 0.7,
      //       y: 4.5,
      //       w: 4.5,
      //       h: 0.6,
      //     });
      //   } catch {}
      // }

      // 🔹 CODE
      if (slideData.code) {
        slide.addText(this.cleanText(slideData.code), {
          x: 0.7,
          y: 5.5,
          w: 8.5,
          fontSize: 12,
          fontFace: "Courier New",
        });
      }
    }

    // 🎯 CONCLUSION SLIDE
    const conclusionSlide = pptx.addSlide();

    conclusionSlide.addText("Conclusion", {
      x: 0.5,
      y: 0.4,
      fontSize: 30,
      bold: true,
    });

    const conclusionPoints = [
      "Concept establishes strong theoretical foundation for advanced systems.",
      "Mathematical modeling ensures precision and analytical understanding.",
      "Algorithmic implementation improves efficiency and scalability.",
      "Practical applications demonstrate real-world system relevance.",
      "Understanding limitations enables better system design decisions."
    ];

    conclusionSlide.addText(
      conclusionPoints.map(p => ({
        text: this.cleanText(p),
        options: { bullet: true }
      })),
      {
        x: 0.7,
        y: 3.3,
        w: 8,
        fontSize: 22,
        lineSpacing: 32,
      }
    );

    // 🎯 SAVE FILE
    const fileName = `ppt-${Date.now()}.pptx`;
    const filePath = path.join(__dirname, '../../', fileName);

    await pptx.writeFile({ fileName: filePath });

    return filePath;
  }
}