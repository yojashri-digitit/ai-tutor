import {
  Body,
  Controller,
  Post,
  Res,
  BadRequestException,
} from '@nestjs/common';
import { TutorService } from './tutor.service';
import type { Response } from 'express';

@Controller('tutor')
export class TutorController {
  constructor(private tutorService: TutorService) {}

  // ================= ✅ GENERATE NOTES =================
  @Post('generate')
  async generateContent(@Body() body: any) {
    const { course, topic } = body;

    // 🔒 Validation
    if (!course || !topic) {
      throw new BadRequestException('course and topic are required');
    }

    // 🔥 Notes always generate with strong depth (min slides logic handled in service)
    return this.tutorService.generateContent(course, topic, 8);
  }

  // ================= ✅ GENERATE PPT =================
  @Post('generate-ppt')
  async generatePPT(@Body() body: any, @Res() res: Response) {
    const { course, topic, slides } = body;

    // 🔒 Validation
    if (!course || !topic) {
      throw new BadRequestException('course and topic are required');
    }

    // 🔥 STRICT SLIDE RULE (UPDATED)
    // Minimum = 8, Maximum = 20
    const slideCount =
      typeof slides === 'number' && slides >= 8 && slides <= 20
        ? slides
        : 8;

    const filePath = await this.tutorService.generatePPT(
      course,
      topic,
      slideCount
    );

    // 📥 CLEAN FILE NAME
    const safeCourse = course.replace(/\s+/g, '-');
    const safeTopic = topic.replace(/\s+/g, '-');

    // 📥 Proper headers
    res.set({
      'Content-Type':
        'application/vnd.openxmlformats-officedocument.presentationml.presentation',
      'Content-Disposition': `attachment; filename=${safeCourse}-${safeTopic}.pptx`,
    });

    return res.download(filePath);
  }
}