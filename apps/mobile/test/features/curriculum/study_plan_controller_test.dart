import 'package:flutter_test/flutter_test.dart';
import 'package:mobile/features/curriculum/domain/entities/study_plan.dart';
import 'package:mobile/features/curriculum/domain/entities/study_plan_item.dart';
import 'package:mobile/features/curriculum/domain/repositories/study_plan_repository.dart';
import 'package:mobile/features/curriculum/presentation/controllers/study_plan_controller.dart';
import 'package:mobile/features/curriculum/presentation/state/study_plan_state.dart';

class FakeStudyPlanRepository implements StudyPlanRepository {
  FakeStudyPlanRepository(this.plan);

  StudyPlan plan;

  @override
  Future<StudyPlan> getCurrentPlan() async => plan;

  @override
  Future<StudyPlan> generateRecommendedPlan() async => plan;
}

StudyPlan buildPlan({required bool completed}) {
  return StudyPlan(
    id: 'plan-1',
    title: 'সাপ্তাহিক অধ্যয়ন পরিকল্পনা',
    description: 'গণিত ও বিজ্ঞানে দুর্বলতা কমানোর লক্ষ্য',
    status: 'active',
    classLevel: 8,
    medium: 'bangla',
    curriculumYear: 2026,
    weeklyTargetMinutes: 420,
    dailyTargetMinutes: 60,
    focusSubjectIds: const ['sub-1'],
    focusChapterIds: const [],
    focusLessonIds: const [],
    items: [
      StudyPlanItem(
        title: 'গণিত অনুশীলন',
        subjectId: 'sub-1',
        chapterId: null,
        lessonId: null,
        targetMinutes: 30,
        note: 'ভিত্তি শক্ত করো',
        completed: completed,
      ),
    ],
    startsAt: DateTime.parse('2026-08-24T00:00:00.000Z'),
    endsAt: DateTime.parse('2026-08-31T00:00:00.000Z'),
    completedAt: null,
    createdAt: DateTime.parse('2026-08-24T10:00:00.000Z'),
    updatedAt: DateTime.parse('2026-08-24T10:00:00.000Z'),
  );
}

void main() {
  group('StudyPlanController', () {
    test('loads the current plan', () async {
      final controller = StudyPlanController(
        FakeStudyPlanRepository(buildPlan(completed: false)),
      );

      await controller.loadCurrentPlan();

      expect(controller.state, isA<StudyPlanState>());
      expect(controller.state.plan?.title, 'সাপ্তাহিক অধ্যয়ন পরিকল্পনা');
      expect(controller.state.isLoading, isFalse);
      expect(controller.state.errorMessage, isNull);
    });

    test('generates and replaces the current plan', () async {
      final controller = StudyPlanController(
        FakeStudyPlanRepository(buildPlan(completed: true)),
      );

      await controller.generateRecommendedPlan();

      expect(controller.state.plan?.completedCount, 1);
      expect(controller.state.isGenerating, isFalse);
    });
  });
}
