import { Type } from 'class-transformer';
import {
  IsDefined,
  IsInt,
  IsString,
  IsUUID,
  Max,
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

  @IsDefined({ message: 'Donation volume is required' })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(2000)
  volume_ml!: number;
}
