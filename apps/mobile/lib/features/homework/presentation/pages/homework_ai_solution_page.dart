import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../../../app/router/app_routes.dart';
import '../../../../app/theme/app_colors.dart';
import '../../../../app/theme/app_spacing.dart';
import '../controllers/homework_controller.dart';

class HomeworkAiSolutionPage extends ConsumerStatefulWidget {
  final String? submissionId;

  const HomeworkAiSolutionPage({super.key, this.submissionId});

  @override
  ConsumerState<HomeworkAiSolutionPage> createState() =>
      _HomeworkAiSolutionPageState();
}

class _HomeworkAiSolutionPageState
    extends ConsumerState<HomeworkAiSolutionPage> {
  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      final id = widget.submissionId;
      if (id != null && id.isNotEmpty) {
        ref.read(homeworkControllerProvider.notifier).loadFeedback(id);
      }
    });
  }

  @override
  Widget build(BuildContext context) {
    final state = ref.watch(homeworkControllerProvider);
    return Scaffold(
      backgroundColor: AppColors.background,
      appBar: AppBar(
        backgroundColor: AppColors.surface,
        elevation: 0.5,
        leading: IconButton(
          icon: const Icon(Icons.arrow_back_rounded),
          onPressed: () => AppRoutes.back(
            context,
            fallbackLocation: AppRoutes.capturedHomeworkReview,
          ),
        ),
        title: const Text(
          'হোমওয়ার্ক ব্যাখ্যা',
          style: TextStyle(
            fontSize: 18,
            fontWeight: FontWeight.bold,
            color: AppColors.primary,
          ),
        ),
      ),
      body: SafeArea(child: _buildBody(state)),
    );
  }

  Widget _buildBody(HomeworkState state) {
    if (widget.submissionId == null || widget.submissionId!.isEmpty) {
      return _message(
        icon: Icons.assignment_outlined,
        title: 'কোনো জমা পাওয়া যায়নি',
        detail: 'আগে একটি হোমওয়ার্ক জমা দিলে তার ব্যাখ্যা এখানে দেখা যাবে।',
        action: FilledButton(
          onPressed: () => context.go(AppRoutes.homeworkHelpLanding),
          child: const Text('হোমওয়ার্কে ফিরে যাও'),
        ),
      );
    }

    if (state is HomeworkLoading || state is HomeworkInitial) {
      return const Center(child: CircularProgressIndicator());
    }

    if (state is HomeworkError) {
      return _message(
        icon: Icons.cloud_off_outlined,
        title: 'ব্যাখ্যা পাওয়া যায়নি',
        detail: state.message,
        action: FilledButton.icon(
          onPressed: () => ref
              .read(homeworkControllerProvider.notifier)
              .loadFeedback(widget.submissionId!),
          icon: const Icon(Icons.refresh),
          label: const Text('আবার চেষ্টা করো'),
        ),
      );
    }

    if (state is! HomeworkFeedbackLoaded) {
      return _message(
        icon: Icons.info_outline,
        title: 'ব্যাখ্যা প্রস্তুত নয়',
        detail: 'জমার অবস্থা যাচাই করে আবার চেষ্টা করো।',
        action: TextButton(
          onPressed: () => ref
              .read(homeworkControllerProvider.notifier)
              .loadFeedback(widget.submissionId!),
          child: const Text('রিফ্রেশ'),
        ),
      );
    }

    final feedback = state.feedback;
    return ListView(
      padding: const EdgeInsets.all(AppSpacing.md),
      children: [
        if (feedback.retrievalUnavailable)
          const _GroundingNotice(
            text: 'এই মুহূর্তে পাঠ্যবইয়ের উৎস যাচাই করা যাচ্ছে না।',
          )
        else if (!feedback.grounded)
          const _GroundingNotice(
            text: 'এই ব্যাখ্যায় যাচাইকৃত পাঠ্যবইয়ের উদ্ধৃতি নেই।',
          ),
        _section(
          title: 'মূল্যায়নের সারাংশ',
          child: Text(feedback.summary),
        ),
        if (feedback.steps.isNotEmpty) ...[
          const SizedBox(height: AppSpacing.md),
          _section(
            title: 'ধাপে ধাপে ব্যাখ্যা',
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: feedback.steps
                  .map(
                    (step) => Padding(
                      padding: const EdgeInsets.only(bottom: AppSpacing.md),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text('ধাপ ${step.stepNumber}: ${step.title}',
                              style:
                                  const TextStyle(fontWeight: FontWeight.w700)),
                          if (step.suggestedStepText?.isNotEmpty == true)
                            Padding(
                              padding: const EdgeInsets.only(top: 4),
                              child: Text(step.suggestedStepText!),
                            ),
                          if (step.explanation.isNotEmpty)
                            Padding(
                              padding: const EdgeInsets.only(top: 4),
                              child: Text(step.explanation),
                            ),
                        ],
                      ),
                    ),
                  )
                  .toList(),
            ),
          ),
        ],
        if (feedback.recommendations.isNotEmpty) ...[
          const SizedBox(height: AppSpacing.md),
          _section(
            title: 'পরের ধাপ',
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: feedback.recommendations
                  .map((item) => Padding(
                        padding: const EdgeInsets.only(bottom: 6),
                        child: Text('• $item'),
                      ))
                  .toList(),
            ),
          ),
        ],
        if (feedback.citations.isNotEmpty) ...[
          const SizedBox(height: AppSpacing.md),
          _section(
            title: 'ব্যবহৃত পাঠ্যবইয়ের উৎস',
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children:
                  feedback.citations.map((item) => Text('• $item')).toList(),
            ),
          ),
        ],
      ],
    );
  }

  Widget _section({required String title, required Widget child}) => Container(
        padding: const EdgeInsets.all(AppSpacing.md),
        decoration: BoxDecoration(
          color: AppColors.surface,
          borderRadius: BorderRadius.circular(16),
          border: Border.all(color: AppColors.border),
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(title,
                style:
                    const TextStyle(fontSize: 17, fontWeight: FontWeight.w700)),
            const SizedBox(height: AppSpacing.sm),
            child,
          ],
        ),
      );

  Widget _message({
    required IconData icon,
    required String title,
    required String detail,
    required Widget action,
  }) =>
      Center(
        child: Padding(
          padding: const EdgeInsets.all(AppSpacing.lg),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              Icon(icon, size: 44, color: AppColors.textSecondary),
              const SizedBox(height: AppSpacing.md),
              Text(title,
                  style: const TextStyle(
                      fontSize: 18, fontWeight: FontWeight.bold)),
              const SizedBox(height: AppSpacing.xs),
              Text(detail,
                  textAlign: TextAlign.center,
                  style: TextStyle(color: AppColors.textSecondary)),
              const SizedBox(height: AppSpacing.md),
              action,
            ],
          ),
        ),
      );
}

class _GroundingNotice extends StatelessWidget {
  final String text;

  const _GroundingNotice({required this.text});

  @override
  Widget build(BuildContext context) => Container(
        margin: const EdgeInsets.only(bottom: AppSpacing.md),
        padding: const EdgeInsets.all(AppSpacing.md),
        decoration: BoxDecoration(
          color: const Color(0xFFFFF6DB),
          borderRadius: BorderRadius.circular(12),
          border: Border.all(color: const Color(0xFFFFD56A)),
        ),
        child: Text(text),
      );
}
