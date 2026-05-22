import { IsEnum, IsNumber, IsOptional, IsString, IsUUID, Min } from 'class-validator';

export class CreateRazorpayOrderDto {
  @IsUUID()
  orderId: string;

  @IsEnum(['UPI', 'CARD', 'NET_BANKING'])
  method: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  walletAmountUsed?: number;
}
