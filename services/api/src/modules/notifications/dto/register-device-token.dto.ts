import { IsEnum, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class RegisterDeviceTokenDto {
  @IsString()
  @IsNotEmpty()
  token: string;

  @IsEnum(['android', 'ios', 'web'], {
    message: 'Platform must be android, ios, or web',
  })
  platform: 'android' | 'ios' | 'web';

  @IsString()
  @IsOptional()
  appVersion?: string;

  @IsString()
  @IsOptional()
  deviceModel?: string;
}

export class UnregisterDeviceTokenDto {
  @IsString()
  @IsNotEmpty()
  token: string;
}
