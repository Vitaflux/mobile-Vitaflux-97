import { Type } from 'class-transformer';
import { IsInt, Min, Max } from 'class-validator';

export class MatchBloodsQueryDto {
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(20000)
  radius!: number;
}
