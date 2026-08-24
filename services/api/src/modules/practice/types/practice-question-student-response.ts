import { PracticeDifficulty } from '../enums/practice-difficulty.enum';
import { PracticeQuestionType } from '../enums/practice-question-type.enum';

export interface PracticeQuestionStudentResponse {
  id: string;
  subjectId: string;
  chapterId: string;
  lessonId: string;
  questionType: PracticeQuestionType;
  prompt: string;
  difficulty: PracticeDifficulty;
  options: string[];
  tags: string[];
}
