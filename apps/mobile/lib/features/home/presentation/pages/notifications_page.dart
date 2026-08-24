import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../../../app/localization/l10n/app_localizations.dart';
import '../../../../app/theme/app_colors.dart';
import '../../../../app/theme/app_spacing.dart';
import '../../../../shared/widgets/app_badge.dart';
import '../../../../shared/widgets/app_card.dart';
import '../../../../shared/widgets/app_empty_state.dart';
import '../../../../shared/widgets/app_skeleton.dart';
import '../../../notifications/domain/entities/notification_item.dart';
import '../../../notifications/presentation/controllers/notifications_controller.dart';

class NotificationsPage extends ConsumerStatefulWidget {
  const NotificationsPage({super.key});

  @override
  ConsumerState<NotificationsPage> createState() => _NotificationsPageState();
}

class _NotificationsPageState extends ConsumerState<NotificationsPage> {
  final ScrollController _scrollController = ScrollController();

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      ref.read(notificationsControllerProvider.notifier).loadInitial();
    });
    _scrollController.addListener(_handleScroll);
  }

  @override
  void dispose() {
    _scrollController.removeListener(_handleScroll);
    _scrollController.dispose();
    super.dispose();
  }

  void _handleScroll() {
    if (!_scrollController.hasClients) {
      return;
    }

    final position = _scrollController.position;
    if (position.pixels >= position.maxScrollExtent - 240) {
      ref.read(notificationsControllerProvider.notifier).loadMore();
    }
  }

  Future<void> _refresh() async {
    await ref.read(notificationsControllerProvider.notifier).refresh();
  }

  @override
  Widget build(BuildContext context) {
    final l10n = AppLocalizations.of(context)!;
    final state = ref.watch(notificationsControllerProvider);
    final notifier = ref.read(notificationsControllerProvider.notifier);

    return Scaffold(
      backgroundColor: AppColors.background,
      appBar: AppBar(
        backgroundColor: AppColors.surface,
        elevation: 0.5,
        leading: IconButton(
          icon: const Icon(Icons.arrow_back_rounded,
              color: AppColors.textPrimary),
          onPressed: () => context.go('/'),
        ),
        title: Row(
          mainAxisSize: MainAxisSize.min,
          children: [
            Text(
              l10n.notificationsTitle,
              style: const TextStyle(
                fontSize: 18,
                fontWeight: FontWeight.bold,
                color: AppColors.primary,
              ),
            ),
            if (state.unreadCount > 0) ...[
              const SizedBox(width: 8),
              AppBadge(
                label: '${state.unreadCount}',
                variant: AppBadgeVariant.warning,
              ),
            ],
          ],
        ),
        actions: [
          TextButton(
            onPressed: state.unreadCount == 0 ? null : notifier.markAllAsRead,
            child: Text(
              l10n.markAllRead,
              style: const TextStyle(
                fontSize: 12,
                color: AppColors.primary,
                fontWeight: FontWeight.bold,
              ),
            ),
          ),
        ],
      ),
      body: SafeArea(
        child: RefreshIndicator(
          onRefresh: _refresh,
          child: Builder(
            builder: (context) {
              if (state.isInitialLoading) {
                return ListView.separated(
                  physics: const AlwaysScrollableScrollPhysics(),
                  padding: const EdgeInsets.all(AppSpacing.md),
                  itemCount: 5,
                  separatorBuilder: (_, __) => const SizedBox(height: 10),
                  itemBuilder: (context, index) => const AppCard(
                    child: Row(
                      children: [
                        AppSkeleton(width: 40, height: 40, borderRadius: 12),
                        SizedBox(width: AppSpacing.md),
                        Expanded(
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              AppSkeleton(width: double.infinity, height: 14),
                              SizedBox(height: 8),
                              AppSkeleton(width: double.infinity, height: 12),
                              SizedBox(height: 4),
                              AppSkeleton(width: 140, height: 12),
                            ],
                          ),
                        ),
                      ],
                    ),
                  ),
                );
              }

              if (state.errorMessage != null && state.items.isEmpty) {
                return ListView(
                  physics: const AlwaysScrollableScrollPhysics(),
                  children: [
                    AppEmptyState(
                      icon: Icons.notifications_off_rounded,
                      title: 'নোটিফিকেশন লোড হয়নি',
                      description: state.errorMessage!,
                      actionLabel: 'আবার চেষ্টা করুন',
                      onActionTap: _refresh,
                    ),
                  ],
                );
              }

              if (state.items.isEmpty) {
                return ListView(
                  physics: const AlwaysScrollableScrollPhysics(),
                  children: const [
                    AppEmptyState(
                      icon: Icons.notifications_none_rounded,
                      title: 'কোনো নোটিফিকেশন নেই',
                      description: 'নতুন আপডেট, স্টাডি প্ল্যান বা বার্তা এলে এখানে দেখা যাবে।',
                    ),
                  ],
                );
              }

              return ListView.separated(
                controller: _scrollController,
                physics: const AlwaysScrollableScrollPhysics(),
                padding: const EdgeInsets.all(AppSpacing.md),
                itemCount: state.items.length + (state.isLoadingMore ? 1 : 0),
                separatorBuilder: (context, index) => const SizedBox(height: 10),
                itemBuilder: (context, index) {
                  if (index >= state.items.length) {
                    return const Padding(
                      padding: EdgeInsets.symmetric(vertical: AppSpacing.md),
                      child: Center(
                        child: CircularProgressIndicator(
                          strokeWidth: 2.5,
                          color: AppColors.primary,
                        ),
                      ),
                    );
                  }

                  final notification = state.items[index];
                  return _NotificationTile(
                    notification: notification,
                    onTap: () async {
                      if (!notification.isRead) {
                        await notifier.markAsRead(notification.id);
                      }
                    },
                  );
                },
              );
            },
          ),
        ),
      ),
    );
  }
}

class _NotificationTile extends StatelessWidget {
  const _NotificationTile({
    required this.notification,
    required this.onTap,
  });

  final NotificationItem notification;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    final isRead = notification.isRead;
    final iconData = _iconForType(notification.type);

    return AppCard(
      onTap: onTap,
      backgroundColor: isRead ? AppColors.surface : AppColors.primary.withAlpha(8),
      border: Border.all(
        color: isRead ? AppColors.border : AppColors.primary.withAlpha(24),
      ),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Container(
            width: 42,
            height: 42,
            decoration: BoxDecoration(
              color: AppColors.primary.withAlpha(14),
              borderRadius: BorderRadius.circular(12),
            ),
            child: Icon(iconData, color: AppColors.primary, size: 22),
          ),
          const SizedBox(width: AppSpacing.md),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Expanded(
                      child: Text(
                        notification.title,
                        style: TextStyle(
                          fontSize: 15,
                          fontWeight: isRead ? FontWeight.w600 : FontWeight.bold,
                          color: AppColors.textPrimary,
                        ),
                      ),
                    ),
                    const SizedBox(width: 8),
                    Text(
                      _formatRelativeTime(notification.createdAt),
                      style: const TextStyle(
                        fontSize: 11,
                        color: AppColors.textSecondary,
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 4),
                Text(
                  notification.body,
                  style: const TextStyle(
                    fontSize: 13,
                    height: 1.4,
                    color: AppColors.textSecondary,
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  IconData _iconForType(String type) {
    switch (type.toLowerCase()) {
      case 'study_plan':
        return Icons.calendar_today_rounded;
      case 'progress':
        return Icons.trending_up_rounded;
      case 'tutor':
        return Icons.smart_toy_rounded;
      case 'payment':
        return Icons.payments_rounded;
      case 'system':
      default:
        return Icons.notifications_rounded;
    }
  }

  String _formatRelativeTime(DateTime createdAt) {
    final diff = DateTime.now().difference(createdAt);
    if (diff.inMinutes < 1) {
      return 'এখনই';
    }
    if (diff.inHours < 1) {
      return '${diff.inMinutes} মিনিট আগে';
    }
    if (diff.inDays < 1) {
      return '${diff.inHours} ঘণ্টা আগে';
    }
    return '${diff.inDays} দিন আগে';
  }
}
