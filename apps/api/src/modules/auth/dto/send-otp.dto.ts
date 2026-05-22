import { IsNotEmpty, IsString, Matches } from 'class-validator';

export class SendOtpDto {
  @IsNotEmpty()
  @IsString()
  @Matches(/^[6-9]\d{9}$/, { message: 'Enter a valid 10-digit Indian mobile number' })
  phone: string;
}
