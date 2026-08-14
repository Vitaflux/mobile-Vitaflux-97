import { NestFactory } from '@nestjs/core';
import { AppModule } from '../app.module';
import { GeospatialPocService } from './geospatial-poc.service';

async function bootstrap() {
  const app = await NestFactory.createApplicationContext(AppModule);

  try {
    const service = app.get(GeospatialPocService);

    const result = await service.verify();

    console.log(result);
  } finally {
    await app.close();
  }
}

void bootstrap();
