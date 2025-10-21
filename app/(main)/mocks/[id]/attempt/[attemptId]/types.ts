export type QuestionType = "MCQ" | "MSQ" | "DESCRIPTIVE" | "NAT";

export type Question = {
  id: string;
  question: string;
  type: QuestionType;
  options: string[];
  answer: string;
  explanation?: string;
  imageUrl?: string; // Optional image URL for question
};

export type MockTest = {
  id: string;
  title: string;
  description: string;
  questions: Question[];
  difficulty: string;
  createdAt: string;
  updatedAt: string;
  duration: number;
};

export type AnswerState = Record<string, string | string[]>;