import '../entities/exam_model.dart';
import '../entities/exam_session.dart';
import '../entities/exam_result.dart';

abstract class ExamRepository {
  Future<List<ExamModel>> listExams({
    int? classLevel,
    String? subjectId,
  });

  Future<ExamModel> getExam(String examId);

  Future<ExamSession> startSession(String examId);

  Future<ExamSession> getSession(String sessionId);

  Future<void> saveAnswer({
    required String sessionId,
    required String questionId,
    String? selectedOptionId,
    List<String>? selectedOptionIds,
    String? textAnswer,
  });

  Future<void> flagQuestion({
    required String sessionId,
    required String questionId,
    required bool isFlagged,
  });

  Future<ExamResult> submitSession(String sessionId);

  Future<ExamResult> getSessionResult(String sessionId);
}
