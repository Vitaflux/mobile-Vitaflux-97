import { Module } from '@nestjs/common';
import { MongoloquentModule } from '@mongoloquent/nestjs';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PocModule } from './poc/poc.module';

function getRequiredEnvironment(name: string): string {
  const value = process.env[name];

  if (!value) {
    throw new Error(
      `Environment variable ${name} belum diisi`,
    );
  }

  return value;
}

@Module({
  imports: [
    MongoloquentModule.forRoot({
      name: 'default',
      connection: getRequiredEnvironment(
        'MONGOLOQUENT_DATABASE_URI',
      ),
      database: getRequiredEnvironment(
        'MONGOLOQUENT_DATABASE_NAME',
      ),
      timezone: 'Asia/Jakarta',
      models: [],
      global: true,
    }),
    PocModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}