import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class VerifyPaymentDto {
  @ApiProperty({ example: 'TXN_SHK_1786212345_ABC' })
  @IsString()
  @IsNotEmpty()
  transactionId: string;
}
