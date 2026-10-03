import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../../../app/localization/l10n/app_localizations.dart';
import '../../../../app/theme/app_colors.dart';
import '../../../../app/theme/app_spacing.dart';
import '../controllers/study_plan_controller.dart';
import '../../../home/presentation/controllers/home_dashboard_controller.dart';
import '../../domain/entities/study_plan_item.dart';

class StudyCalendarPage extends ConsumerStatefulWidget {
  const StudyCalendarPage({super.key});

  @override
  ConsumerState<StudyCalendarPage> createState() => _StudyCalendarPageState();
}

class _StudyCalendarPageState extends ConsumerState<StudyCalendarPage> {
  int _selectedDay = DateTime.now().day;
  int _monthOffset = 0;

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      ref.read(studyPlanControllerProvider.notifier).loadCurrentPlan();
    });
  }

  String _getMonthName() {
    const months = [
      'জানুয়ারি',
      'ফেব্রুয়ারি',
      'মার্চ',
      'এপ্রিল',
      'মে',
      'জুন',
      'জুলাই',
      'আগস্ট',
      'সেপ্টেম্বর',
      'অক্টোবর',
      'নভেম্বর',
      'ডিসেম্বর'
    ];
    final now = DateTime.now();
    final baseMonth = now.month - 1; // 0-indexed
    final totalMonth = baseMonth + _monthOffset;
    final normalizedMonth = ((totalMonth % 12) + 12) % 12;
    final year = now.year + (totalMonth ~/ 12);
    return '${months[normalizedMonth]} $year';
  }

  List<StudyPlanItem> _getTasksForSelectedDay(List<StudyPlanItem> items) {
    return items
        .where((item) =>
            (item.title.hashCode % 31) + 1 == _selectedDay ||
            _selectedDay == DateTime.now().day)
        .toList();
  }

  bool _isDayCompleted(int day, List<StudyPlanItem> items) {
    return day < DateTime.now().day && day % 2 == 0;
  }

  @override
  Widget build(BuildContext context) {
    final l10n = AppLocalizations.of(context)!;
    final daysOfWeek = ['রবি', 'সোম', 'মঙ্গল', 'বুধ', 'বৃহঃ', 'শুক্র', 'শনি'];
    final planState = ref.watch(studyPlanControllerProvider);
    final gamificationAsync = ref.watch(gamificationSummaryFutureProvider);

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
        title: Text(
          l10n.studyCalendarTitle,
          style: const TextStyle(
              fontSize: 18,
              fontWeight: FontWeight.bold,
              color: AppColors.primary),
        ),
      ),
      body: SafeArea(
        child: planState.isLoading || planState.isGenerating
            ? const Center(child: CircularProgressIndicator())
            : planState.errorMessage != null
                ? Center(
                    child: Column(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        Text('ত্রুটি: ${planState.errorMessage}',
                            style: const TextStyle(color: Colors.red)),
                        const SizedBox(height: 16),
                        ElevatedButton(
                          onPressed: () => ref
                              .read(studyPlanControllerProvider.notifier)
                              .loadCurrentPlan(),
                          child: const Text('আবার চেষ্টা করুন'),
                        )
                      ],
                    ),
                  )
                : planState.plan == null
                    ? Center(
                        child: Column(
                          mainAxisAlignment: MainAxisAlignment.center,
                          children: [
                            const Text('কোনো স্টাডি প্ল্যান পাওয়া যায়নি'),
                            const SizedBox(height: 16),
                            ElevatedButton(
                              onPressed: () => ref
                                  .read(studyPlanControllerProvider.notifier)
                                  .generateRecommendedPlan(),
                              child: const Text('নতুন প্ল্যান তৈরি করুন'),
                            )
                          ],
                        ),
                      )
                    : SingleChildScrollView(
                        padding: const EdgeInsets.all(AppSpacing.md),
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            // Calendar Month Container
                            Container(
                              padding: const EdgeInsets.all(AppSpacing.md),
                              decoration: BoxDecoration(
                                color: AppColors.surface,
                                borderRadius: BorderRadius.circular(20),
                                border: Border.all(color: AppColors.border),
                              ),
                              child: Column(
                                children: [
                                  Row(
                                    mainAxisAlignment:
                                        MainAxisAlignment.spaceBetween,
                                    children: [
                                      IconButton(
                                        icon: const Icon(
                                            Icons.chevron_left_rounded,
                                            color: AppColors.textPrimary),
                                        onPressed: () {
                                          setState(() => _monthOffset--);
                                        },
                                      ),
                                      Text(
                                        _getMonthName(),
                                        style: const TextStyle(
                                            fontSize: 18,
                                            fontWeight: FontWeight.bold,
                                            color: AppColors.textPrimary),
                                      ),
                                      IconButton(
                                        icon: const Icon(
                                            Icons.chevron_right_rounded,
                                            color: AppColors.textPrimary),
                                        onPressed: () {
                                          setState(() => _monthOffset++);
                                        },
                                      ),
                                    ],
                                  ),
                                  const SizedBox(height: AppSpacing.sm),
                                  Row(
                                    mainAxisAlignment:
                                        MainAxisAlignment.spaceAround,
                                    children: daysOfWeek.map((day) {
                                      return SizedBox(
                                        width: 36,
                                        child: Text(
                                          day,
                                          style: const TextStyle(
                                              fontSize: 12,
                                              fontWeight: FontWeight.bold,
                                              color: AppColors.textSecondary),
                                          textAlign: TextAlign.center,
                                        ),
                                      );
                                    }).toList(),
                                  ),
                                  const SizedBox(height: AppSpacing.sm),
                                  GridView.builder(
                                    shrinkWrap: true,
                                    physics:
                                        const NeverScrollableScrollPhysics(),
                                    gridDelegate:
                                        const SliverGridDelegateWithFixedCrossAxisCount(
                                      crossAxisCount: 7,
                                      mainAxisSpacing: 8,
                                      crossAxisSpacing: 8,
                                    ),
                                    itemCount: 31, // Mocking days in month
                                    itemBuilder: (context, index) {
                                      final dayNum = index + 1;
                                      final isSelected = dayNum == _selectedDay;
                                      final isCompleted = _isDayCompleted(
                                          dayNum, planState.plan!.items);

                                      return InkWell(
                                        onTap: () => setState(
                                            () => _selectedDay = dayNum),
                                        borderRadius: BorderRadius.circular(10),
                                        child: Container(
                                          alignment: Alignment.center,
                                          decoration: BoxDecoration(
                                            color: isSelected
                                                ? AppColors.primary
                                                : (isCompleted
                                                    ? Colors.green.shade100
                                                    : AppColors.background),
                                            borderRadius:
                                                BorderRadius.circular(10),
                                            border: Border.all(
                                              color: isSelected
                                                  ? AppColors.primary
                                                  : AppColors.border,
                                            ),
                                          ),
                                          child: Column(
                                            mainAxisAlignment:
                                                MainAxisAlignment.center,
                                            children: [
                                              Text(
                                                '$dayNum',
                                                style: TextStyle(
                                                  fontSize: 13,
                                                  fontWeight: FontWeight.bold,
                                                  color: isSelected
                                                      ? Colors.white
                                                      : (isCompleted
                                                          ? Colors
                                                              .green.shade900
                                                          : AppColors
                                                              .textPrimary),
                                                ),
                                              ),
                                              if (isCompleted && !isSelected)
                                                const Icon(Icons.check_rounded,
                                                    size: 10,
                                                    color: Colors.green),
                                            ],
                                          ),
                                        ),
                                      );
                                    },
                                  ),
                                ],
                              ),
                            ),
                            const SizedBox(height: AppSpacing.lg),

                            // Streak Banner
                            gamificationAsync.when(
                              data: (summary) {
                                return Container(
                                  padding: const EdgeInsets.all(AppSpacing.md),
                                  decoration: BoxDecoration(
                                    color: AppColors.primary.withAlpha(15),
                                    borderRadius: BorderRadius.circular(16),
                                    border: Border.all(
                                        color: AppColors.primary.withAlpha(40)),
                                  ),
                                  child: Row(
                                    children: [
                                      const Icon(
                                          Icons.local_fire_department_rounded,
                                          color: Colors.deepOrange,
                                          size: 32),
                                      const SizedBox(width: AppSpacing.md),
                                      Expanded(
                                        child: Column(
                                          crossAxisAlignment:
                                              CrossAxisAlignment.start,
                                          children: [
                                            Text(
                                                '${summary.streakDays} দিন টানা পড়ালেখা!',
                                                style: const TextStyle(
                                                    fontSize: 16,
                                                    fontWeight: FontWeight.bold,
                                                    color: AppColors.primary)),
                                            const Text(
                                                'ধারাবাহিকতা বজায় রাখতে আজ অন্তত ৩০ মিনিট পড়ুন।',
                                                style: TextStyle(
                                                    fontSize: 12,
                                                    color: AppColors
                                                        .textSecondary)),
                                          ],
                                        ),
                                      ),
                                    ],
                                  ),
                                );
                              },
                              loading: () => const Center(
                                  child: CircularProgressIndicator()),
                              error: (_, __) => const SizedBox(),
                            ),
                            const SizedBox(height: AppSpacing.lg),

                            Text(
                              '$_selectedDay-র নির্ধারিত পাঠ',
                              style: const TextStyle(
                                  fontSize: 18,
                                  fontWeight: FontWeight.bold,
                                  color: AppColors.textPrimary),
                            ),
                            const SizedBox(height: AppSpacing.md),

                            Builder(builder: (context) {
                              final tasks = _getTasksForSelectedDay(
                                  planState.plan!.items);
                              if (tasks.isEmpty) {
                                return const Padding(
                                  padding: EdgeInsets.all(16.0),
                                  child: Text('এই দিনে কোনো পাঠ নেই',
                                      style: TextStyle(
                                          color: AppColors.textSecondary)),
                                );
                              }
                              return Column(
                                children: tasks.map((item) {
                                  return Padding(
                                    padding: const EdgeInsets.only(bottom: 10),
                                    child: _buildTaskCard(
                                        item.title,
                                        '${item.note} • ${item.targetMinutes} মিনিট',
                                        item.completed),
                                  );
                                }).toList(),
                              );
                            }),
                          ],
                        ),
                      ),
      ),
    );
  }

  Widget _buildTaskCard(String title, String subtitle, bool isDone) {
    return Container(
      padding: const EdgeInsets.all(AppSpacing.md),
      decoration: BoxDecoration(
        color: AppColors.surface,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: AppColors.border),
      ),
      child: Row(
        children: [
          Icon(
            isDone
                ? Icons.check_circle_rounded
                : Icons.radio_button_unchecked_rounded,
            color: isDone ? Colors.green : AppColors.textSecondary,
          ),
          const SizedBox(width: AppSpacing.md),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  title,
                  style: TextStyle(
                    fontSize: 15,
                    fontWeight: FontWeight.bold,
                    decoration: isDone ? TextDecoration.lineThrough : null,
                    color: isDone
                        ? AppColors.textSecondary
                        : AppColors.textPrimary,
                  ),
                ),
                const SizedBox(height: 2),
                Text(subtitle,
                    style: const TextStyle(
                        fontSize: 12, color: AppColors.textSecondary)),
              ],
            ),
          ),
        ],
      ),
    );
  }
}
