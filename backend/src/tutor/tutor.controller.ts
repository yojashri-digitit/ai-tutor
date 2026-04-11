import {
  Body,
  Controller,
  Post,
  Get,
  Query,
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

    if (!course || !topic) {
      throw new BadRequestException('course and topic are required');
    }

    return this.tutorService.generateContent(course, topic, 8);
  }

  // ================= ✅ GENERATE PPT (FIXED) =================
//   @Post('generate-ppt')
//   async generatePPT(@Body() body: any) {
//     const { course, topic, slides } = body;

//     if (!course || !topic) {
//       throw new BadRequestException('course and topic are required');
//     }

//     const slideCount =
//       typeof slides === 'number' && slides >= 1 && slides <= 20
//         ? slides
//         : 5;

//     // 🔥 Get BOTH slides + file
//   const content = await this.tutorService.generateContent(
//   course,
//   topic,
//   slideCount
// );

// const filePath = await this.tutorService.generatePPT(
//   content, // ✅ pass content
//   slideCount
// );

//     return {
//       slides: content.slides,
//       file: filePath,
//     };
//   }
@Post('generate-ppt')
async generatePPT(@Body() body: any) {
  const { course, topic, slides } = body;

  if (!course || !topic) {
    throw new BadRequestException('course and topic are required');
  }

  const result = await this.tutorService.generatePPT(course, topic, slides);

  console.log("Sending response:", result);

  return {
    slides: result.slides,
    file: result.file
  };
}
  // ================= ✅ DOWNLOAD =================
  @Get('download')
  downloadFile(@Query('file') file: string, @Res() res: Response) {
    return res.download(file);
  }

  // ================= OTHER APIs =================
  // @Post('generate-quiz')
  // async generateQuiz(@Body() body: any) {
  //   return this.tutorService.generateQuiz(body.topic, body.slides);
  // }

  // @Post('explain-slide')
  // async explainSlide(@Body() body: any) {
  //   return this.tutorService.explainSlide(
  //     body.topic,
  //     body.heading,
  //     body.points
  //   );
  // }

  // @Post('evaluate')
  // async evaluate(@Body() body: any) {
  //   return this.tutorService.evaluateSlides(body.slides);
  // }

  // @Post('chat')
  // async chat(@Body() body: { course: string; question: string }) {
  //   return this.tutorService.chat(body);
  // }

}