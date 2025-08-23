"use client";

import { useEffect, useState } from "react";
import { useParams, useSearchParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { PlusCircle, ArrowLeft, BarChart3, FileText, CheckSquare, Hash } from "lucide-react";
import QuizForm from "./QuizForm";
import QuizTable from "./QuizTable";
import { Question, QuestionType } from "./QuizForm";
import { Edit } from "lucide-react";
interface Quiz {
  id: string;
  contentId: string;
  questions: Question[];
  createdAt: string;
  updatedAt: string;
}

export default function QuizPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const router = useRouter();
  const contentId = params.contentId as string;
  const contentTitle = searchParams.get("contentTitle") || "Untitled";
  const courseId = searchParams.get("courseId") || "";

  const [quiz, setQuiz] = useState<Quiz | null>(null);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [editingQuestion, setEditingQuestion] = useState<Question | null>(null);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);

  const fetchQuiz = async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/admin/contents/${contentId}/quiz`);
      if (res.ok) {
        const data = await res.json();
        setQuiz(data);
      } else if (res.status === 404) {
        setQuiz(null);
      } else {
        throw new Error("Failed to load quiz");
      }
    } catch (err) {
      console.error(err);
      toast.error("Failed to load quiz");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchQuiz();
  }, [contentId]);

  // Calculate stats
  const stats = {
    total: quiz?.questions.length || 0,
    mcq: quiz?.questions.filter(q => q.type === "MCQ").length || 0,
    msq: quiz?.questions.filter(q => q.type === "MSQ").length || 0,
    nat: quiz?.questions.filter(q => q.type === "NAT").length || 0,
  };

  const handleSaveQuestion = async (question: Question) => {
    try {
      let updatedQuestions: Question[];
      
      if (editingIndex !== null && quiz) {
        // Update existing question
        updatedQuestions = [...quiz.questions];
        updatedQuestions[editingIndex] = question;
      } else if (quiz) {
        // Add new question to existing quiz
        updatedQuestions = [...quiz.questions, question];
      } else {
        // Create new quiz with first question
        updatedQuestions = [question];
      }

      const method = quiz ? "PUT" : "POST";
      const url = `/api/admin/contents/${contentId}/quiz`;
      
      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ questions: updatedQuestions }),
      });

      if (response.ok) {
        const updatedQuiz = await response.json();
        setQuiz(updatedQuiz);
        toast.success(editingIndex !== null ? "Question updated!" : "Question added!");
        setOpen(false);
        resetForm();
      } else {
        throw new Error("Failed to save question");
      }
    } catch (error) {
      console.error(error);
      toast.error("Failed to save question");
    }
  };

  const handleDeleteQuestion = async (index: number) => {
    if (!quiz || !confirm("Are you sure you want to delete this question?")) return;
    
    try {
      const updatedQuestions = quiz.questions.filter((_, i) => i !== index);
      
      // If no questions left, delete the entire quiz
      if (updatedQuestions.length === 0) {
        const response = await fetch(`/api/admin/contents/${contentId}/quiz`, {
          method: "DELETE",
        });

        if (response.ok) {
          setQuiz(null);
          toast.success("Quiz deleted!");
          return;
        } else {
          throw new Error("Failed to delete quiz");
        }
      }
      
      // Update quiz with remaining questions
      const response = await fetch(`/api/admin/contents/${contentId}/quiz`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ questions: updatedQuestions }),
      });

      if (response.ok) {
        const updatedQuiz = await response.json();
        setQuiz(updatedQuiz);
        toast.success("Question deleted!");
      } else {
        throw new Error("Failed to delete question");
      }
    } catch (error) {
      console.error(error);
      toast.error("Failed to delete question");
    }
  };

  const handleEditQuestion = (index: number) => {
    if (!quiz) return;
    setEditingQuestion(quiz.questions[index]);
    setEditingIndex(index);
    setOpen(true);
  };

  const resetForm = () => {
    setEditingQuestion(null);
    setEditingIndex(null);
  };
  console.log("Course ID:", courseId);

  const handleBack = () => {
    router.push(`/admin/courses/${courseId}/contents`); // Replace with actual courseId if available
  };

  return (
    <div className="space-y-6">
      {/* Header with Back Button */}
      <div className="flex items-center gap-4">
        <Button variant="outline" size="icon" onClick={handleBack} className="shrink-0">
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Quiz Management</h1>
          <p className="text-muted-foreground">
            For content: <span className="text-blue-600 font-medium">{contentTitle}</span>
          </p>
        </div>
      </div>

      {/* Stats Cards */}
      {stats.total > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-950/30 dark:to-blue-900/20">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Questions</CardTitle>
              <BarChart3 className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.total}</div>
              <p className="text-xs text-muted-foreground">All question types</p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-green-50 to-green-100 dark:from-green-950/30 dark:to-green-900/20">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">MCQ Questions</CardTitle>
              <FileText className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.mcq}</div>
              <p className="text-xs text-muted-foreground">Multiple Choice</p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-950/30 dark:to-purple-900/20">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">MSQ Questions</CardTitle>
              <CheckSquare className="h-4 w-4 text-purple-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.msq}</div>
              <p className="text-xs text-muted-foreground">Multiple Select</p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-orange-50 to-orange-100 dark:from-orange-950/30 dark:to-orange-900/20">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">NAT Questions</CardTitle>
              <Hash className="h-4 w-4 text-orange-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.nat}</div>
              <p className="text-xs text-muted-foreground">Numerical Answer</p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Action Bar */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold">Questions</h2>
          <p className="text-sm text-muted-foreground">
            Manage all questions for this content
          </p>
        </div>
        <Button onClick={() => setOpen(true)} className="gap-2">
          <PlusCircle className="h-4 w-4" />
          Add Question
        </Button>
      </div>

      {/* Questions Table */}
      {quiz && quiz.questions.length > 0 ? (
        <QuizTable 
          questions={quiz.questions} 
          onEdit={handleEditQuestion}
          onDelete={handleDeleteQuestion}
        />
      ) : (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <FileText className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium mb-2">No questions yet</h3>
            <p className="text-muted-foreground text-center mb-4">
              Get started by adding your first question to this content.
            </p>
            <Button onClick={() => setOpen(true)}>
              <PlusCircle className="h-4 w-4 mr-2" />
              Create First Question
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Add/Edit Question Dialog */}
      <Dialog open={open} onOpenChange={(isOpen) => {
        setOpen(isOpen);
        if (!isOpen) resetForm();
      }}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {editingIndex !== null ? (
                <>
                  <Edit className="h-5 w-5" />
                  Edit Question
                </>
              ) : (
                <>
                  <PlusCircle className="h-5 w-5" />
                  Add New Question
                </>
              )}
            </DialogTitle>
          </DialogHeader>
          <QuizForm
            question={editingQuestion}
            onSave={handleSaveQuestion}
            onCancel={() => {
              setOpen(false);
              resetForm();
            }}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}