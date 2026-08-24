export interface TableData {
  title?: string;
  headers: string[];
  rows: Record<string, any>[];
}

export interface Question {
  id: number;
  question: string;
  options: string[];
  correctAnswer: number;   // 0-based index
  context?: string;
  table?: TableData | null;
  note?: string;
}

export interface QuizMeta {
  title: string;
  course: string;
  totalQuestions: number;
  passMark: number;
}

export interface QuizData {
  meta: QuizMeta;
  questions: Question[];
}

export type QuizState = "idle" | "running" | "done";

export interface QuizSettings {
  shuffleQuestions: boolean;
  timeLimitPerQuestion: number; // in seconds, 0 means no limit
  enableLocalStorage: boolean;
  instantFeedback: boolean;
}

