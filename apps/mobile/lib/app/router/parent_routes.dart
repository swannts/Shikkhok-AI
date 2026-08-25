import 'package:go_router/go_router.dart';
import '../../features/checkout/presentation/pages/checkout_page.dart';
import '../../features/checkout/presentation/pages/payment_success_page.dart';
import '../../features/parent/presentation/pages/parent_dashboard_page.dart';
import '../../features/subscription/presentation/pages/subscription_page.dart';
import 'app_routes.dart';

final List<RouteBase> parentRoutes = [
  GoRoute(
    path: AppRoutes.parentDashboard,
    builder: (context, state) => const ParentDashboardPage(),
  ),
  GoRoute(
    path: AppRoutes.subscription,
    builder: (context, state) => const SubscriptionPage(),
  ),
  GoRoute(
    path: AppRoutes.checkout,
    builder: (context, state) => const CheckoutPage(),
  ),
  GoRoute(
    path: AppRoutes.paymentSuccess,
    builder: (context, state) => const PaymentSuccessPage(),
  ),
];
