import { Type } from 'class-transformer';
import { IsDateString, IsIn, IsInt, Min } from 'class-validator';
import {
  BLOOD_STATUSES,
  BLOOD_TYPES,
  RHESUS_TYPES,
} from '../../common/constants';
import type {
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
}
