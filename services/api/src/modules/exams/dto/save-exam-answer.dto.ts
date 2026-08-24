import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty } from 'class-validator';

export class SaveExamAnswerDto {
  @ApiProperty({
    example: 'option_0',
    description: 'Submitted answer payload (option key, text, or array)',
  })
  @IsNotEmpty()
  submittedAnswer: any;
}
