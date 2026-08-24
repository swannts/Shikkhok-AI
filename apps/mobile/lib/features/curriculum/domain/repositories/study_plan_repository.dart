import '../entities/study_plan.dart';

abstract interface class StudyPlanRepository {
  Future<StudyPlan> getCurrentPlan();

  Future<StudyPlan> generateRecommendedPlan();
}
