import { Type } from 'class-transformer';
import {
  IsDateString,
  IsIn,
  IsInt,
  Min,
  IsOptional,
  IsString,
} from 'class-validator';
import {
  BLOOD_COMPONENTS,
  BLOOD_STATUSES,
  BLOOD_TYPES,
  RHESUS_TYPES,
} from '../../common/constants';
import type {
  BloodComponent,
  BloodStatus,
  BloodType,
  RhesusType,
} from '../../common/constants';

const CREATEABLE_BLOOD_STATUSES = BLOOD_STATUSES.filter(
  (status) => status !== 'closed',
);

export class CreateBloodDto {
  @IsIn(BLOOD_TYPES)
  blood_type!: BloodType;

  @IsIn(RHESUS_TYPES)
  rhesus!: RhesusType;

  @Type(() => Number)
  @IsInt()
  @Min(1)
  quantity!: number;

  @IsDateString()
  schedule!: string;

  @IsIn(CREATEABLE_BLOOD_STATUSES)
  status_blood!: BloodStatus;

  @IsOptional()
  @IsString()
  title?: string | null;

  @IsOptional()
  @IsString()
  note?: string | null;

  @IsOptional()
  @IsIn(BLOOD_COMPONENTS)
  component?: BloodComponent | null;

  @IsOptional()
  @IsDateString()
  schedule_end?: string | null;
}
