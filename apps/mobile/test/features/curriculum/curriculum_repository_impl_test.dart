import 'package:flutter_test/flutter_test.dart';
import 'package:mobile/core/network/api_client.dart';
import 'package:mobile/features/curriculum/data/datasources/curriculum_remote_data_source.dart';
import 'package:mobile/features/curriculum/data/dto/subject_dto.dart';
import 'package:mobile/features/curriculum/data/dto/chapter_dto.dart';
import 'package:mobile/features/curriculum/data/dto/lesson_dto.dart';
import 'package:mobile/features/curriculum/data/dto/progress_summary_dto.dart';
import 'package:mobile/features/curriculum/data/repositories/curriculum_repository_impl.dart';

class MockCurriculumRemoteDataSource implements CurriculumRemoteDataSource {
  @override
  Future<List<SubjectDto>> listSubjects({
    required int classLevel,
    required String medium,
    required int curriculumYear,
  }) async {
    return const [
      SubjectDto(
        id: 'sub-1',
        name: 'গণিত',
        slug: 'math',
        classLevel: 8,
        medium: 'bangla',
      ),
      SubjectDto(
        id: 'sub-2',
        name: 'বিজ্ঞান',
        slug: 'science',
        classLevel: 8,
        medium: 'bangla',
      ),
    ];
  }

  @override
  Future<SubjectDto> getSubject(String subjectId) async {
    return const SubjectDto(
      id: 'sub-1',
      name: 'গণিত',
      slug: 'math',
      classLevel: 8,
      medium: 'bangla',
    );
  }

  @override
  Future<List<ChapterDto>> listChapters(String subjectId) async {
    return const [
      ChapterDto(
        id: 'chap-1',
        subjectId: 'sub-1',
        title: 'প্যাটার্ন',
        slug: 'pattern',
      ),
    ];
  }

  @override
  Future<ChapterDto> getChapter(String chapterId) async {
    return const ChapterDto(
      id: 'chap-1',
      subjectId: 'sub-1',
      title: 'প্যাটার্ন',
      slug: 'pattern',
    );
  }

  @override
  Future<List<LessonDto>> listLessons(String chapterId) async {
    return const [
      LessonDto(
        id: 'les-1',
        chapterId: 'chap-1',
        title: 'সংখ্যা প্যাটার্ন ও সূত্র',
        slug: 'number-patterns',
      ),
    ];
  }

  @override
  Future<LessonDto> getLesson(String lessonId) async {
    return const LessonDto(
      id: 'les-1',
      chapterId: 'chap-1',
      title: 'সংখ্যা প্যাটার্ন ও সূত্র',
      slug: 'number-patterns',
    );
  }

  @override
  Future<ProgressSummaryDto> getMyProgressSummary() async {
    return const ProgressSummaryDto(
      totalLessonsCompleted: 14,
      totalPracticeSessions: 22,
      averageScore: 85.5,
      streakDays: 5,
      totalMinutesStudied: 120,
    );
  }

  @override
  Future<void> updateLessonProgress({
    required String lessonId,
    required bool completed,
    int? timeSpentSeconds,
  }) async {}
}

void main() {
  TestWidgetsFlutterBinding.ensureInitialized();

  group('CurriculumRepositoryImpl Unit Tests', () {
    late CurriculumRepositoryImpl repository;
    late MockCurriculumRemoteDataSource mockDataSource;
    late ApiClient apiClient;

    setUp(() {
      mockDataSource = MockCurriculumRemoteDataSource();
      apiClient = ApiClient();
      repository = CurriculumRepositoryImpl(mockDataSource, apiClient);
    });

    test('listSubjects returns mapped Subject domain entities', () async {
      final subjects = await repository.listSubjects(
        classLevel: 8,
        medium: 'bangla',
        curriculumYear: 2026,
      );

      expect(subjects.length, 2);
      expect(subjects[0].name, 'গণিত');
      expect(subjects[1].slug, 'science');
    });

    test('listChapters and listLessons return correctly mapped entities',
        () async {
      final chapters = await repository.listChapters('sub-1');
      expect(chapters.first.title, 'প্যাটার্ন');

      final lessons = await repository.listLessons('chap-1');
      expect(lessons.first.title, 'সংখ্যা প্যাটার্ন ও সূত্র');
    });

    test('getMyProgressSummary returns mapped ProgressSummary', () async {
      final progress = await repository.getMyProgressSummary();
      expect(progress.totalLessonsCompleted, 14);
      expect(progress.streakDays, 5);
      expect(progress.totalMinutesStudied, 120);
    });
  });
}
