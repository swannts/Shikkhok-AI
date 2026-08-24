import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, Length } from 'class-validator';

export class JoinClassroomDto {
  @ApiProperty({ example: 'SHK8A1', description: '6-character classroom join code' })
  @IsString()
  @IsNotEmpty()
  @Length(6, 6)
  code: string;
}
