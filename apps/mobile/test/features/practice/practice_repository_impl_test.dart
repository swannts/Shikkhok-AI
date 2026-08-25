import 'package:flutter_test/flutter_test.dart';
import 'package:mobile/core/network/api_client.dart';
import 'package:mobile/features/practice/data/datasources/practice_remote_data_source.dart';
import 'package:mobile/features/practice/data/dto/practice_question_dto.dart';
import 'package:mobile/features/practice/data/repositories/practice_repository_impl.dart';
import 'package:mobile/features/practice/domain/entities/practice_question.dart';

class MockPracticeRemoteDataSource implements PracticeRemoteDataSource {
  @override
  Future<List<PracticeQuestionDto>> listQuestions({
    required String lessonId,
    int limit = 10,
    String? difficulty,
  }) async {
    return const [
      PracticeQuestionDto(
        id: 'q-1',
        subjectId: 'sub-1',
        chapterId: 'chap-1',
        lessonId: 'les-1',
        questionType: 'mcq',
        prompt: 'যদি 2x + 6 = 12 হয়, তবে x = ?',
        difficulty: 'easy',
        options: ['২', '৩', '৪', '৫'],
      ),
    ];
  }

  @override
  Future<PracticeAttemptResultDto> submitAttempt({
    required String questionId,
    required String questionType,
    String? selectedOptionId,
    List<String>? selectedOptionIds,
    String? textAnswer,
    num? numericAnswer,
    Map<String, String>? matchingAnswer,
    int? timeSpentSeconds,
  }) async {
    return const PracticeAttemptResultDto(
      questionId: 'q-1',
      isCorrect: true,
      score: 100,
      feedback: 'চমৎকার!',
      explanation: '2x = 6 => x = 3',
    );
  }
}

void main() {
  TestWidgetsFlutterBinding.ensureInitialized();

  group('PracticeRepositoryImpl Unit Tests', () {
    late PracticeRepositoryImpl repository;
    late MockPracticeRemoteDataSource mockDataSource;
    late ApiClient apiClient;

    setUp(() {
      mockDataSource = MockPracticeRemoteDataSource();
      apiClient = ApiClient();
      repository = PracticeRepositoryImpl(mockDataSource, apiClient);
    });

    test('listQuestions returns mapped PracticeQuestion domain entities',
        () async {
      final questions = await repository.listQuestions(lessonId: 'les-1');

      expect(questions.length, 1);
      expect(questions.first.prompt, contains('2x + 6 = 12'));
      expect(questions.first.difficulty, PracticeDifficulty.easy);
      expect(questions.first.options, ['২', '৩', '৪', '৫']);
    });

    test('submitAttempt returns mapped PracticeAttemptResult', () async {
      final result = await repository.submitAttempt(
        questionId: 'q-1',
        questionType: PracticeQuestionType.mcq,
        selectedOptionId: 'option-1',
      );

      expect(result.questionId, 'q-1');
      expect(result.isCorrect, isTrue);
      expect(result.score, 100);
      expect(result.feedback, 'চমৎকার!');
    });
  });
}
