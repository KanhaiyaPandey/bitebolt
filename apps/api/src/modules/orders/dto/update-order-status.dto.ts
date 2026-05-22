import { IsEnum, IsNumber, IsOptional, IsString, Max, MaxLength, Min } from 'class-validator';

export enum OrderStatusDto {
  ACCEPTED = 'ACCEPTED',
  REJECTED = 'REJECTED',
  PREPARING = 'PREPARING',
  OUT_FOR_DELIVERY = 'OUT_FOR_DELIVERY',
  DELIVERED = 'DELIVERED',
}

export class UpdateOrderStatusDto {
  @IsEnum(OrderStatusDto)
  status: OrderStatusDto;

  @IsOptional()
  @IsString()
  @MaxLength(200)
  notes?: string;

  @IsOptional()
  @IsString()
  @MaxLength(200)
  rejectionReason?: string;

  @IsOptional()
  @IsNumber()
  @Min(5)
  @Max(120)
  estimatedDeliveryTime?: number;
}
