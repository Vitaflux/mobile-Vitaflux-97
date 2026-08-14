import { IsMongoId } from 'class-validator';

export class BloodIdParamDto {
  @IsMongoId()
  id!: string;
}
