import { Type } from 'class-transformer';
import { IsInt, Max, Min } from 'class-validator';

export class NearbyHospitalsQueryDto {
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(20000)
  radius!: number;
}
