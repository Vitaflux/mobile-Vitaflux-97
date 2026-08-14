import { IsMongoId } from 'class-validator';

export class RequestBloodParamDto {
  @IsMongoId()
  bloodId!: string;
}
