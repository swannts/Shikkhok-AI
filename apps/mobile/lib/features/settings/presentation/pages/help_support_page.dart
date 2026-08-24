import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import '../../../../app/localization/l10n/app_localizations.dart';
import '../../../../app/theme/app_colors.dart';
import '../../../../app/theme/app_spacing.dart';

class HelpSupportPage extends StatelessWidget {
  const HelpSupportPage({super.key});

  @override
  Widget build(BuildContext context) {
    final l10n = AppLocalizations.of(context)!;

    final faqs = [
      (
        'Shikkhok Plus সাবস্ক্রিপশন কীভাবে নেবো?',
        'প্রোফাইল থেকে Shikkhok Plus অপশনে গিয়ে আপনার পছন্দসই প্যাক (মাসিক/বার্ষিক) সিলেক্ট করুন এবং বিকাশ, নগদ বা রকেটের মাধ্যমে পেমেন্ট সম্পন্ন করুন।',
      ),
      (
        'অফলাইনে পড়ার জন্য পাঠ্যবই কীভাবে ডাউনলোড করবো?',
        'পাঠ্যবই লাইব্রেরি থেকে নির্দিষ্ট বইয়ের পাশে থাকা ডাউনলোড আইকনে ট্যাপ করুন। ডাউনলোড হওয়ার পর "অফলাইন ডাউনলোড" মেনু থেকে পড়া যাবে।',
      ),
      (
        'AI শিক্ষকের উত্তর সঠিক না মনে হলে কী করবো?',
        'যেকোনো উত্তরের নিচে থাকা থাম্বস ডাউন (👎) আইকনে ট্যাপ করে ফিডব্যাক জানান। আমাদের টিম উত্তরটি সংশোধন ও আপডেট করবে।',
      ),
    ];

    return Scaffold(
      backgroundColor: AppColors.background,
      appBar: AppBar(
        backgroundColor: AppColors.surface,
        elevation: 0.5,
        leading: IconButton(
          icon: const Icon(Icons.arrow_back_rounded,
              color: AppColors.textPrimary),
          onPressed: () => context.go('/settings'),
        ),
        title: Text(
          l10n.helpSupportTitle,
          style: const TextStyle(
              fontSize: 18,
              fontWeight: FontWeight.bold,
              color: AppColors.primary),
        ),
      ),
      body: SafeArea(
        child: SingleChildScrollView(
          padding: const EdgeInsets.all(AppSpacing.lg),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              // Contact Channels Card
              Container(
                padding: const EdgeInsets.all(AppSpacing.md),
                decoration: BoxDecoration(
                  color: AppColors.surface,
                  borderRadius: BorderRadius.circular(20),
                  border: Border.all(color: AppColors.border),
                ),
                child: Column(
                  children: [
                    ListTile(
                      leading: const Icon(Icons.headset_mic_rounded,
                          color: AppColors.primary),
                      title: const Text('লাইভ চ্যাট সাপোর্ট',
                          style: TextStyle(
                              fontSize: 15,
                              fontWeight: FontWeight.bold,
                              color: AppColors.textPrimary)),
                      subtitle: const Text('সকাল ৯টা - রাত ১০টা',
                          style: TextStyle(
                              fontSize: 12, color: AppColors.textSecondary)),
                      trailing: const Icon(Icons.chevron_right_rounded,
                          color: AppColors.textSecondary),
                      onTap: () => context.go('/ai-tutor-chat'),
                    ),
                    const Divider(height: 1, color: AppColors.border),
                    ListTile(
                      leading:
                          const Icon(Icons.email_outlined, color: Colors.blue),
                      title: const Text('ইমেইল সাপোর্ট',
                          style: TextStyle(
                              fontSize: 15,
                              fontWeight: FontWeight.bold,
                              color: AppColors.textPrimary)),
                      subtitle: const Text('support@shikkhok.ai',
                          style: TextStyle(
                              fontSize: 12, color: AppColors.textSecondary)),
                      trailing: const Icon(Icons.chevron_right_rounded,
                          color: AppColors.textSecondary),
                      onTap: () {},
                    ),
                    const Divider(height: 1, color: AppColors.border),
                    ListTile(
                      leading: const Icon(Icons.phone_in_talk_rounded,
                          color: Colors.green),
                      title: const Text('হটলাইন হেল্পলাইন',
                          style: TextStyle(
                              fontSize: 15,
                              fontWeight: FontWeight.bold,
                              color: AppColors.textPrimary)),
                      subtitle: const Text('১৬৬৭৭ (টোল ফ্রি)',
                          style: TextStyle(
                              fontSize: 12, color: AppColors.textSecondary)),
                      trailing: const Icon(Icons.chevron_right_rounded,
                          color: AppColors.textSecondary),
                      onTap: () {},
                    ),
                  ],
                ),
              ),
              const SizedBox(height: AppSpacing.xl),
              const Text('সাধারণ জিজ্ঞাসাসমূহ (FAQ)',
                  style: TextStyle(
                      fontSize: 18,
                      fontWeight: FontWeight.bold,
                      color: AppColors.textPrimary)),
              const SizedBox(height: AppSpacing.md),
              ListView.separated(
                shrinkWrap: true,
                physics: const NeverScrollableScrollPhysics(),
                itemCount: faqs.length,
                separatorBuilder: (context, index) =>
                    const SizedBox(height: 10),
                itemBuilder: (context, index) {
                  final faq = faqs[index];
                  return Container(
                    decoration: BoxDecoration(
                      color: AppColors.surface,
                      borderRadius: BorderRadius.circular(16),
                      border: Border.all(color: AppColors.border),
                    ),
                    child: ExpansionTile(
                      title: Text(faq.$1,
                          style: const TextStyle(
                              fontSize: 15,
                              fontWeight: FontWeight.bold,
                              color: AppColors.textPrimary)),
                      childrenPadding: const EdgeInsets.all(AppSpacing.md),
                      children: [
                        Text(faq.$2,
                            style: const TextStyle(
                                fontSize: 14,
                                height: 1.5,
                                color: AppColors.textSecondary)),
                      ],
                    ),
                  );
                },
              ),
            ],
          ),
        ),
      ),
    );
  }
}
