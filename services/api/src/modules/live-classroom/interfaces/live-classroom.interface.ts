export interface Participant {
  socketId: string;
  userId: string;
  name: string;
  role: 'teacher' | 'student';
  joinedAt: Date;
}

export interface ChatMessage {
  id: string;
  senderId: string;
  senderName: string;
  senderRole: 'teacher' | 'student';
  text: string;
  timestamp: string;
}

export interface WhiteboardStroke {
  id: string;
  color: string;
  width: number;
  points: { x: number; y: number }[];
  isEraser?: boolean;
}

export interface QuizQuestion {
  id: string;
  questionText: string;
  options: string[];
  correctOptionIndex: number;
  timeLimitSeconds: number;
  startedAt: string;
}

export interface QuizSubmission {
  userId: string;
  studentName: string;
  questionId: string;
  selectedOptionIndex: number;
  submittedAt: string;
  isCorrect: boolean;
  score: number;
}
