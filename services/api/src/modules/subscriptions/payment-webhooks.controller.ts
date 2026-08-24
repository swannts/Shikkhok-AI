import { Body, Controller, Headers, HttpCode, HttpStatus, Post } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { PaymentWebhookService } from './payment-webhook.service';
import { PaymentMethod } from './enums/payment-method.enum';

@ApiTags('Payment Webhooks')
@Controller({ path: 'webhooks/payments', version: '1' })
export class PaymentWebhooksController {
  constructor(private readonly webhookService: PaymentWebhookService) {}

  @Post('bkash')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'bKash IPN / webhook callback endpoint (Signature verified)' })
  @ApiResponse({ status: 200, description: 'Webhook processed successfully' })
  async handleBkashWebhook(
    @Headers() headers: Record<string, any>,
    @Body() payload: Record<string, any>,
  ) {
    return this.webhookService.handleWebhook(PaymentMethod.BKASH, headers, payload);
  }

  @Post('nagad')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Nagad IPN / webhook callback endpoint (Signature verified)' })
  @ApiResponse({ status: 200, description: 'Webhook processed successfully' })
  async handleNagadWebhook(
    @Headers() headers: Record<string, any>,
    @Body() payload: Record<string, any>,
  ) {
    return this.webhookService.handleWebhook(PaymentMethod.NAGAD, headers, payload);
  }

  @Post('sslcommerz')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'SSLCommerz IPN callback endpoint (Signature verified)' })
  @ApiResponse({ status: 200, description: 'Webhook processed successfully' })
  async handleSslcommerzWebhook(
    @Headers() headers: Record<string, any>,
    @Body() payload: Record<string, any>,
  ) {
    return this.webhookService.handleWebhook(PaymentMethod.SSLCOMMERZ, headers, payload);
  }
}
