import { Type } from 'class-transformer';
import {
  Equals,
  IsBoolean,
  IsMongoId,
  IsObject,
  ValidateNested,
} from 'class-validator';

export class RequestScreeningsDto {
  @IsBoolean()
  @Equals(true, {
    message: 'Donor must pass the screening before registering',
  })
  screeningPassed!: true;

  @IsObject()
  screeningAnswers!: Record<string, unknown>;
}

export class CreateRequestDto {
  @IsMongoId()
  bloods_id!: string;

  @ValidateNested()
  @Type(() => RequestScreeningsDto)
  screenings!: RequestScreeningsDto;
}
