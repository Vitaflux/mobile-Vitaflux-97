import {
  IsDefined,
  IsEmail,
  IsIn,
  IsNotEmpty,
  IsString,
  MinLength,
  ValidateIf,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { BLOOD_TYPES, RHESUS_TYPES, USER_ROLES } from '../../common/constants';
import type { BloodType, RhesusType, UserRole } from '../../common/constants';
import { GeoPointDto } from '../../profiles/dto/geo-point.dto';

export class RegisterDto {
  @IsString()
  @IsNotEmpty()
  name!: string;

  @IsEmail()
  email!: string;

  @IsString()
  @MinLength(6)
  password!: string;

  @IsIn(USER_ROLES)
  role!: UserRole;

  @IsDefined()
  @ValidateNested()
  @Type(() => GeoPointDto)
  location!: GeoPointDto;

  @ValidateIf((value: RegisterDto) => value.role === 'donor')
  @IsIn(BLOOD_TYPES)
  blood_type?: BloodType;

  @ValidateIf((value: RegisterDto) => value.role === 'donor')
  @IsIn(RHESUS_TYPES)
  rhesus?: RhesusType;

  @ValidateIf((value: RegisterDto) => value.role === 'facility')
  @IsString()
  @IsNotEmpty()
  address?: string;

  @ValidateIf((value: RegisterDto) => value.role === 'facility')
  @IsString()
  @IsNotEmpty()
  unit_donor?: string;

  @ValidateIf((value: RegisterDto) => value.role === 'facility')
  @IsString()
  @IsNotEmpty()
  pic_name?: string;

  @ValidateIf((value: RegisterDto) => value.role === 'facility')
  @IsString()
  @IsNotEmpty()
  contact?: string;

  @ValidateIf((value: RegisterDto) => value.role === 'facility')
  @IsString()
  @IsNotEmpty()
  hospital_type?: string;
}
