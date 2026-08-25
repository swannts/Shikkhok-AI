import 'package:flutter_test/flutter_test.dart';
import 'package:mobile/features/exam/domain/entities/exam_model.dart';
import 'package:mobile/features/exam/domain/entities/exam_session.dart';
import 'package:mobile/features/exam/domain/entities/exam_result.dart';
import 'package:mobile/features/exam/domain/repositories/exam_repository.dart';
import 'package:mobile/features/exam/presentation/controllers/exam_controller.dart';

class FakeExamRepository implements ExamRepository {
  @override
  Future<List<ExamModel>> listExams(
      {int? classLevel, String? subjectId}) async {
    return const [
      ExamModel(
        id: 'exam-1',
        title: '৮ম শ্রেণি গণিত মডেল টেস্ট ১',
        subjectId: 'sub-1',
        classLevel: 8,
      ),
    ];
  }

  @override
  Future<ExamModel> getExam(String examId) async {
    return const ExamModel(
      id: 'exam-1',
      title: '৮ম শ্রেণি গণিত মডেল টেস্ট ১',
      subjectId: 'sub-1',
      classLevel: 8,
    );
  }

  @override
  Future<ExamSession> startSession(String examId) async {
    return ExamSession(
      id: 'sess-1',
      examId: examId,
      title: 'গণিত মডেল টেস্ট',
      startedAt: DateTime.now(),
      expiresAt: DateTime.now().add(const Duration(minutes: 30)),
      questions: const [
        ExamSessionQuestion(
          id: 'q-1',
          prompt: '2x + 6 = 12 হলে x = ?',
          options: ['২', '৩', '৪', '৫'],
        ),
      ],
    );
  }

  @override
  Future<ExamSession> getSession(String sessionId) async {
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
  Future<ExamResult> submitSession(String sessionId) async {
    return const ExamResult(
      sessionId: 'sess-1',
      examId: 'exam-1',
      title: 'গণিত মডেল টেস্ট',
      score: 45,
      totalMarks: 50,
      percentage: 90,
      isPassed: true,
    );
  }

  @override
  Future<ExamResult> getSessionResult(String sessionId) async {
    return submitSession(sessionId);
  }
}

void main() {
  TestWidgetsFlutterBinding.ensureInitialized();

  group('ExamSessionController Unit Tests', () {
    late ExamSessionController controller;
    late FakeExamRepository repository;

    setUp(() {
      repository = FakeExamRepository();
      controller = ExamSessionController(repository);
    });

    test('Initial state is ExamSessionInitial', () {
      expect(controller.state, isA<ExamSessionInitial>());
    });

    test('startExam transitions to ExamSessionActive', () async {
      await controller.startExam('exam-1');

      expect(controller.state, isA<ExamSessionActive>());
      final active = controller.state as ExamSessionActive;
      expect(active.session.questions.length, 1);
    });

    test('selectAnswer and toggleFlag update active session questions',
        () async {
      await controller.startExam('exam-1');
      await controller.selectAnswer('option-1');
      await controller.toggleFlag();

      final active = controller.state as ExamSessionActive;
      expect(active.currentQuestion.selectedOptionId, 'option-1');
      expect(active.currentQuestion.isFlagged, isTrue);
    });

    test('submitExam transitions state to ExamSessionSubmitted', () async {
      await controller.startExam('exam-1');
      await controller.submitExam();

      expect(controller.state, isA<ExamSessionSubmitted>());
      final submitted = controller.state as ExamSessionSubmitted;
      expect(submitted.result.isPassed, isTrue);
      expect(submitted.result.score, 45);
    });
  });
}
