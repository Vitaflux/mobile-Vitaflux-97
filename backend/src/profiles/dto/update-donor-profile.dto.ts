import { Type } from 'class-transformer';
import {
  IsDateString,
  IsIn,
  IsNumber,
  IsOptional,
  IsString,
  Max,
  Min,
  ValidateNested,
} from 'class-validator';
import { BLOOD_TYPES, RHESUS_TYPES } from '../../common/constants';
import type { BloodType, RhesusType } from '../../common/constants';
import { GeoPointDto } from './geo-point.dto';

export class UpdateDonorProfileDto {
  @IsIn(BLOOD_TYPES)
  blood_type!: BloodType;

  @IsIn(RHESUS_TYPES)
  rhesus!: RhesusType;

  @ValidateNested()
  @Type(() => GeoPointDto)
  location!: GeoPointDto;

  @IsOptional()
  @IsDateString()
  last_donor?: string | null;

  @IsOptional()
  @IsDateString()
  birth_date?: string | null;

  @IsOptional()
  @IsNumber()
  @Min(1)
  weight_kg?: number | null;

  @IsOptional()
  @IsString()
  city?: string | null;

  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(20)
  notify_radius_km?: number | null;
}
