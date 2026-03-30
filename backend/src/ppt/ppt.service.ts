// src/ppt/ppt.service.ts

import { Injectable } from '@nestjs/common';
import PptxGenJS from 'pptxgenjs';

@Injectable()
export class PptService {
  async generatePPT(topic: string, points: string[]) {
    const ppt = new PptxGenJS();

    points.forEach(point => {
      const slide = ppt.addSlide();
      slide.addText(point, {
        x: 1,
        y: 1,
        fontSize: 18
      });
    });

    await ppt.writeFile({ fileName: `${topic}.pptx` });

    return { message: 'PPT generated' };
  }
}