import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import '../../../../app/localization/l10n/app_localizations.dart';
import '../../../../app/theme/app_colors.dart';
import '../../../../app/theme/app_spacing.dart';

class ExamSessionPage extends StatefulWidget {
  const ExamSessionPage({super.key});

  @override
  State<ExamSessionPage> createState() => _ExamSessionPageState();
}

class _ExamSessionPageState extends State<ExamSessionPage> {
  int _currentQuestionIndex = 4; // 5th question
  final Map<int, int> _userAnswers = {0: 1, 1: 2, 2: 0, 3: 3};

  @override
  Widget build(BuildContext context) {
    final l10n = AppLocalizations.of(context)!;

    final options = ['x = ২', 'x = ৩', 'x = ৪', 'x = ৫'];

    return Scaffold(
      backgroundColor: AppColors.background,
      appBar: AppBar(
        backgroundColor: AppColors.surface,
        elevation: 0.5,
        leading: IconButton(
          icon: const Icon(Icons.close_rounded, color: AppColors.textPrimary),
          onPressed: () => context.go('/exam-instructions'),
        ),
        title: Text(
          l10n.questionProgress(_currentQuestionIndex + 1, 30),
          style: const TextStyle(fontSize: 16, fontWeight: FontWeight.bold, color: AppColors.textPrimary),
        ),
        centerTitle: true,
        actions: [
          Padding(
            padding: const EdgeInsets.only(right: AppSpacing.md),
            child: Row(
              children: const [
                Icon(Icons.timer_outlined, color: AppColors.primary, size: 18),
                SizedBox(width: 4),
                Text(
                  '৩৯:৪৫',
                  style: TextStyle(fontSize: 14, fontWeight: FontWeight.bold, color: AppColors.primary),
                ),
              ],
            ),
          ),
        ],
        bottom: PreferredSize(
          preferredSize: const Size.fromHeight(4),
          child: LinearProgressIndicator(
            value: (_currentQuestionIndex + 1) / 30,
            backgroundColor: AppColors.border,
            valueColor: const AlwaysStoppedAnimation<Color>(AppColors.primary),
            minHeight: 4,
          ),
        ),
      ),
      body: SafeArea(
        child: Column(
          children: [
            // Question Grid Pills Bar
            SizedBox(
              height: 48,
              child: ListView.builder(
                scrollDirection: Axis.horizontal,
                padding: const EdgeInsets.symmetric(horizontal: AppSpacing.md, vertical: 8),
                itemCount: 30,
                itemBuilder: (context, index) {
                  final isCurrent = index == _currentQuestionIndex;
                  final isAnswered = _userAnswers.containsKey(index);

                  return Padding(
                    padding: const EdgeInsets.only(right: 6),
                    child: InkWell(
                      onTap: () => setState(() => _currentQuestionIndex = index),
                      borderRadius: BorderRadius.circular(8),
                      child: Container(
                        width: 32,
                        height: 32,
                        alignment: Alignment.center,
                        decoration: BoxDecoration(
                          color: isCurrent
                              ? AppColors.primary
                              : (isAnswered ? AppColors.primary.withAlpha(30) : AppColors.surface),
                          borderRadius: BorderRadius.circular(8),
                          border: Border.all(
                            color: isCurrent ? AppColors.primary : AppColors.border,
                          ),
                        ),
                        child: Text(
                          '${index + 1}',
                          style: TextStyle(
                            fontSize: 12,
                            fontWeight: FontWeight.bold,
                            color: isCurrent ? Colors.white : AppColors.textPrimary,
                          ),
                        ),
                      ),
                    ),
                  );
                },
              ),
            ),
            const Divider(height: 1, color: AppColors.border),
            // Main Question Card
            Expanded(
              child: SingleChildScrollView(
                padding: const EdgeInsets.all(AppSpacing.lg),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      'প্রশ্ন ${_currentQuestionIndex + 1}',
                      style: const TextStyle(fontSize: 14, fontWeight: FontWeight.bold, color: AppColors.textSecondary),
                    ),
                    const SizedBox(height: 8),
                    const Text(
                      'যদি ২x + ৫ = ১৫ হয়, তবে x এর মান নিচের কোনটি সঠিক?',
                      style: TextStyle(fontSize: 20, fontWeight: FontWeight.bold, color: AppColors.textPrimary),
                    ),
                    const SizedBox(height: AppSpacing.xl),
                    // MCQ Options
                    ListView.separated(
                      shrinkWrap: true,
                      physics: const NeverScrollableScrollPhysics(),
                      itemCount: options.length,
                      separatorBuilder: (context, index) => const SizedBox(height: 12),
                      itemBuilder: (context, index) {
                        final isSelected = _userAnswers[_currentQuestionIndex] == index;

                        return InkWell(
                          onTap: () => setState(() => _userAnswers[_currentQuestionIndex] = index),
                          borderRadius: BorderRadius.circular(16),
                          child: Container(
                            padding: const EdgeInsets.all(16),
                            decoration: BoxDecoration(
                              color: isSelected ? AppColors.primary.withAlpha(20) : AppColors.surface,
                              borderRadius: BorderRadius.circular(16),
                              border: Border.all(
                                color: isSelected ? AppColors.primary : AppColors.border,
                                width: isSelected ? 2 : 1,
                              ),
                            ),
                            child: Row(
                              children: [
                                Text(
                                  '${String.fromCharCode(65 + index)}.',
                                  style: TextStyle(
                                    fontSize: 16,
                                    fontWeight: FontWeight.bold,
                                    color: isSelected ? AppColors.primary : AppColors.textPrimary,
                                  ),
                                ),
                                const SizedBox(width: 14),
                                Expanded(
                                  child: Text(
                                    options[index],
                                    style: TextStyle(
                                      fontSize: 16,
                                      fontWeight: FontWeight.bold,
                                      color: isSelected ? AppColors.primary : AppColors.textPrimary,
                                    ),
                                  ),
                                ),
                                if (isSelected)
                                  const Icon(Icons.check_circle_rounded, color: AppColors.primary, size: 22),
                              ],
                            ),
                          ),
                        );
                      },
                    ),
                  ],
                ),
              ),
            ),
            // Bottom Sticky Navigation Controls Bar
            Container(
              padding: const EdgeInsets.all(AppSpacing.md),
              decoration: const BoxDecoration(
                color: AppColors.surface,
                border: Border(top: BorderSide(color: AppColors.border)),
              ),
              child: Row(
                children: [
                  OutlinedButton(
                    onPressed: _currentQuestionIndex > 0
                        ? () => setState(() => _currentQuestionIndex--)
                        : null,
                    style: OutlinedButton.styleFrom(
                      side: const BorderSide(color: AppColors.border),
                      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
                      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
                    ),
                    child: Text(l10n.prevLesson, style: const TextStyle(color: AppColors.textSecondary)),
                  ),
                  const SizedBox(width: 8),
                  Expanded(
                    child: ElevatedButton(
                      onPressed: () => context.go('/exam-result'),
                      style: ElevatedButton.styleFrom(
                        backgroundColor: Colors.green,
                        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
                        padding: const EdgeInsets.symmetric(vertical: 12),
                      ),
                      child: Text(
                        l10n.submitExam,
                        style: const TextStyle(fontSize: 15, fontWeight: FontWeight.bold, color: Colors.white),
                      ),
                    ),
                  ),
                  const SizedBox(width: 8),
                  OutlinedButton(
                    onPressed: _currentQuestionIndex < 29
                        ? () => setState(() => _currentQuestionIndex++)
                        : null,
                    style: OutlinedButton.styleFrom(
                      side: const BorderSide(color: AppColors.primary),
                      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
                      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
                    ),
                    child: Text(l10n.nextLesson, style: const TextStyle(color: AppColors.primary, fontWeight: FontWeight.bold)),
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }
}
