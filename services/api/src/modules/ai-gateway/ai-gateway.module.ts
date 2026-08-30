import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AiGatewayService } from './services/ai-gateway.service';
import { HmacSignerService } from './services/hmac-signer.service';

@Module({
  imports: [ConfigModule],
  providers: [AiGatewayService, HmacSignerService],
  exports: [AiGatewayService, HmacSignerService],
})
export class AiGatewayModule {}
