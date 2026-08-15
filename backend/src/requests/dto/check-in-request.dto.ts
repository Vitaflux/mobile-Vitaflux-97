import { IsUUID } from 'class-validator';

export class CheckInRequestDto {
  @IsUUID()
  qr_token!: string;
}
