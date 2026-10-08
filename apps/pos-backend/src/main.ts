import 'dotenv/config'; // ⭐ အပေါ်ဆုံးမှာ ရှိရမည် (အခြား import အားလုံးရဲ့ အပေါ်)

import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module.js';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.enableCors({
    //origin: '*',
    origin: process.env.FRONTEND_URL || 'http://localhost:5173',
    methods: 'GET,POST,PUT,PATCH,DELETE',
    credentials: true,
  });
  await app.listen(process.env.PORT ?? 3001);
}
await bootstrap();
