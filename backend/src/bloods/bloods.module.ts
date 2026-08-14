import { Module } from '@nestjs/common';
import { MongoloquentModule } from '@mongoloquent/nestjs';
import { AuthModule } from '../auth/auth.module';
import { Hospital } from '../hospitals/entities/hospital.model';
import { BloodsController } from './bloods.controller';
import { BloodsService } from './bloods.service';
import { Blood } from './entities/blood.model';

@Module({
  imports: [MongoloquentModule.forFeature([Blood, Hospital]), AuthModule],
  controllers: [BloodsController],
  providers: [BloodsService],
})
export class BloodsModule {}
