import { IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class ForgotPasswordDto {
  @ApiProperty({
    example: 'rahul@example.com',
    description: 'Email address or phone number associated with the account',
  })
  @IsString()
  identifier: string;
}
