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
import { SubscriptionPlanRepository } from './repositories/subscription-plan.repository';
import { StudentSubscriptionRepository } from './repositories/student-subscription.repository';
import { PaymentTransactionRepository } from './repositories/payment-transaction.repository';
import { SubscriptionsService } from './subscriptions.service';
import { SubscriptionsController } from './subscriptions.controller';

@Module({
  imports: [
    UsersModule,
    StudentsModule,
    MongooseModule.forFeature([
      { name: SubscriptionPlan.name, schema: SubscriptionPlanSchema },
      { name: StudentSubscription.name, schema: StudentSubscriptionSchema },
      { name: PaymentTransaction.name, schema: PaymentTransactionSchema },
    ]),
  ],
  controllers: [SubscriptionsController],
  providers: [
    SubscriptionPlanRepository,
    StudentSubscriptionRepository,
    PaymentTransactionRepository,
    SubscriptionsService,
  ],
  exports: [
    SubscriptionsService,
    SubscriptionPlanRepository,
    StudentSubscriptionRepository,
    PaymentTransactionRepository,
  ],
})
export class SubscriptionsModule {}
