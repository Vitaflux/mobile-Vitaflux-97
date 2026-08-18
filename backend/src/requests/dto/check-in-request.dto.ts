import { Type } from 'class-transformer';
import { IsInt, IsOptional, IsUUID, Min } from 'class-validator';

export class CheckInRequestDto {
  @IsUUID()
  qr_token!: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  volume_ml?: number;
}
