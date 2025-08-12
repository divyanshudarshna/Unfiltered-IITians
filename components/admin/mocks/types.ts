export type Question = {
  id: string;
  question: string;
  type: "MCQ" | "MSQ" | "DESCRIPTIVE";
  options: string[];
  answer: string;
  explanation?: string;
};

export type MockTestDetail = {
  id: string;
  title: string;
  questions: Question[];
};