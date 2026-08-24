import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import '../../../../app/localization/l10n/app_localizations.dart';
import '../../../../app/theme/app_colors.dart';
import '../../../../app/theme/app_spacing.dart';

class LessonReaderPage extends StatefulWidget {
  const LessonReaderPage({super.key});

  @override
  State<LessonReaderPage> createState() => _LessonReaderPageState();
}

class _LessonReaderPageState extends State<LessonReaderPage> {
  int? _selectedQuizOption;

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
          onPressed: () => context.go('/chapter-details'),
        ),
        title: Text(
          l10n.lessonReaderTitle,
          style: const TextStyle(fontSize: 18, fontWeight: FontWeight.bold, color: AppColors.primary),
        ),
        actions: [
          IconButton(
            icon: const Icon(Icons.bookmark_outline_rounded, color: AppColors.primary),
            onPressed: () {},
          ),
        ],
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
                    // Metadata Header
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        Text(l10n.chapter4Math, style: const TextStyle(fontSize: 13, color: AppColors.textSecondary)),
                        Row(
                          children: const [
                            Icon(Icons.schedule_rounded, size: 14, color: AppColors.textSecondary),
                            SizedBox(width: 4),
                            Text('১৫ মিনিট', style: TextStyle(fontSize: 13, color: AppColors.textSecondary)),
                          ],
                        ),
                      ],
                    ),
                    const SizedBox(height: AppSpacing.xs),
                    ClipRRect(
                      borderRadius: BorderRadius.circular(4),
                      child: const LinearProgressIndicator(
                        value: 0.35,
                        backgroundColor: AppColors.border,
                        valueColor: AlwaysStoppedAnimation<Color>(AppColors.primary),
                        minHeight: 6,
                      ),
                    ),
                    const SizedBox(height: AppSpacing.xl),
                    // Heading & Explanation
                    Text(
                      l10n.whatIsSimpleEq,
                      style: const TextStyle(fontSize: 22, fontWeight: FontWeight.bold, color: AppColors.textPrimary),
                    ),
                    const SizedBox(height: AppSpacing.sm),
                    const Text(
                      'অজ্ঞাত রাশি বা চলক, প্রক্রিয়া চিহ্ন এবং সমান চিহ্ন সংবলিত গাণিতিক বাক্যকে সমীকরণ বলে। একটি সমীকরণে দুটি পক্ষ থাকে - বামপক্ষ ও ডানপক্ষ। মাঝখানে সমান (=) চিহ্ন দিয়ে বোঝানো হয় যে, দুই পক্ষের মান সমান।',
                      style: TextStyle(fontSize: 15, height: 1.6, color: AppColors.textSecondary),
                    ),
                    const SizedBox(height: AppSpacing.lg),
                    // Concept Callout Card
                    Container(
                      padding: const EdgeInsets.all(AppSpacing.md),
                      decoration: BoxDecoration(
                        color: AppColors.surface,
                        borderRadius: BorderRadius.circular(16),
                        border: const Border(left: BorderSide(color: AppColors.primary, width: 4)),
                        boxShadow: [
                          BoxShadow(
                            color: Colors.black.withAlpha(5),
                            blurRadius: 8,
                            offset: const Offset(0, 2),
                          ),
                        ],
                      ),
                      child: Row(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          const Icon(Icons.lightbulb_rounded, color: AppColors.primary, size: 24),
                          const SizedBox(width: AppSpacing.sm),
                          Expanded(
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Text(
                                  l10n.rememberBoxTitle,
                                  style: const TextStyle(fontSize: 16, fontWeight: FontWeight.bold, color: AppColors.primary),
                                ),
                                const SizedBox(height: 4),
                                const Text(
                                  'সমীকরণের একটি অন্যতম প্রধান বৈশিষ্ট্য হলো এর ভারসাম্য। সমীকরণের একপাশে যদি কিছু যোগ, বিয়োগ, গুণ বা ভাগ করা হয়, তবে অন্যপাশেও ঠিক একই কাজ করতে হবে।',
                                  style: TextStyle(fontSize: 13, height: 1.5, color: AppColors.textSecondary),
                                ),
                              ],
                            ),
                          ),
                        ],
                      ),
                    ),
                    const SizedBox(height: AppSpacing.lg),
                    // Formula Box
                    Container(
                      width: double.infinity,
                      padding: const EdgeInsets.symmetric(vertical: 20),
                      decoration: BoxDecoration(
                        color: AppColors.primary.withAlpha(20),
                        borderRadius: BorderRadius.circular(20),
                        border: Border.all(color: AppColors.primary.withAlpha(50)),
                      ),
                      alignment: Alignment.center,
                      child: const Text(
                        '2x + 5 = 15',
                        style: TextStyle(fontSize: 28, fontWeight: FontWeight.bold, color: AppColors.primary, letterSpacing: 2),
                      ),
                    ),
                    const SizedBox(height: AppSpacing.lg),
                    // Step-by-step Solution Box
                    Container(
                      padding: const EdgeInsets.all(AppSpacing.md),
                      decoration: BoxDecoration(
                        color: AppColors.surface,
                        borderRadius: BorderRadius.circular(20),
                        border: Border.all(color: AppColors.border),
                      ),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            l10n.solutionProcess,
                            style: const TextStyle(fontSize: 16, fontWeight: FontWeight.bold, color: AppColors.textPrimary),
                          ),
                          const Divider(color: AppColors.border, height: 24),
                          const Text('১ম: 2x + 5 = 15', style: TextStyle(fontSize: 15, fontWeight: FontWeight.w600)),
                          const SizedBox(height: 6),
                          const Text('২য়: 2x = 15 - 5 (পক্ষান্তর)', style: TextStyle(fontSize: 15, fontWeight: FontWeight.w600)),
                          const SizedBox(height: 6),
                          const Text('৩য়: 2x = 10', style: TextStyle(fontSize: 15, fontWeight: FontWeight.w600)),
                          const SizedBox(height: 6),
                          Row(
                            children: const [
                              Text('৪র্থ: x = 5', style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold, color: AppColors.primary)),
                              SizedBox(width: 6),
                              Icon(Icons.check_rounded, color: Colors.green, size: 20),
                            ],
                          ),
                          const SizedBox(height: AppSpacing.md),
                          Align(
                            alignment: Alignment.centerRight,
                            child: OutlinedButton.icon(
                              onPressed: () => context.go('/ai-tutor-chat'),
                              icon: const Icon(Icons.smart_toy_outlined, size: 18, color: AppColors.primary),
                              label: const Text('AI শিক্ষককে জিজ্ঞেস করো', style: TextStyle(fontSize: 13, fontWeight: FontWeight.bold, color: AppColors.primary)),
                              style: OutlinedButton.styleFrom(
                                side: const BorderSide(color: AppColors.primary),
                                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
                              ),
                            ),
                          ),
                        ],
                      ),
                    ),
                    const SizedBox(height: AppSpacing.lg),
                    // Inline Quiz Check Card
                    Container(
                      padding: const EdgeInsets.all(AppSpacing.md),
                      decoration: BoxDecoration(
                        color: AppColors.surface,
                        borderRadius: BorderRadius.circular(20),
                        border: Border.all(color: AppColors.border),
                      ),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Row(
                            children: const [
                              Icon(Icons.quiz_rounded, color: Colors.amber, size: 22),
                              SizedBox(width: 8),
                              Expanded(
                                child: Text(
                                  'তুমি কি বলতে পারো x + 3 = 7 হলে x কত?',
                                  style: TextStyle(fontSize: 15, fontWeight: FontWeight.bold, color: AppColors.textPrimary),
                                ),
                              ),
                            ],
                          ),
                          const SizedBox(height: AppSpacing.md),
                          GridView.count(
                            shrinkWrap: true,
                            physics: const NeverScrollableScrollPhysics(),
                            crossAxisCount: 2,
                            childAspectRatio: 2.5,
                            crossAxisSpacing: 10,
                            mainAxisSpacing: 10,
                            children: [3, 4, 10, -4].map((opt) {
                              final isSelected = _selectedQuizOption == opt;
                              final isCorrect = opt == 4;

                              return InkWell(
                                onTap: () => setState(() => _selectedQuizOption = opt),
                                borderRadius: BorderRadius.circular(12),
                                child: Container(
                                  alignment: Alignment.center,
                                  decoration: BoxDecoration(
                                    color: isSelected
                                        ? (isCorrect ? Colors.green.withAlpha(20) : Colors.red.withAlpha(20))
                                        : AppColors.background,
                                    borderRadius: BorderRadius.circular(12),
                                    border: Border.all(
                                      color: isSelected
                                          ? (isCorrect ? Colors.green : Colors.red)
                                          : AppColors.border,
                                      width: isSelected ? 2 : 1,
                                    ),
                                  ),
                                  child: Text(
                                    '$opt',
                                    style: TextStyle(
                                      fontSize: 16,
                                      fontWeight: FontWeight.bold,
                                      color: isSelected
                                          ? (isCorrect ? Colors.green : Colors.red)
                                          : AppColors.textPrimary,
                                    ),
                                  ),
                                ),
                              );
                            }).toList(),
                          ),
                        ],
                      ),
                    ),
                    const SizedBox(height: AppSpacing.xl),
                  ],
                ),
              ),
            ),
            // Sticky Bottom Nav (Linear Flow)
            Container(
              padding: const EdgeInsets.symmetric(horizontal: AppSpacing.md, vertical: 10),
              decoration: const BoxDecoration(
                color: AppColors.surface,
                border: Border(top: BorderSide(color: AppColors.border)),
              ),
              child: Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  TextButton.icon(
                    onPressed: () {},
                    icon: const Icon(Icons.chevron_left_rounded, color: AppColors.textSecondary),
                    label: Text(l10n.prevLesson, style: const TextStyle(color: AppColors.textSecondary)),
                  ),
                  ElevatedButton.icon(
                    onPressed: () => context.go('/chapter-details'),
                    icon: Text(l10n.nextLesson, style: const TextStyle(fontWeight: FontWeight.bold, color: Colors.white)),
                    label: const Icon(Icons.chevron_right_rounded, color: Colors.white),
                    style: ElevatedButton.styleFrom(
                      backgroundColor: AppColors.primary,
                      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
                      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 10),
                    ),
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
      floatingActionButton: FloatingActionButton(
        onPressed: () => context.go('/ai-tutor-chat'),
        backgroundColor: AppColors.primary,
        child: const Icon(Icons.smart_toy_rounded, color: Colors.white),
      ),
    );
  }
}
