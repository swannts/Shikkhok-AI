import 'package:flutter_test/flutter_test.dart';
import 'package:mobile/features/curriculum/data/dto/study_plan_dto.dart';
import 'package:mobile/features/curriculum/data/mappers/study_plan_mapper.dart';

void main() {
  group('StudyPlanMapper', () {
    test('maps backend payload to domain entity', () {
      final dto = StudyPlanDto.fromJson({
        '_id': 'plan-1',
        'title': 'সাপ্তাহিক অধ্যয়ন পরিকল্পনা',
        'description': 'গণিত ও বিজ্ঞানে দুর্বলতা কমানোর লক্ষ্য',
        'status': 'active',
        'classLevel': 8,
        'medium': 'bangla',
        'curriculumYear': 2026,
        'weeklyTargetMinutes': 420,
        'dailyTargetMinutes': 60,
        'focusSubjectIds': ['sub-1'],
        'items': [
          {
            'title': 'গণিত অনুশীলন',
            'subjectId': 'sub-1',
            'targetMinutes': 30,
            'note': 'ভিত্তি শক্ত করো',
            'completed': true,
          },
        ],
        'startsAt': '2026-08-24T00:00:00.000Z',
        'endsAt': '2026-08-31T00:00:00.000Z',
        'createdAt': '2026-08-24T10:00:00.000Z',
        'updatedAt': '2026-08-24T10:00:00.000Z',
      });

      final plan = StudyPlanMapper.toDomain(dto);

      expect(plan.id, 'plan-1');
      expect(plan.title, 'সাপ্তাহিক অধ্যয়ন পরিকল্পনা');
      expect(plan.items, hasLength(1));
      expect(plan.items.first.completed, isTrue);
      expect(plan.completedMinutes, 30);
      expect(plan.progressValue, 0.5);
    });
  });
}
