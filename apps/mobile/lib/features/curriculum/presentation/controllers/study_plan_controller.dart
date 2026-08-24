import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../../core/errors/app_failure.dart';
import '../../../../core/network/api_client.dart';
import '../../data/repositories/study_plan_repository_impl.dart';
import '../../domain/repositories/study_plan_repository.dart';
import '../state/study_plan_state.dart';

final studyPlanApiClientProvider = Provider<ApiClient>((ref) => apiClient);

final studyPlanRepositoryProvider = Provider<StudyPlanRepository>((ref) {
  return StudyPlanRepositoryImpl(ref.read(studyPlanApiClientProvider));
});

final studyPlanControllerProvider =
    StateNotifierProvider<StudyPlanController, StudyPlanState>((ref) {
  return StudyPlanController(ref.read(studyPlanRepositoryProvider));
});

class StudyPlanController extends StateNotifier<StudyPlanState> {
  final StudyPlanRepository _repository;

  StudyPlanController(this._repository) : super(const StudyPlanState.initial());

  Future<void> loadCurrentPlan() async {
    state = state.copyWith(isLoading: true, errorMessage: null);
    try {
      final plan = await _repository.getCurrentPlan();
      state = state.copyWith(
        plan: plan,
        isLoading: false,
        errorMessage: null,
      );
    } on AppFailure catch (e) {
      state = state.copyWith(isLoading: false, errorMessage: e.banglaMessage);
    } catch (e) {
      state = state.copyWith(isLoading: false, errorMessage: e.toString());
    }
  }

  Future<void> refresh() async {
    await loadCurrentPlan();
  }

  Future<void> generateRecommendedPlan() async {
    state = state.copyWith(isGenerating: true, errorMessage: null);
    try {
      final plan = await _repository.generateRecommendedPlan();
      state = state.copyWith(
        plan: plan,
        isLoading: false,
        isGenerating: false,
        errorMessage: null,
      );
    } on AppFailure catch (e) {
      state = state.copyWith(isGenerating: false, errorMessage: e.banglaMessage);
    } catch (e) {
      state = state.copyWith(isGenerating: false, errorMessage: e.toString());
    }
  }
}
