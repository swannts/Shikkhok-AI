import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../../core/errors/app_failure.dart';
import '../../../../core/network/api_client.dart';
import '../../domain/entities/practice_question.dart';
import '../../domain/entities/practice_attempt_result.dart';
import '../../domain/repositories/practice_repository.dart';
import '../../data/datasources/practice_remote_data_source.dart';
import '../../data/repositories/practice_repository_impl.dart';

final practiceRemoteDataSourceProvider =
    Provider<PracticeRemoteDataSource>((ref) {
  return PracticeRemoteDataSourceImpl(apiClient);
});

final practiceRepositoryProvider = Provider<PracticeRepository>((ref) {
  final remoteDataSource = ref.watch(practiceRemoteDataSourceProvider);
  return PracticeRepositoryImpl(remoteDataSource, apiClient);
});

sealed class PracticeState {
  const PracticeState();
}

class PracticeInitial extends PracticeState {
  const PracticeInitial();
}

class PracticeLoading extends PracticeState {
  const PracticeLoading();
}

class PracticeActiveSession extends PracticeState {
  final List<PracticeQuestion> questions;
  final int currentIndex;
  final String? selectedOptionId;
  final bool isSubmitting;
  final PracticeAttemptResult? currentResult;
  final Map<int, PracticeAttemptResult> results;
  final int totalTimeSpentSeconds;

  const PracticeActiveSession({
    required this.questions,
    this.currentIndex = 0,
    this.selectedOptionId,
    this.isSubmitting = false,
    this.currentResult,
    this.results = const {},
    this.totalTimeSpentSeconds = 0,
  });

  PracticeQuestion get currentQuestion => questions[currentIndex];
  bool get isLastQuestion => currentIndex == questions.length - 1;
  int get totalQuestions => questions.length;
  int get correctCount => results.values.where((res) => res.isCorrect).length;

  PracticeActiveSession copyWith({
    List<PracticeQuestion>? questions,
    int? currentIndex,
    String? selectedOptionId,
    bool clearSelectedOption = false,
    bool? isSubmitting,
    PracticeAttemptResult? currentResult,
    bool clearCurrentResult = false,
    Map<int, PracticeAttemptResult>? results,
    int? totalTimeSpentSeconds,
  }) {
    return PracticeActiveSession(
      questions: questions ?? this.questions,
      currentIndex: currentIndex ?? this.currentIndex,
      selectedOptionId: clearSelectedOption
          ? null
          : (selectedOptionId ?? this.selectedOptionId),
      isSubmitting: isSubmitting ?? this.isSubmitting,
      currentResult:
          clearCurrentResult ? null : (currentResult ?? this.currentResult),
      results: results ?? this.results,
      totalTimeSpentSeconds:
          totalTimeSpentSeconds ?? this.totalTimeSpentSeconds,
    );
  }
}

class PracticeSessionCompleted extends PracticeState {
  final List<PracticeQuestion> questions;
  final Map<int, PracticeAttemptResult> results;
  final int totalTimeSpentSeconds;

  const PracticeSessionCompleted({
    required this.questions,
    required this.results,
    required this.totalTimeSpentSeconds,
  });

  int get correctCount => results.values.where((res) => res.isCorrect).length;
  int get totalQuestions => questions.length;
  double get scorePercentage =>
      totalQuestions > 0 ? (correctCount / totalQuestions) * 100 : 0.0;
}

class PracticeError extends PracticeState {
  final String message;
  const PracticeError(this.message);
}

class PracticeController extends StateNotifier<PracticeState> {
  final PracticeRepository _repository;

  PracticeController(this._repository) : super(const PracticeInitial());

  Future<void> startSession({
    required String lessonId,
    int limit = 10,
    PracticeDifficulty? difficulty,
  }) async {
    state = const PracticeLoading();
    try {
      final questions = await _repository.listQuestions(
        lessonId: lessonId,
        limit: limit,
        difficulty: difficulty,
      );

      if (questions.isEmpty) {
        state = const PracticeError('এই পাঠে কোনো প্রশ্ন পাওয়া যায়নি।');
        return;
      }

      state = PracticeActiveSession(questions: questions);
    } on AppFailure catch (failure) {
      state = PracticeError(failure.message);
    } catch (_) {
      state = const PracticeError('প্রশ্ন লোড করতে ব্যর্থ হয়েছে');
    }
  }

  void selectOption(String optionId) {
    final current = state;
    if (current is PracticeActiveSession && current.currentResult == null) {
      state = current.copyWith(selectedOptionId: optionId);
    }
  }

  Future<void> submitCurrentAnswer() async {
    final current = state;
    if (current is! PracticeActiveSession ||
        current.selectedOptionId == null ||
        current.isSubmitting) {
      return;
    }

    state = current.copyWith(isSubmitting: true);
    try {
      final q = current.currentQuestion;
      final result = await _repository.submitAttempt(
        questionId: q.id,
        questionType: q.questionType,
        selectedOptionId: current.selectedOptionId,
        timeSpentSeconds: 15,
      );

      final updatedResults =
          Map<int, PracticeAttemptResult>.from(current.results);
      updatedResults[current.currentIndex] = result;

      state = current.copyWith(
        isSubmitting: false,
        currentResult: result,
        results: updatedResults,
      );
    } on AppFailure catch (failure) {
      state = current.copyWith(isSubmitting: false);
    } catch (_) {
      state = current.copyWith(isSubmitting: false);
    }
  }

  void nextQuestion() {
    final current = state;
    if (current is! PracticeActiveSession) return;

    if (current.isLastQuestion) {
      state = PracticeSessionCompleted(
        questions: current.questions,
        results: current.results,
        totalTimeSpentSeconds: current.totalTimeSpentSeconds,
      );
    } else {
      state = current.copyWith(
        currentIndex: current.currentIndex + 1,
        clearSelectedOption: true,
        clearCurrentResult: true,
      );
    }
  }
}

final practiceControllerProvider =
    StateNotifierProvider<PracticeController, PracticeState>((ref) {
  final repository = ref.watch(practiceRepositoryProvider);
  return PracticeController(repository);
});
