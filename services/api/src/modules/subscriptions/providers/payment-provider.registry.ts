import { Injectable, NotFoundException } from '@nestjs/common';
import { PaymentMethod } from '../enums/payment-method.enum';
import { PaymentProvider } from './payment-provider.interface';
import { BkashPaymentProvider } from './bkash-payment.provider';
import { NagadPaymentProvider } from './nagad-payment.provider';
import { SslCommerzPaymentProvider } from './sslcommerz-payment.provider';
import { MockPaymentProvider } from './mock-payment.provider';

@Injectable()
export class PaymentProviderRegistry {
  private readonly providers: Map<PaymentMethod, PaymentProvider> = new Map();

  constructor(
    private readonly bkashProvider: BkashPaymentProvider,
    private readonly nagadProvider: NagadPaymentProvider,
    private readonly sslcommerzProvider: SslCommerzPaymentProvider,
    private readonly mockProvider: MockPaymentProvider,
  ) {
    this.providers.set(PaymentMethod.BKASH, this.bkashProvider);
    this.providers.set(PaymentMethod.NAGAD, this.nagadProvider);
    this.providers.set(PaymentMethod.SSLCOMMERZ, this.sslcommerzProvider);
    this.providers.set(PaymentMethod.ROCKET, this.sslcommerzProvider); // Rocket route through MFS aggregator / SSLCommerz
    this.providers.set(PaymentMethod.MANUAL, this.mockProvider);
  }

  getProvider(method: PaymentMethod): PaymentProvider {
    const provider = this.providers.get(method);
    if (!provider) {
      throw new NotFoundException(`No payment provider registered for method: ${method}`);
    }
    return provider;
  }
}
