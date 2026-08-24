import { Body, Controller, Get, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { AuthenticatedUser } from '../auth/strategies/jwt-access.strategy';
import { SubscriptionsService } from './subscriptions.service';
import { InitiatePaymentDto } from './dto/initiate-payment.dto';
import { VerifyPaymentDto } from './dto/verify-payment.dto';
import { ManualPaymentSubmitDto } from './dto/manual-payment-submit.dto';

@ApiTags('Subscriptions')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller({ path: 'subscriptions', version: '1' })
export class SubscriptionsController {
  constructor(private readonly subscriptionsService: SubscriptionsService) {}

  @Get('plans')
  @ApiOperation({
    summary: 'List all published pricing plans with BDT rates and feature highlights',
  })
  @ApiResponse({ status: 200, description: 'List of subscription plans' })
  async listPlans() {
    return this.subscriptionsService.listPlans();
  }

  @Get('me')
  @ApiOperation({ summary: 'Get current user active subscription details and remaining days' })
  @ApiResponse({ status: 200, description: 'Current subscription status' })
  async getMySubscription(@CurrentUser() user: AuthenticatedUser) {
    return this.subscriptionsService.getMySubscription(user);
  }

  @Post('payments/initiate')
  @ApiOperation({
    summary: 'Initiate digital payment checkout session (bKash, Nagad, Rocket, SSLCommerz)',
  })
  @ApiResponse({ status: 201, description: 'Payment session initiated with gateway URL' })
  async initiatePayment(@CurrentUser() user: AuthenticatedUser, @Body() dto: InitiatePaymentDto) {
    return this.subscriptionsService.initiatePayment(user, dto);
  }

  @Post('payments/verify')
  @ApiOperation({ summary: 'Verify payment gateway callback/IPN and activate subscription' })
  @ApiResponse({ status: 200, description: 'Payment verified and subscription activated' })
  async verifyPayment(@CurrentUser() user: AuthenticatedUser, @Body() dto: VerifyPaymentDto) {
    return this.subscriptionsService.verifyPayment(user, dto);
  }

  @Post('payments/manual-submit')
  @ApiOperation({
    summary: 'Submit manual bKash/Nagad wallet number and TrxID for instant activation',
  })
  @ApiResponse({ status: 200, description: 'Manual payment submitted and subscription activated' })
  async submitManualPayment(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: ManualPaymentSubmitDto,
  ) {
    return this.subscriptionsService.submitManualPayment(user, dto);
  }
}
