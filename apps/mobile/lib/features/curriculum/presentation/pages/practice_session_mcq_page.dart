import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import '../../../../app/localization/l10n/app_localizations.dart';
import '../../../../app/theme/app_colors.dart';
import '../../../../app/theme/app_spacing.dart';

class PracticeSessionMcqPage extends StatefulWidget {
  const PracticeSessionMcqPage({super.key});

  @override
  State<PracticeSessionMcqPage> createState() => _PracticeSessionMcqPageState();
}

class _PracticeSessionMcqPageState extends State<PracticeSessionMcqPage> {
  int? _selectedOption; // 0: A, 1: B (Wrong), 2: C (Correct), 3: D
  bool _submitted = false;

  @override
  Widget build(BuildContext context) {
    final l10n = AppLocalizations.of(context)!;

    final options = ['২', '৩', '৪', '৫'];

    return Scaffold(
      backgroundColor: AppColors.background,
      appBar: AppBar(
        backgroundColor: AppColors.surface,
        elevation: 0.5,
        leading: IconButton(
          icon: const Icon(Icons.close_rounded, color: AppColors.textPrimary),
          onPressed: () => context.go('/practice-setup'),
        ),
        title: Text(
          l10n.questionProgress(3, 10),
          style: const TextStyle(
              fontSize: 16,
              fontWeight: FontWeight.bold,
              color: AppColors.textPrimary),
        ),
        centerTitle: true,
        actions: const [
          Padding(
            padding: EdgeInsets.only(right: AppSpacing.md),
            child: Row(
              children: [
                Icon(Icons.timer_outlined, color: Colors.red, size: 18),
                SizedBox(width: 4),
                Text(
                  '০৪:২৮',
                  style: TextStyle(
                      fontSize: 14,
                      fontWeight: FontWeight.bold,
                      color: Colors.red),
                ),
              ],
            ),
          ),
        ],
        bottom: const PreferredSize(
          preferredSize: Size.fromHeight(4),
          child: LinearProgressIndicator(
            value: 0.3,
            backgroundColor: AppColors.border,
            valueColor: AlwaysStoppedAnimation<Color>(AppColors.primary),
            minHeight: 4,
          ),
        ),
      ),
      body: SafeArea(
        child: Column(
          children: [
            Expanded(
              child: SingleChildScrollView(
                padding: const EdgeInsets.all(AppSpacing.lg),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Container(
                      padding: const EdgeInsets.symmetric(
                          horizontal: 12, vertical: 4),
                      decoration: BoxDecoration(
                        color: AppColors.primary.withAlpha(15),
                        borderRadius: BorderRadius.circular(12),
                        border:
                            Border.all(color: AppColors.primary.withAlpha(30)),
                      ),
                      child: const Text(
                        'গণিত • সরল সমীকরণ',
                        style: TextStyle(
                            fontSize: 12,
                            fontWeight: FontWeight.bold,
                            color: AppColors.primary),
                      ),
                    ),
                    const SizedBox(height: AppSpacing.md),
                    const Text(
                      '২x + ৬ = ১৪ হলে x এর মান কত?',
                      style: TextStyle(
                          fontSize: 22,
                          fontWeight: FontWeight.bold,
                          color: AppColors.textPrimary),
                    ),
                    const SizedBox(height: AppSpacing.xl),
                    // Options List
                    ListView.separated(
                      shrinkWrap: true,
                      physics: const NeverScrollableScrollPhysics(),
                      itemCount: options.length,
                      separatorBuilder: (context, index) =>
                          const SizedBox(height: 12),
                      itemBuilder: (context, index) {
                        final isSelected = _selectedOption == index;
                        final isCorrect = index == 2; // C is correct answer

                        Color bgColor = AppColors.surface;
                        Color borderColor = AppColors.border;
                        Color textColor = AppColors.textPrimary;
                        Widget? suffixIcon;

                        if (_submitted) {
                          if (isCorrect) {
                            bgColor = Colors.green.shade100;
                            borderColor = Colors.green;
                            textColor = Colors.green.shade900;
                            suffixIcon = Row(
                              children: [
                                Container(
                                  padding: const EdgeInsets.symmetric(
                                      horizontal: 8, vertical: 2),
                                  decoration: BoxDecoration(
                                    color: Colors.green,
                                    borderRadius: BorderRadius.circular(6),
                                  ),
                                  child: Text(
                                    l10n.correctAnswer,
                                    style: const TextStyle(
                                        fontSize: 11,
                                        color: Colors.white,
                                        fontWeight: FontWeight.bold),
                                  ),
                                ),
                                const SizedBox(width: 6),
                                const Icon(Icons.check_rounded,
                                    color: Colors.green),
                              ],
                            );
                          } else if (isSelected && !isCorrect) {
                            bgColor = Colors.red.shade100;
                            borderColor = Colors.red;
                            textColor = Colors.red.shade900;
                            suffixIcon = Row(
                              children: [
                                Container(
                                  padding: const EdgeInsets.symmetric(
                                      horizontal: 8, vertical: 2),
                                  decoration: BoxDecoration(
                                    color: Colors.red,
                                    borderRadius: BorderRadius.circular(6),
                                  ),
                                  child: Text(
                                    l10n.wrongAnswer,
                                    style: const TextStyle(
                                        fontSize: 11,
                                        color: Colors.white,
                                        fontWeight: FontWeight.bold),
                                  ),
                                ),
                                const SizedBox(width: 6),
                                const Icon(Icons.close_rounded,
                                    color: Colors.red),
                              ],
                            );
                          }
                        } else if (isSelected) {
                          borderColor = AppColors.primary;
                          bgColor = AppColors.primary.withAlpha(20);
                        }

                        return InkWell(
                          onTap: _submitted
                              ? null
                              : () => setState(() => _selectedOption = index),
                          borderRadius: BorderRadius.circular(16),
                          child: Container(
                            padding: const EdgeInsets.all(16),
                            decoration: BoxDecoration(
                              color: bgColor,
                              borderRadius: BorderRadius.circular(16),
                              border: Border.all(
                                  color: borderColor,
                                  width:
                                      (isSelected || (_submitted && isCorrect))
                                          ? 2
                                          : 1),
                            ),
                            child: Row(
                              children: [
                                Text(
                                  '${String.fromCharCode(65 + index)}.',
                                  style: TextStyle(
                                      fontSize: 16,
                                      fontWeight: FontWeight.bold,
                                      color: textColor),
                                ),
                                const SizedBox(width: 14),
                                Expanded(
                                  child: Text(
                                    options[index],
                                    style: TextStyle(
                                        fontSize: 16,
                                        fontWeight: FontWeight.bold,
                                        color: textColor),
                                  ),
                                ),
                                if (suffixIcon != null) suffixIcon,
                              ],
                            ),
                          ),
                        );
                      },
                    ),
                    const SizedBox(height: AppSpacing.lg),
                    // Explanation Sheet when submitted
                    if (_submitted)
                      Container(
                        padding: const EdgeInsets.all(AppSpacing.md),
                        decoration: BoxDecoration(
                          color: AppColors.surface,
                          borderRadius: BorderRadius.circular(20),
                          border: Border.all(color: AppColors.border),
                        ),
                        child: const Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Row(
                              children: [
                                Icon(Icons.lightbulb_rounded,
                                    color: Colors.amber, size: 22),
                                SizedBox(width: 8),
                                Text(
                                  'সমাধান ও ব্যাখ্যা',
                                  style: TextStyle(
                                      fontSize: 16,
                                      fontWeight: FontWeight.bold,
                                      color: AppColors.primary),
                                ),
                              ],
                            ),
                            SizedBox(height: 8),
                            Text(
                              '২x + ৬ = ১৪\n➔ ২x = ১৪ - ৬ (পক্ষান্তর করে)\n➔ ২x = ৮\n➔ x = ৪',
                              style: TextStyle(
                                  fontSize: 14,
                                  height: 1.6,
                                  fontWeight: FontWeight.bold,
                                  color: AppColors.textPrimary),
                            ),
                          ],
                        ),
                      ),
                  ],
                ),
              ),
            ),
            // Bottom Sticky Action
            Container(
              padding: const EdgeInsets.all(AppSpacing.md),
              decoration: const BoxDecoration(
                color: AppColors.surface,
                border: Border(top: BorderSide(color: AppColors.border)),
              ),
              child: SizedBox(
                width: double.infinity,
                height: 52,
                child: ElevatedButton(
                  onPressed: _selectedOption == null
                      ? null
                      : () {
                          if (!_submitted) {
                            setState(() => _submitted = true);
                          } else {
                            context.go('/practice-result');
                          }
                        },
                  style: ElevatedButton.styleFrom(
                    backgroundColor: AppColors.primary,
                    shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(16)),
                  ),
                  child: Text(
                    _submitted ? l10n.next : 'যাচাই করুন',
                    style: const TextStyle(
                        fontSize: 16,
                        fontWeight: FontWeight.bold,
                        color: Colors.white),
                  ),
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }
}
