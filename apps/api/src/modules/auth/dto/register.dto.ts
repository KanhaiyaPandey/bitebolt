import { IsEmail, IsNotEmpty, IsOptional, IsString, MaxLength, MinLength } from 'class-validator';

export class RegisterDto {
  @IsNotEmpty()
  @IsString()
  @MinLength(2)
  @MaxLength(50)
  name: string;

  @IsOptional()
  @IsEmail({}, { message: 'Enter a valid email address' })
  email?: string;
}
