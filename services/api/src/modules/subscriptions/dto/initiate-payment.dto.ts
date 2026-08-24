import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { PaymentMethod } from '../enums/payment-method.enum';

export class InitiatePaymentDto {
  @ApiProperty({ example: '64b8268b6cb348e3b53f9001', description: 'Subscription plan ObjectId' })
  @IsString()
  @IsNotEmpty()
  planId: string;

  @ApiProperty({ enum: PaymentMethod, default: PaymentMethod.BKASH })
  @IsEnum(PaymentMethod)
  paymentMethod: PaymentMethod;

  @ApiPropertyOptional({ example: 'https://shikkhok.ai/payment/success' })
  @IsOptional()
  @IsString()
  callbackUrl?: string;
}
