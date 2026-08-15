import { IsNotEmpty, IsString } from 'class-validator';

export class UpdatePushTokenDto {
  @IsString()
  @IsNotEmpty()
  push_token!: string;
}
