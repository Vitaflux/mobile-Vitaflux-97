import { IsNotEmpty, IsString, ValidateIf } from 'class-validator';

export class UpdatePushTokenDto {
  @ValidateIf((_object, value) => value !== null)
  @IsString()
  @IsNotEmpty()
  push_token!: string | null;
}
