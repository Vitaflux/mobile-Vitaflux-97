import { Module } from '@nestjs/common';
import { MongoloquentModule } from '@mongoloquent/nestjs';
import { AuthModule } from '../auth/auth.module';
import { Blood } from '../bloods/entities/blood.model';
import { Request } from '../requests/entities/request.model';
import { Hospital } from './entities/hospital.model';
import { HospitalsController } from './hospitals.controller';
import { HospitalsService } from './hospitals.service';

@Module({
  imports: [
    MongoloquentModule.forFeature([Hospital, Blood, Request]),
    AuthModule,
  ],
  controllers: [HospitalsController],
  providers: [HospitalsService],
})
export class HospitalsModule {}
