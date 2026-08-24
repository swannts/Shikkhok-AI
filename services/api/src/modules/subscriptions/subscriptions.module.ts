import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { UsersModule } from '../users/users.module';
import { StudentsModule } from '../students/students.module';
import { SubscriptionPlan, SubscriptionPlanSchema } from './schemas/subscription-plan.schema';
import {
  StudentSubscription,
  StudentSubscriptionSchema,
} from './schemas/student-subscription.schema';
import { PaymentTransaction, PaymentTransactionSchema } from './schemas/payment-transaction.schema';
import {
  PaymentWebhookEvent,
  PaymentWebhookEventSchema,
} from './schemas/payment-webhook-event.schema';
import { SubscriptionPlanRepository } from './repositories/subscription-plan.repository';
import { StudentSubscriptionRepository } from './repositories/student-subscription.repository';
import { PaymentTransactionRepository } from './repositories/payment-transaction.repository';
import { PaymentWebhookEventRepository } from './repositories/payment-webhook-event.repository';
import { SubscriptionsService } from './subscriptions.service';
import { SubscriptionsController } from './subscriptions.controller';
import { PaymentWebhooksController } from './payment-webhooks.controller';
import { PaymentWebhookService } from './payment-webhook.service';
import { SubscriptionActivationService } from './services/subscription-activation.service';
import { PaymentStateMachineService } from './services/payment-state-machine.service';
import { BkashPaymentProvider } from './providers/bkash-payment.provider';
import { NagadPaymentProvider } from './providers/nagad-payment.provider';
import { SslCommerzPaymentProvider } from './providers/sslcommerz-payment.provider';
import { MockPaymentProvider } from './providers/mock-payment.provider';
import { PaymentProviderRegistry } from './providers/payment-provider.registry';

@Module({
  imports: [
    UsersModule,
    StudentsModule,
    MongooseModule.forFeature([
      { name: SubscriptionPlan.name, schema: SubscriptionPlanSchema },
      { name: StudentSubscription.name, schema: StudentSubscriptionSchema },
      { name: PaymentTransaction.name, schema: PaymentTransactionSchema },
      { name: PaymentWebhookEvent.name, schema: PaymentWebhookEventSchema },
    ]),
  ],
  controllers: [SubscriptionsController, PaymentWebhooksController],
  providers: [
    SubscriptionPlanRepository,
    StudentSubscriptionRepository,
    PaymentTransactionRepository,
    PaymentWebhookEventRepository,
    PaymentStateMachineService,
    BkashPaymentProvider,
    NagadPaymentProvider,
    SslCommerzPaymentProvider,
    MockPaymentProvider,
    PaymentProviderRegistry,
    SubscriptionActivationService,
    PaymentWebhookService,
    SubscriptionsService,
  ],
  exports: [
    SubscriptionsService,
    SubscriptionPlanRepository,
    StudentSubscriptionRepository,
    PaymentTransactionRepository,
    PaymentWebhookEventRepository,
    SubscriptionActivationService,
    PaymentWebhookService,
    PaymentProviderRegistry,
    PaymentStateMachineService,
  ],
})
export class SubscriptionsModule {}
