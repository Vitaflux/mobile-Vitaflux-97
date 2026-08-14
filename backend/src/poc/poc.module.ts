import { Module } from '@nestjs/common';
import { MongoloquentModule } from '@mongoloquent/nestjs';
import { Blood } from '../bloods/entities/blood.model';
import { Hospital } from '../hospitals/entities/hospital.model';
import { UserProfile } from '../profiles/entities/user-profile.model';
import { User } from '../users/entities/user.model';
import { PocService } from './poc.service';
import { Request } from '../requests/entities/request.model';

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
  providers: [PocService],
  exports: [PocService],
})
export class PocModule {}
