export interface Lecture {
  id: string;
  title: string;
  summary?: string;
  videoUrl?: string;
  pdfUrl?: string;
  order: number;
  duration?: number;
  completed?: boolean;
}

export interface Content {
  id: string;
  title: string;
  order: number;
  lectures: Lecture[];
  hasQuiz: boolean;
  quizId: string | null;
  quizCompleted?: boolean;
}

export interface CourseResponse {
  id: string;
  title: string;
  description: string;
  contents: Content[];
  progress?: number;
}
