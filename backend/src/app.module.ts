import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MongoloquentModule } from '@mongoloquent/nestjs';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PocModule } from './poc/poc.module';
import { AuthModule } from './auth/auth.module';
import { BloodsModule } from './bloods/bloods.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    MongoloquentModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        connection: configService.getOrThrow<string>(
          'MONGOLOQUENT_DATABASE_URI',
        ),
        database: configService.getOrThrow<string>(
          'MONGOLOQUENT_DATABASE_NAME',
        ),
        timezone: 'Asia/Jakarta',
      }),
      models: [],
      global: true,
    }),
    PocModule,
    AuthModule,
    BloodsModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
