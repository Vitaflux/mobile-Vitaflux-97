import { Type } from 'class-transformer';
import {
  IsDefined,
  IsIn,
  IsNotEmpty,
  IsString,
  ValidateIf,
  ValidateNested,
} from 'class-validator';
import {
  BLOOD_TYPES,
  RHESUS_TYPES,
  USER_ROLES,
  type BloodType,
  type RhesusType,
  type UserRole,
} from '../../common/constants';
import { GeoPointDto } from '../../profiles/dto/geo-point.dto';

export class GoogleOnboardingDto {
  @IsString()
  @IsNotEmpty()
  onboarding_token!: string;

  @IsIn(USER_ROLES)
  role!: UserRole;

  @ValidateIf((value: GoogleOnboardingDto) => value.role === 'facility')
  @IsString()
  @IsNotEmpty()
  name?: string;

  @IsDefined()
  @ValidateNested()
  @Type(() => GeoPointDto)
  location!: GeoPointDto;

  @ValidateIf((value: GoogleOnboardingDto) => value.role === 'donor')
  @IsIn(BLOOD_TYPES)
  blood_type?: BloodType;

  @ValidateIf((value: GoogleOnboardingDto) => value.role === 'donor')
  @IsIn(RHESUS_TYPES)
  rhesus?: RhesusType;

  @ValidateIf((value: GoogleOnboardingDto) => value.role === 'facility')
  @IsString()
  @IsNotEmpty()
  address?: string;
}
