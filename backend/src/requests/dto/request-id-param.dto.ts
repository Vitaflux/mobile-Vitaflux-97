import { IsMongoId } from 'class-validator';

export class RequestIdParamDto {
  @IsMongoId()
  id!: string;
}
