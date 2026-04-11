import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import * as dotenv from 'dotenv'; 
import cookieParser from 'cookie-parser';
async function bootstrap() {
  dotenv.config();
  
  const app = await NestFactory.create(AppModule);
  app.use(cookieParser());
  app.enableCors({
  origin: "http://localhost:3000", // frontend URL
  credentials: true, // 🔥 REQUIRED for cookies
});
  await app.listen(process.env.PORT ?? 5000);
}
bootstrap();
