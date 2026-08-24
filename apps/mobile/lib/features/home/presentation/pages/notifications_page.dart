import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import '../../../../app/localization/l10n/app_localizations.dart';
import '../../../../app/theme/app_colors.dart';
import '../../../../app/theme/app_spacing.dart';

class NotificationsPage extends StatefulWidget {
  const NotificationsPage({super.key});

  @override
  State<NotificationsPage> createState() => _NotificationsPageState();
}

class _NotificationsPageState extends State<NotificationsPage> {
  int _selectedFilter = 0;

  @override
  Widget build(BuildContext context) {
    final l10n = AppLocalizations.of(context)!;

    final filters = ['সব', 'পড়াশোনা', 'পরীক্ষা', 'AI আপডেট'];
    final notifications = [
      (
        'আজকের স্টাডি প্ল্যান প্রস্তুত!',
        'আজকে তোমার সরল সমীকরণ ও বিজ্ঞান রিভিশন করার কথা রয়েছে।',
        '১০ মিনিট আগে',
        Icons.auto_stories_rounded,
        AppColors.primary,
        false
      ),
      (
        'নতুন মডেল টেস্ট যুক্ত হয়েছে',
        'গণিত অধ্যায় ৪-এর উপর নতুন একটি মডেল টেস্ট প্রকাশ করা হয়েছে।',
        '১ ঘণ্টা আগে',
        Icons.assignment_rounded,
        Colors.green,
        true
      ),
      (
        '৭ দিন টানা পড়ার জন্য অভিনন্দন! 🔥',
        'তুমি টানা ৭ দিন পড়াশোনা করে নিজের নতুন রেকর্ড গড়েছো।',
        'গতকাল',
        Icons.local_fire_department_rounded,
        Colors.deepOrange,
        true
      ),
    ];

    return Scaffold(
      backgroundColor: AppColors.background,
      appBar: AppBar(
        backgroundColor: AppColors.surface,
        elevation: 0.5,
        leading: IconButton(
          icon: const Icon(Icons.arrow_back_rounded, color: AppColors.textPrimary),
          onPressed: () => context.go('/'),
        ),
        title: Text(
          l10n.notificationsTitle,
          style: const TextStyle(fontSize: 18, fontWeight: FontWeight.bold, color: AppColors.primary),
        ),
        actions: [
          TextButton(
            onPressed: () {},
            child: Text(
              l10n.markAllRead,
              style: const TextStyle(fontSize: 12, color: AppColors.primary, fontWeight: FontWeight.bold),
            ),
          ),
        ],
      ),
      body: SafeArea(
        child: Column(
          children: [
            // Filter Pills Bar
            Container(
              height: 48,
              padding: const EdgeInsets.symmetric(vertical: 6, horizontal: AppSpacing.md),
              color: AppColors.surface,
              child: ListView.builder(
                scrollDirection: Axis.horizontal,
                itemCount: filters.length,
                itemBuilder: (context, index) {
                  final isSelected = _selectedFilter == index;
                  return Padding(
                    padding: const EdgeInsets.only(right: 8),
                    child: ChoiceChip(
                      label: Text(filters[index]),
                      selected: isSelected,
                      selectedColor: AppColors.primary,
                      backgroundColor: AppColors.background,
                      labelStyle: TextStyle(
                        color: isSelected ? Colors.white : AppColors.textSecondary,
                        fontSize: 12,
                        fontWeight: isSelected ? FontWeight.bold : FontWeight.normal,
                      ),
                      onSelected: (val) {
                        if (val) setState(() => _selectedFilter = index);
                      },
                    ),
                  );
                },
              ),
            ),
            const Divider(height: 1, color: AppColors.border),
            // Notifications List
            Expanded(
              child: ListView.separated(
                padding: const EdgeInsets.all(AppSpacing.md),
                itemCount: notifications.length,
                separatorBuilder: (context, index) => const SizedBox(height: 10),
                itemBuilder: (context, index) {
                  final item = notifications[index];
                  return Container(
                    padding: const EdgeInsets.all(AppSpacing.md),
                    decoration: BoxDecoration(
                      color: item.$6 ? AppColors.surface : AppColors.primary.withAlpha(10),
                      borderRadius: BorderRadius.circular(16),
                      border: Border.all(
                        color: item.$6 ? AppColors.border : AppColors.primary.withAlpha(30),
                      ),
                    ),
                    child: Row(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Container(
                          width: 40,
                          height: 40,
                          decoration: BoxDecoration(
                            color: item.$5.withAlpha(20),
                            borderRadius: BorderRadius.circular(12),
                          ),
                          child: Icon(item.$4, color: item.$5, size: 22),
                        ),
                        const SizedBox(width: AppSpacing.md),
                        Expanded(
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Row(
                                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                                children: [
                                  Expanded(
                                    child: Text(
                                      item.$1,
                                      style: const TextStyle(fontSize: 15, fontWeight: FontWeight.bold, color: AppColors.textPrimary),
                                    ),
                                  ),
                                  Text(
                                    item.$3,
                                    style: const TextStyle(fontSize: 11, color: AppColors.textSecondary),
                                  ),
                                ],
                              ),
                              const SizedBox(height: 4),
                              Text(
                                item.$2,
                                style: const TextStyle(fontSize: 13, height: 1.4, color: AppColors.textSecondary),
                              ),
                            ],
                          ),
                        ),
                      ],
                    ),
                  );
                },
              ),
            ),
          ],
        ),
      ),
    );
  }
}
