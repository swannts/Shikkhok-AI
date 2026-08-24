import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import '../../../../app/localization/l10n/app_localizations.dart';
import '../../../../app/theme/app_colors.dart';
import '../../../../app/theme/app_spacing.dart';

class StudentProfilePage extends StatelessWidget {
  const StudentProfilePage({super.key});

  @override
  Widget build(BuildContext context) {
    final l10n = AppLocalizations.of(context)!;

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
          l10n.profileTitle,
          style: const TextStyle(fontSize: 18, fontWeight: FontWeight.bold, color: AppColors.primary),
        ),
        actions: [
          IconButton(
            icon: const Icon(Icons.edit_rounded, color: AppColors.primary),
            onPressed: () {},
          ),
        ],
      ),
      body: SafeArea(
        child: SingleChildScrollView(
          padding: const EdgeInsets.all(AppSpacing.lg),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.center,
            children: [
              // Avatar & Name Card
              Container(
                width: 90,
                height: 90,
                decoration: const BoxDecoration(
                  color: AppColors.primary,
                  shape: BoxShape.circle,
                ),
                alignment: Alignment.center,
                child: const Text('আ', style: TextStyle(fontSize: 36, fontWeight: FontWeight.bold, color: Colors.white)),
              ),
              const SizedBox(height: AppSpacing.sm),
              const Text(
                'আরিফুর রহমান',
                style: TextStyle(fontSize: 22, fontWeight: FontWeight.bold, color: AppColors.textPrimary),
              ),
              const SizedBox(height: 2),
              const Text(
                '৮ম শ্রেণি • বিজ্ঞান বিভাগ',
                style: TextStyle(fontSize: 14, color: AppColors.textSecondary),
              ),
              const SizedBox(height: AppSpacing.xl),
              // Stats Row Card
              Container(
                padding: const EdgeInsets.all(AppSpacing.md),
                decoration: BoxDecoration(
                  color: AppColors.surface,
                  borderRadius: BorderRadius.circular(20),
                  border: Border.all(color: AppColors.border),
                ),
                child: Row(
                  mainAxisAlignment: MainAxisAlignment.spaceEvenly,
                  children: [
                    _buildStatCol('স্ট্রিক', '৭ দিন 🔥', Colors.deepOrange),
                    const VerticalDivider(width: 1, color: AppColors.border),
                    _buildStatCol('গড় মাস্তারি', '৭৮%', AppColors.primary),
                    const VerticalDivider(width: 1, color: AppColors.border),
                    _buildStatCol('পরীক্ষা সম্পন্ন', '২৫টি', Colors.green),
                  ],
                ),
              ),
              const SizedBox(height: AppSpacing.xl),
              // Profile Options List
              Container(
                decoration: BoxDecoration(
                  color: AppColors.surface,
                  borderRadius: BorderRadius.circular(20),
                  border: Border.all(color: AppColors.border),
                ),
                child: Column(
                  children: [
                    _buildMenuTile(
                      icon: Icons.workspace_premium_rounded,
                      iconColor: Colors.amber.shade800,
                      title: 'Shikkhok Plus (প্রিমিয়াম)',
                      subtitle: 'সকল আনলিমিটেড এআই সুবিধা',
                      onTap: () => context.go('/subscription'),
                    ),
                    const Divider(height: 1, color: AppColors.border),
                    _buildMenuTile(
                      icon: Icons.analytics_outlined,
                      iconColor: AppColors.primary,
                      title: l10n.myProgressTitle,
                      onTap: () => context.go('/student-progress-dashboard'),
                    ),
                    const Divider(height: 1, color: AppColors.border),
                    _buildMenuTile(
                      icon: Icons.cloud_download_outlined,
                      iconColor: Colors.blue,
                      title: l10n.offlineDownloadsTitle,
                      onTap: () => context.go('/offline-downloads'),
                    ),
                    const Divider(height: 1, color: AppColors.border),
                    _buildMenuTile(
                      icon: Icons.settings_outlined,
                      iconColor: Colors.purple,
                      title: l10n.settingsTitle,
                      onTap: () => context.go('/settings'),
                    ),
                    const Divider(height: 1, color: AppColors.border),
                    _buildMenuTile(
                      icon: Icons.logout_rounded,
                      iconColor: Colors.red,
                      title: l10n.logout,
                      textColor: Colors.red,
                      onTap: () => context.go('/login'),
                    ),
                  ],
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildStatCol(String title, String val, Color color) {
    return Column(
      children: [
        Text(title, style: const TextStyle(fontSize: 12, color: AppColors.textSecondary)),
        const SizedBox(height: 4),
        Text(val, style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold, color: color)),
      ],
    );
  }

  Widget _buildMenuTile({
    required IconData icon,
    required Color iconColor,
    required String title,
    String? subtitle,
    Color? textColor,
    required VoidCallback onTap,
  }) {
    return ListTile(
      onTap: onTap,
      leading: Container(
        padding: const EdgeInsets.all(8),
        decoration: BoxDecoration(
          color: iconColor.withAlpha(20),
          borderRadius: BorderRadius.circular(10),
        ),
        child: Icon(icon, color: iconColor, size: 20),
      ),
      title: Text(
        title,
        style: TextStyle(fontSize: 15, fontWeight: FontWeight.bold, color: textColor ?? AppColors.textPrimary),
      ),
      subtitle: subtitle != null ? Text(subtitle, style: const TextStyle(fontSize: 12, color: AppColors.textSecondary)) : null,
      trailing: const Icon(Icons.chevron_right_rounded, color: AppColors.textSecondary),
    );
  }
}
