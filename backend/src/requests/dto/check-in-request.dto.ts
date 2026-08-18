import { Type } from 'class-transformer';
import {
  IsInt,
  IsOptional,
  IsString,
  IsUUID,
  Matches,
  Min,
  ValidateIf,
} from 'class-validator';

export class CheckInRequestDto {
  @ValidateIf(
    (dto: CheckInRequestDto) =>
      dto.code === undefined || dto.qr_token !== undefined,
  )
  @IsUUID()
  qr_token?: string;

  @ValidateIf(
    (dto: CheckInRequestDto) =>
      dto.qr_token === undefined || dto.code !== undefined,
  )
  @IsString()
  @Matches(/^VF-\d{4}$/, {
    message: 'Code must use the format VF-8241',
  })
  code?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  volume_ml?: number;
}
