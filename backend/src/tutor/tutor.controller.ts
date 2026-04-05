import { Body, Controller, Post, Res } from '@nestjs/common';
import { TutorService } from './tutor.service';
import type { Response } from 'express';

@Controller('tutor')
export class TutorController {
  constructor(private tutorService: TutorService) {}

  // ✅ Generate Notes
  @Post('generate')
  async generateContent(@Body() body: any) {
    const { course, topic } = body;

    return this.tutorService.generateContent(course, topic);
  }

  // ✅ Generate PPT
  @Post('generate-ppt')
  async generatePPT(@Body() body: any, @Res() res: Response) {
    const { course, topic } = body;

    const filePath = await this.tutorService.generatePPT(course, topic);

    return res.download(filePath);
  }
}