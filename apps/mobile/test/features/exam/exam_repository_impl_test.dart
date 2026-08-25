import 'package:flutter_test/flutter_test.dart';
import 'package:mobile/core/network/api_client.dart';
import 'package:mobile/features/exam/data/datasources/exam_remote_data_source.dart';
import 'package:mobile/features/exam/data/dto/exam_dto.dart';
import 'package:mobile/features/exam/data/repositories/exam_repository_impl.dart';

class MockExamRemoteDataSource implements ExamRemoteDataSource {
  @override
  Future<List<ExamDto>> listExams({int? classLevel, String? subjectId}) async {
    return const [
      ExamDto(
        id: 'exam-1',
        title: '৮ম শ্রেণি গণিত মডেল টেস্ট ১',
        subjectId: 'sub-1',
        classLevel: 8,
        durationMinutes: 30,
        totalMarks: 50,
      ),
    ];
  }

  @override
  Future<ExamDto> getExam(String examId) async {
    return const ExamDto(
      id: 'exam-1',
      title: '৮ম শ্রেণি গণিত মডেল টেস্ট ১',
      subjectId: 'sub-1',
      classLevel: 8,
    );
  }

  @override
  Future<ExamSessionDto> startSession(String examId) async {
    return ExamSessionDto(
      id: 'sess-1',
      examId: examId,
      title: 'গণিত মডেল টেস্ট',
      startedAt: DateTime.now().toIso8601String(),
      expiresAt:
          DateTime.now().add(const Duration(minutes: 30)).toIso8601String(),
      questions: const [
        ExamSessionQuestionDto(
          id: 'q-1',
          prompt: '2x + 6 = 12 হলে x = ?',
          options: ['২', '৩', '৪', '৫'],
        ),
      ],
    );
  }

  @override
  Future<ExamSessionDto> getSession(String sessionId) async {
    return startSession('exam-1');
  }

  @override
  Future<void> saveAnswer({
    required String sessionId,
    required String questionId,
    String? selectedOptionId,
    List<String>? selectedOptionIds,
    String? textAnswer,
  }) async {}

  @override
  Future<void> flagQuestion({
    required String sessionId,
    required String questionId,
    required bool isFlagged,
  }) async {}

  @override
  Future<ExamResultDto> submitSession(String sessionId) async {
    return const ExamResultDto(
      sessionId: 'sess-1',
      examId: 'exam-1',
      title: 'গণিত মডেল টেস্ট',
      score: 45,
      totalMarks: 50,
      percentage: 90,
      isPassed: true,
      totalQuestions: 25,
      correctAnswers: 23,
    );
  }

  @override
  Future<ExamResultDto> getSessionResult(String sessionId) async {
    return submitSession(sessionId);
  }
}

void main() {
  TestWidgetsFlutterBinding.ensureInitialized();

  group('ExamRepositoryImpl Unit Tests', () {
    late ExamRepositoryImpl repository;
    late MockExamRemoteDataSource mockDataSource;
    late ApiClient apiClient;

    setUp(() {
      mockDataSource = MockExamRemoteDataSource();
      apiClient = ApiClient();
      repository = ExamRepositoryImpl(mockDataSource, apiClient);
    });

    test('listExams returns mapped ExamModel list', () async {
      final exams = await repository.listExams(classLevel: 8);

      expect(exams.length, 1);
      expect(exams.first.title, contains('গণিত মডেল টেস্ট'));
      expect(exams.first.classLevel, 8);
    });

    test('startSession returns mapped active ExamSession', () async {
      final session = await repository.startSession('exam-1');

      expect(session.id, 'sess-1');
      expect(session.questions.length, 1);
      expect(session.questions.first.prompt, contains('2x + 6 = 12'));
    });

    test('submitSession returns mapped final ExamResult', () async {
      final result = await repository.submitSession('sess-1');

      expect(result.sessionId, 'sess-1');
      expect(result.score, 45);
      expect(result.isPassed, isTrue);
    });
  });
}
