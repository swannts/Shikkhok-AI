import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsNotEmpty, IsString, Length, Matches } from 'class-validator';
import { PaymentMethod } from '../enums/payment-method.enum';

export class ManualPaymentSubmitDto {
  @ApiProperty({ example: '64b8268b6cb348e3b53f9001', description: 'Subscription plan ObjectId' })
  @IsString()
  @IsNotEmpty()
  planId: string;

  @ApiProperty({ enum: PaymentMethod, example: PaymentMethod.BKASH })
  @IsEnum(PaymentMethod)
  paymentMethod: PaymentMethod;

  @ApiProperty({ example: '01712345678', description: 'bKash/Nagad sender wallet number' })
  @IsString()
  @IsNotEmpty()
  @Matches(/^01[3-9]\d{8}$/, { message: 'Must be a valid 11-digit Bangladeshi mobile number' })
  senderNumber: string;

  @ApiProperty({ example: '9J78K4L1P', description: 'MFS transaction ID received in SMS' })
  @IsString()
  @IsNotEmpty()
  @Length(6, 30)
  manualTrxId: string;
}
