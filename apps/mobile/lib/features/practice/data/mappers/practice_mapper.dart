import '../../domain/entities/practice_question.dart';
import '../../domain/entities/practice_attempt_result.dart';
import '../dto/practice_question_dto.dart';

class PracticeMapper {
  static PracticeQuestion toDomainQuestion(PracticeQuestionDto dto) {
    return PracticeQuestion(
      id: dto.id,
      subjectId: dto.subjectId,
      chapterId: dto.chapterId,
      lessonId: dto.lessonId,
      questionType: PracticeQuestionType.fromString(dto.questionType),
      prompt: dto.prompt,
      difficulty: PracticeDifficulty.fromString(dto.difficulty),
      options: dto.options,
      tags: dto.tags,
    );
  }

  static PracticeAttemptResult toDomainAttemptResult(
      PracticeAttemptResultDto dto) {
    return PracticeAttemptResult(
      questionId: dto.questionId,
      isCorrect: dto.isCorrect,
      score: dto.score,
      partialScore: dto.partialScore,
      feedback: dto.feedback,
      explanation: dto.explanation,
      correctAnswer: dto.correctAnswer,
      timeSpentSeconds: dto.timeSpentSeconds,
    );
  }
}
