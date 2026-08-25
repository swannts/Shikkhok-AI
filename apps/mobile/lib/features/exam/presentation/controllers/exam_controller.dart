import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../../core/errors/app_failure.dart';
import '../../../../core/network/api_client.dart';
import '../../domain/entities/exam_model.dart';
import '../../domain/entities/exam_session.dart';
import '../../domain/entities/exam_result.dart';
import '../../domain/repositories/exam_repository.dart';
import '../../data/datasources/exam_remote_data_source.dart';
import '../../data/repositories/exam_repository_impl.dart';

final examRemoteDataSourceProvider = Provider<ExamRemoteDataSource>((ref) {
  return ExamRemoteDataSourceImpl(apiClient);
});

final examRepositoryProvider = Provider<ExamRepository>((ref) {
  final remoteDataSource = ref.watch(examRemoteDataSourceProvider);
  return ExamRepositoryImpl(remoteDataSource, apiClient);
});

// Exam Library State
sealed class ExamLibraryState {
  const ExamLibraryState();
}

class ExamLibraryInitial extends ExamLibraryState {
  const ExamLibraryInitial();
}

class ExamLibraryLoading extends ExamLibraryState {
  const ExamLibraryLoading();
}

class ExamLibraryLoaded extends ExamLibraryState {
  final List<ExamModel> exams;
  const ExamLibraryLoaded(this.exams);
}

class ExamLibraryError extends ExamLibraryState {
  final String message;
  const ExamLibraryError(this.message);
}

class ExamLibraryController extends StateNotifier<ExamLibraryState> {
  final ExamRepository _repository;

  ExamLibraryController(this._repository) : super(const ExamLibraryInitial());

  Future<void> loadExams({int? classLevel, String? subjectId}) async {
    state = const ExamLibraryLoading();
    try {
      final exams = await _repository.listExams(
        classLevel: classLevel,
        subjectId: subjectId,
      );
      state = ExamLibraryLoaded(exams);
    } on AppFailure catch (failure) {
      state = ExamLibraryError(failure.message);
    } catch (_) {
      state = const ExamLibraryError('পরীক্ষার তালিকা লোড করা যায়নি');
    }
  }
}

final examLibraryControllerProvider =
    StateNotifierProvider<ExamLibraryController, ExamLibraryState>((ref) {
  final repository = ref.watch(examRepositoryProvider);
  return ExamLibraryController(repository);
});

// Exam Session Controller
sealed class ExamSessionState {
  const ExamSessionState();
}

class ExamSessionInitial extends ExamSessionState {
  const ExamSessionInitial();
}

class ExamSessionLoading extends ExamSessionState {
  const ExamSessionLoading();
}

class ExamSessionActive extends ExamSessionState {
  final ExamSession session;
  final int currentQuestionIndex;
  final bool isSubmitting;

  const ExamSessionActive({
    required this.session,
    this.currentQuestionIndex = 0,
    this.isSubmitting = false,
  });

  ExamSessionQuestion get currentQuestion =>
      session.questions[currentQuestionIndex];
  bool get isLastQuestion =>
      currentQuestionIndex == session.questions.length - 1;
  int get totalQuestions => session.questions.length;

  ExamSessionActive copyWith({
    ExamSession? session,
    int? currentQuestionIndex,
    bool? isSubmitting,
  }) {
    return ExamSessionActive(
      session: session ?? this.session,
      currentQuestionIndex: currentQuestionIndex ?? this.currentQuestionIndex,
      isSubmitting: isSubmitting ?? this.isSubmitting,
    );
  }
}

class ExamSessionSubmitted extends ExamSessionState {
  final ExamResult result;
  const ExamSessionSubmitted(this.result);
}

class ExamSessionError extends ExamSessionState {
  final String message;
  const ExamSessionError(this.message);
}

class ExamSessionController extends StateNotifier<ExamSessionState> {
  final ExamRepository _repository;

  ExamSessionController(this._repository) : super(const ExamSessionInitial());

  Future<void> startExam(String examId) async {
    state = const ExamSessionLoading();
    try {
      final session = await _repository.startSession(examId);
      state = ExamSessionActive(session: session);
    } on AppFailure catch (failure) {
      state = ExamSessionError(failure.message);
    } catch (_) {
      state = const ExamSessionError('পরীক্ষা শুরু করা যায়নি');
    }
  }

  Future<void> selectAnswer(String optionId) async {
    final current = state;
    if (current is! ExamSessionActive) return;

    final q = current.currentQuestion;
    final updatedQuestion = q.copyWith(selectedOptionId: optionId);
    final updatedQuestions =
        List<ExamSessionQuestion>.from(current.session.questions);
    updatedQuestions[current.currentQuestionIndex] = updatedQuestion;

    final updatedSession = ExamSession(
      id: current.session.id,
      examId: current.session.examId,
      title: current.session.title,
      durationMinutes: current.session.durationMinutes,
      startedAt: current.session.startedAt,
      expiresAt: current.session.expiresAt,
      questions: updatedQuestions,
      status: current.session.status,
    );

    state = current.copyWith(session: updatedSession);

    // Save to backend
    try {
      await _repository.saveAnswer(
        sessionId: current.session.id,
        questionId: q.id,
        selectedOptionId: optionId,
      );
    } catch (_) {}
  }

  Future<void> toggleFlag() async {
    final current = state;
    if (current is! ExamSessionActive) return;

    final q = current.currentQuestion;
    final newFlag = !q.isFlagged;
    final updatedQuestion = q.copyWith(isFlagged: newFlag);
    final updatedQuestions =
        List<ExamSessionQuestion>.from(current.session.questions);
    updatedQuestions[current.currentQuestionIndex] = updatedQuestion;

    final updatedSession = ExamSession(
      id: current.session.id,
      examId: current.session.examId,
      title: current.session.title,
      durationMinutes: current.session.durationMinutes,
      startedAt: current.session.startedAt,
      expiresAt: current.session.expiresAt,
      questions: updatedQuestions,
      status: current.session.status,
    );

    state = current.copyWith(session: updatedSession);

    try {
      await _repository.flagQuestion(
        sessionId: current.session.id,
        questionId: q.id,
        isFlagged: newFlag,
      );
    } catch (_) {}
  }

  void goToQuestion(int index) {
    final current = state;
    if (current is ExamSessionActive &&
        index >= 0 &&
        index < current.session.questions.length) {
      state = current.copyWith(currentQuestionIndex: index);
    }
  }

  void nextQuestion() {
    final current = state;
    if (current is ExamSessionActive && !current.isLastQuestion) {
      state = current.copyWith(
          currentQuestionIndex: current.currentQuestionIndex + 1);
    }
  }

  void previousQuestion() {
    final current = state;
    if (current is ExamSessionActive && current.currentQuestionIndex > 0) {
      state = current.copyWith(
          currentQuestionIndex: current.currentQuestionIndex - 1);
    }
  }

  Future<void> submitExam() async {
    final current = state;
    if (current is! ExamSessionActive || current.isSubmitting) return;

    state = current.copyWith(isSubmitting: true);
    try {
      final result = await _repository.submitSession(current.session.id);
      state = ExamSessionSubmitted(result);
    } on AppFailure catch (failure) {
      state = ExamSessionError(failure.message);
    } catch (_) {
      state = const ExamSessionError('পরীক্ষা জমা দেওয়া যায়নি');
    }
  }
}

final examSessionControllerProvider =
    StateNotifierProvider<ExamSessionController, ExamSessionState>((ref) {
  final repository = ref.watch(examRepositoryProvider);
  return ExamSessionController(repository);
});
