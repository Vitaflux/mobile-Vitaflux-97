import { Module } from '@nestjs/common';
import { MongoloquentModule } from '@mongoloquent/nestjs';
import { AuthModule } from '../auth/auth.module';
import { Hospital } from '../hospitals/entities/hospital.model';
import { NotificationsModule } from '../notifications/notifications.module';
import { BloodsController } from './bloods.controller';
import { BloodsService } from './bloods.service';
import { Blood } from './entities/blood.model';
import { UserProfile } from '../profiles/entities/user-profile.model';

@Module({
  imports: [
    MongoloquentModule.forFeature([Blood, Hospital, UserProfile]),
    AuthModule,
    NotificationsModule,
  ],
  controllers: [BloodsController],
  providers: [BloodsService],
})
export class BloodsModule {}
