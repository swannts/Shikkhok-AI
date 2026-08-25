class UserSubscription {
  final String
      status; // active, expired, pending_verification, free_trial, none
  final String? planTitle;
  final DateTime? expiresAt;
  final int remainingDays;
  final bool hasActiveAccess;

  const UserSubscription({
    this.status = 'none',
    this.planTitle,
    this.expiresAt,
    this.remainingDays = 0,
    this.hasActiveAccess = false,
  });

  bool get isActive => hasActiveAccess || status == 'active';
  bool get isPending => status == 'pending_verification';
}
