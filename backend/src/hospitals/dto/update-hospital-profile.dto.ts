import { IsOptional, IsString, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { GeoPointDto } from '../../profiles/dto/geo-point.dto';

export class UpdateHospitalProfileDto {
  @IsString()
  hospital_name!: string;

  @IsString()
  address!: string;

  @ValidateNested()
  @Type(() => GeoPointDto)
  location!: GeoPointDto;

  @IsOptional()
  @IsString()
  unit_donor?: string | null;

  @IsOptional()
  @IsString()
  pic_name?: string | null;

  @IsOptional()
  @IsString()
  contact?: string | null;

  @IsOptional()
  @IsString()
  hospital_type?: string | null;
}
