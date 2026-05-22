import { IsNotEmpty, IsString, Length, Matches } from 'class-validator';

export class VerifyOtpDto {
  @IsNotEmpty()
  @IsString()
  @Matches(/^[6-9]\d{9}$/, { message: 'Enter a valid 10-digit Indian mobile number' })
  phone: string;

  @IsNotEmpty()
  @IsString()
  @Length(6, 6, { message: 'OTP must be exactly 6 digits' })
  @Matches(/^\d+$/, { message: 'OTP must contain only digits' })
  otp: string;
}
