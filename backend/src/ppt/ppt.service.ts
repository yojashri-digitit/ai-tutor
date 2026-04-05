import { Injectable } from '@nestjs/common';
import * as fs from 'fs';
import * as path from 'path';
import PptxGenJS from 'pptxgenjs';

@Injectable()
export class PptService {

  async createPPT(data: any): Promise<string> {
    const pptx = new PptxGenJS();

    // 🎯 Title Slide
    const titleSlide = pptx.addSlide();
    titleSlide.addText(data.title || "Lecture", {
      x: 1,
      y: 2,
      fontSize: 28,
      bold: true,
    });

    // 🎯 Content Slides
    data.slides.forEach((slideData: any) => {
      const slide = pptx.addSlide();

      slide.addText(slideData.heading, {
        x: 0.5,
        y: 0.5,
        fontSize: 20,
        bold: true,
      });

      slide.addText(
        slideData.points.map((p: string) => `• ${p}`).join('\n'),
        {
          x: 0.5,
          y: 1.5,
          fontSize: 16,
        }
      );
    });

    // 📁 Save file
    const fileName = `ppt-${Date.now()}.pptx`;
    const filePath = path.join(__dirname, '../../', fileName);

    await pptx.writeFile({ fileName: filePath });

    return filePath;
  }
}