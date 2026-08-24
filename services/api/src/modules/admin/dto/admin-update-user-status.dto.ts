import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsOptional, IsString, MaxLength } from 'class-validator';
import { UserStatus } from '../../users/enums/user-status.enum';

export class AdminUpdateUserStatusDto {
  @ApiProperty({ enum: UserStatus, example: UserStatus.SUSPENDED })
  @IsEnum(UserStatus)
  status: UserStatus;

  @ApiPropertyOptional({
    description: 'Administrative justification for account status change',
    example: 'Violation of platform community standards',
  })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  reason?: string;
}
