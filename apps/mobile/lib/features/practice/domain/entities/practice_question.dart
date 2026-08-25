enum PracticeDifficulty {
  easy,
  medium,
  hard;

  static PracticeDifficulty fromString(String? value) {
    switch (value?.toLowerCase()) {
      case 'easy':
        return PracticeDifficulty.easy;
      case 'hard':
        return PracticeDifficulty.hard;
      case 'medium':
      default:
        return PracticeDifficulty.medium;
    }
  }

  String toApiString() => name;
}

enum PracticeQuestionType {
  mcq,
  trueFalse,
  shortAnswer,
  matching,
  ordering;

  static PracticeQuestionType fromString(String? value) {
    switch (value?.toLowerCase()) {
      case 'true_false':
      case 'truefalse':
        return PracticeQuestionType.trueFalse;
      case 'short_answer':
      case 'shortanswer':
        return PracticeQuestionType.shortAnswer;
      case 'matching':
        return PracticeQuestionType.matching;
      case 'ordering':
        return PracticeQuestionType.ordering;
      case 'mcq':
      default:
        return PracticeQuestionType.mcq;
    }
  }

  String toApiString() {
    switch (this) {
      case PracticeQuestionType.trueFalse:
        return 'true_false';
      case PracticeQuestionType.shortAnswer:
        return 'short_answer';
      case PracticeQuestionType.matching:
        return 'matching';
      case PracticeQuestionType.ordering:
        return 'ordering';
      case PracticeQuestionType.mcq:
        return 'mcq';
    }
  }
}

class PracticeQuestion {
  final String id;
  final String subjectId;
  final String chapterId;
  final String lessonId;
  final PracticeQuestionType questionType;
  final String prompt;
  final PracticeDifficulty difficulty;
  final List<String> options;
  final List<String> tags;

  const PracticeQuestion({
    required this.id,
    required this.subjectId,
    required this.chapterId,
    required this.lessonId,
    required this.questionType,
    required this.prompt,
    required this.difficulty,
    this.options = const [],
    this.tags = const [],
  });
}
