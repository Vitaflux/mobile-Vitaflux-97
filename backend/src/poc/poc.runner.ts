import { NestFactory } from '@nestjs/core';
import { AppModule } from '../app.module';
import { PocService } from './poc.service';

async function bootstrap() {
  const app = await NestFactory.createApplicationContext(AppModule);

  try {
    const pocService = app.get(PocService);
    const result = await pocService.verifyIntegration();

    console.log(result);
  } finally {
    await app.close();
  }
}

void bootstrap();
