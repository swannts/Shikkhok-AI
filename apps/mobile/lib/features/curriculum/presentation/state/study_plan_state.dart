import '../../domain/entities/study_plan.dart';

class StudyPlanState {
  final StudyPlan? plan;
  final bool isLoading;
  final bool isGenerating;
  final String? errorMessage;

  const StudyPlanState({
    required this.plan,
    required this.isLoading,
    required this.isGenerating,
    required this.errorMessage,
  });

  const StudyPlanState.initial()
      : plan = null,
        isLoading = true,
        isGenerating = false,
        errorMessage = null;

  StudyPlanState copyWith({
    StudyPlan? plan,
    bool? isLoading,
    bool? isGenerating,
    String? errorMessage,
  }) {
    return StudyPlanState(
      plan: plan ?? this.plan,
      isLoading: isLoading ?? this.isLoading,
      isGenerating: isGenerating ?? this.isGenerating,
      errorMessage: errorMessage,
    );
  }
}
