import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MongoloquentModule } from '@mongoloquent/nestjs';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PocModule } from './poc/poc.module';
import { AuthModule } from './auth/auth.module';
import { BloodsModule } from './bloods/bloods.module';
import { ProfilesModule } from './profiles/profiles.module';
import { RequestsModule } from './requests/requests.module';
import { NotificationsModule } from './notifications/notifications.module';
import { DemoSeedModule } from './seeds/demo-seed.module';
import { HospitalsModule } from './hospitals/hospitals.module';

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
    ProfilesModule,
    RequestsModule,
    NotificationsModule,
    DemoSeedModule,
    HospitalsModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
