// In your types.ts file
export interface Question {
  id: string;
  question: string;
  type: 'MCQ' | 'MSQ' | 'DESCRIPTIVE' | 'NAT';
  options?: string[];
  answer: string | string[]; // Update this to accept both string and string array
  explanation?: string;
  imageUrl?: string; // Optional image URL for question
}

export type MockTestDetail = {
  id: string;
  title: string;
  questions: Question[];
};