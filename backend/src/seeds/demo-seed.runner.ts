import { NestFactory } from '@nestjs/core';
import { AppModule } from '../app.module';
import { DemoSeedService } from './demo-seed.service';

async function bootstrap() {
  const app = await NestFactory.createApplicationContext(AppModule);

  try {
    const demoSeedService = app.get(DemoSeedService);
    const result = await demoSeedService.seed();

    console.log(JSON.stringify(result, null, 2));
  } finally {
    await app.close();
  }
}

void bootstrap();
