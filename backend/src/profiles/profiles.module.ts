import { Module } from '@nestjs/common';
import { MongoloquentModule } from '@mongoloquent/nestjs';
import { AuthModule } from '../auth/auth.module';
import { UserProfile } from './entities/user-profile.model';
import { ProfilesController } from './profiles.controller';
import { ProfilesService } from './profiles.service';

@Module({
  imports: [MongoloquentModule.forFeature([UserProfile]), AuthModule],
  controllers: [ProfilesController],
  providers: [ProfilesService],
})
export class ProfilesModule {}
