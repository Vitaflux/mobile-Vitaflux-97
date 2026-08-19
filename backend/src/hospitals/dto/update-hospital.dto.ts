import { IsNotEmpty, IsOptional, IsString, ValidateIf } from 'class-validator';

export class UpdateHospitalDto {
  @ValidateIf((_, value) => value !== undefined)
  @IsString()
  @IsNotEmpty()
  hospital_name?: string;

  @IsOptional()
  @IsString()
  address?: string | null;

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
