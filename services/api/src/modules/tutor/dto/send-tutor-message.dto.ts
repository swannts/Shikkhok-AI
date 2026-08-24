import { ApiProperty } from '@nestjs/swagger';
import { IsString, MaxLength } from 'class-validator';

export class SendTutorMessageDto {
  @ApiProperty({ example: 'বীজগণিতীয় সূত্র সহজভাবে বুঝিয়ে দাও' })
  @IsString()
  @MaxLength(2000)
  content: string;
}
