import {
  IsEmail,
  IsDefined,
  IsIn,
  IsNotEmpty,
  IsString,
  MinLength,
  ValidateIf,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { USER_ROLES } from '../../common/constants';
import type { UserRole } from '../../common/constants';
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

  @ValidateIf((dto: RegisterDto) => dto.role === 'facility')
  @IsDefined()
  @ValidateNested()
  @Type(() => GeoPointDto)
  location?: GeoPointDto;
}
