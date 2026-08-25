import 'package:flutter_test/flutter_test.dart';
import 'package:mobile/features/practice/domain/entities/practice_attempt_result.dart';
import 'package:mobile/features/practice/domain/entities/practice_question.dart';
import 'package:mobile/features/practice/domain/repositories/practice_repository.dart';
import 'package:mobile/features/practice/presentation/controllers/practice_controller.dart';

class FakePracticeRepository implements PracticeRepository {
  @override
  Future<List<PracticeQuestion>> listQuestions({
    required String lessonId,
    int limit = 10,
    PracticeDifficulty? difficulty,
  }) async {
    return const [
      PracticeQuestion(
        id: 'q-1',
        subjectId: 'sub-1',
        chapterId: 'chap-1',
        lessonId: 'les-1',
        questionType: PracticeQuestionType.mcq,
        prompt: 'যদি 2x + 6 = 12 হয়, তবে x = ?',
        difficulty: PracticeDifficulty.easy,
        options: ['২', '৩', '৪', '৫'],
      ),
    ];
  }

  @override
  Future<PracticeAttemptResult> submitAttempt({
    required String questionId,
    required PracticeQuestionType questionType,
    String? selectedOptionId,
    List<String>? selectedOptionIds,
    String? textAnswer,
    num? numericAnswer,
    Map<String, String>? matchingAnswer,
    int? timeSpentSeconds,
  }) async {
    return const PracticeAttemptResult(
      questionId: 'q-1',
      isCorrect: true,
      score: 100,
    );
  }
}

void main() {
  TestWidgetsFlutterBinding.ensureInitialized();

  group('PracticeController Unit Tests', () {
    late PracticeController controller;
    late FakePracticeRepository repository;

    setUp(() {
      repository = FakePracticeRepository();
      controller = PracticeController(repository);
    });

    test('Initial state is PracticeInitial', () {
      expect(controller.state, isA<PracticeInitial>());
    });

    test('startSession loads questions and enters PracticeActiveSession',
        () async {
      await controller.startSession(lessonId: 'les-1');

      expect(controller.state, isA<PracticeActiveSession>());
      final active = controller.state as PracticeActiveSession;
      expect(active.questions.length, 1);
      expect(active.currentIndex, 0);
    });

    test('selectOption and submitCurrentAnswer updates attempt result',
        () async {
      await controller.startSession(lessonId: 'les-1');
      controller.selectOption('option-1');

      var active = controller.state as PracticeActiveSession;
      expect(active.selectedOptionId, 'option-1');

      await controller.submitCurrentAnswer();

      active = controller.state as PracticeActiveSession;
      expect(active.currentResult, isNotNull);
      expect(active.currentResult!.isCorrect, isTrue);
    });

    test(
        'nextQuestion after last question transitions to PracticeSessionCompleted',
        () async {
      await controller.startSession(lessonId: 'les-1');
      controller.selectOption('option-1');
      await controller.submitCurrentAnswer();

      controller.nextQuestion();

      expect(controller.state, isA<PracticeSessionCompleted>());
      final completed = controller.state as PracticeSessionCompleted;
      expect(completed.correctCount, 1);
      expect(completed.scorePercentage, 100.0);
    });
  });
}
