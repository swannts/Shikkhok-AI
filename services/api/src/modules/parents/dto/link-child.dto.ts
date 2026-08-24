import { ApiProperty } from '@nestjs/swagger';
import { IsString, MaxLength } from 'class-validator';

export class LinkChildDto {
  @ApiProperty({
    example: '64b8268b6cb348e3b53f3112',
    description: 'Student user ID, phone number, or email address',
  })
  @IsString()
  @MaxLength(120)
  studentIdentifier: string;
}
