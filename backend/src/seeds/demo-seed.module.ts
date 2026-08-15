import { MongoloquentModule } from '@mongoloquent/nestjs';
import { Module } from '@nestjs/common';
import { Blood } from '../bloods/entities/blood.model';
import { Hospital } from '../hospitals/entities/hospital.model';
import { UserProfile } from '../profiles/entities/user-profile.model';
import { Request } from '../requests/entities/request.model';
import { User } from '../users/entities/user.model';
import { DemoSeedService } from './demo-seed.service';

@Module({
  imports: [
    MongoloquentModule.forFeature([
      User,
      UserProfile,
      Hospital,
      Blood,
      Request,
    ]),
  ],
  providers: [DemoSeedService],
  exports: [DemoSeedService],
})
export class DemoSeedModule {}
