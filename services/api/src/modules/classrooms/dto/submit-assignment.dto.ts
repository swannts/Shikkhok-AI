import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsArray, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class SubmitAssignmentDto {
  @ApiProperty({ example: '১ থেকে ১০ পর্যন্ত সব প্রশ্নের উত্তর খাতায় লিখে ছবি আপলোড করেছি।' })
  @IsString()
  @IsNotEmpty()
  content: string;

  @ApiPropertyOptional({
    type: [String],
    example: ['https://cdn.shikkhok.ai/uploads/submissions/sub1.jpg'],
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  attachmentUrls?: string[];
}
