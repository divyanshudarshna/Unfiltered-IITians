"use client";

import React, { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { AlertCircle, Plus, Upload, Trash2 } from "lucide-react";
import QuestionTable from "./questionTable";
import FormModal from "./formModal";
import { MockTestDetail, Question } from "./types";
import CsvUploadModal from "./CsvUploadModal";
import { toast } from "sonner";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

export default function MockDetailPage() {
  const router = useRouter();
  const { id: mockId } = useParams();

  const [mock, setMock] = useState<MockTestDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [globalFilter, setGlobalFilter] = useState("");

  // For edit modal
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [editQuestion, setEditQuestion] = useState<Question | null>(null);
  
  // For CSV upload modal
  const [isCsvUploadOpen, setIsCsvUploadOpen] = useState(false);

  // For clear all confirmation dialog
  const [isClearDialogOpen, setIsClearDialogOpen] = useState(false);
  const [isClearing, setIsClearing] = useState(false);

  // Fetch mock by id
  const fetchMock = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/mocks/${mockId}`, {
        credentials: "include",
      });
      const data = await res.json();

      if (res.ok) {
        setMock(data.mock);
        setError(null);
      } else {
        setError(data.error || "Failed to load mock");
      }
    } catch (err) {
      setError("Failed to load mock");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (mockId) fetchMock();
  }, [mockId]);

  // Handle CSV upload success
  const handleCsvUploadSuccess = () => {
    fetchMock(); // Reload the questions
  };

  // Clear all questions
  const handleClearAllQuestions = async () => {
    setIsClearing(true);
    try {
      const res = await fetch(
        `/api/admin/mocks/${mockId}/questions/clear`,
        {
          method: "DELETE",
          credentials: "include",
        }
      );
      
      if (res.ok) {
        // Update local state to remove all questions
        setMock((prev) => {
          if (!prev) return prev;
          return {
            ...prev,
            questions: [],
          };
        });
        setIsClearDialogOpen(false);
        toast.success("✅ All questions have been cleared successfully!");
      } else {
        const data = await res.json();
        toast.error(data.error || "❌ Failed to clear questions");
      }
    } catch (error) {
      toast.error("❌ Error clearing questions");
      console.error(error);
    } finally {
      setIsClearing(false);
    }
  };

  // Delete question
  const handleDeleteQuestion = async (questionId: string) => {
    if (!confirm("Are you sure you want to delete this question?")) return;

    try {
      const res = await fetch(
        `/api/admin/mocks/${mockId}/questions/${questionId}`,
        {
          method: "DELETE",
          credentials: "include",
        }
      );
      if (res.ok) {
        setMock((prev) => {
          if (!prev) return prev;
          return {
            ...prev,
            questions: prev.questions.filter((q) => q.id !== questionId),
          };
        });
        toast.success("✅ Question deleted successfully!");
      } else {
        toast.error("❌ Failed to delete question");
      }
    } catch (error) {
      toast.error("❌ Error deleting question");
      console.error(error);
    }
  };

  // Open edit modal and set current question
  const openEditModal = (question: Question) => {
    setEditQuestion(question);
    setIsEditOpen(true);
  };

  // Handle save from edit modal
  const handleSaveQuestion = async (updatedQuestion: Question) => {
    try {
      setLoading(true);
      const isNew = updatedQuestion.id.startsWith("temp-");
      const url = isNew
        ? `/api/admin/mocks/${mockId}/questions`
        : `/api/admin/mocks/${mockId}/questions/${updatedQuestion.id}`;

      const method = isNew ? "POST" : "PUT";

      // Send body according to API expectation
      const bodyData = isNew ? { question: updatedQuestion } : updatedQuestion;

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(bodyData),
      });

      const data = await res.json();

      if (res.ok) {
        setMock((prev) => {
          if (!prev) return prev;
          if (isNew) {
            // Add new question to existing questions array
            return { ...prev, questions: [...prev.questions, data.question] };
          } else {
            // Update existing question
            return {
              ...prev,
              questions: prev.questions.map((q) =>
                q.id === updatedQuestion.id ? data.question : q
              ),
            };
          }
        });
        setLoading(false);
        setIsEditOpen(false);
        
        // Success toast
        toast.success(isNew ? "✅ Question created successfully!" : "✅ Question updated successfully!");
      } else {
        setLoading(false);
        toast.error(data.error || "❌ Failed to save question");
      }
    } catch (error) {
      setLoading(false);
      console.error(error);
      toast.error("❌ Error saving question");
    }
  };

  // Add new question
  const handleAddQuestion = () => {
    const newQuestion: Question = {
      id: `temp-${Date.now()}`,
      question: "",
      type: "MCQ",
      options: ["", "", "", ""],
      answer: "",
    };
    setEditQuestion(newQuestion);
    setIsEditOpen(true);
  };

  if (loading)
    return (
      <div className="p-6 flex justify-center">
        <p className="animate-pulse">Loading mock details...</p>
      </div>
    );

  if (error)
    return (
      <div className="p-6">
        <p className="text-red-600 flex items-center">
          <AlertCircle className="w-5 h-5 mr-2" />
          {error}
        </p>
        <Button variant="outline" className="mt-4" onClick={fetchMock}>
          Retry
        </Button>
      </div>
    );

  if (!mock)
    return (
      <div className="p-6">
        <p>No mock found.</p>
        <Button
          variant="outline"
          className="mt-4"
          onClick={() => router.back()}
        >
          Go Back
        </Button>
      </div>
    );

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold">Mock: {mock.title}</h1>
          <p className="text-muted-foreground">
            ID: <span className="font-mono">{mock.id}</span>
          </p>
          {mock.questions.length > 0 && (
            <p className="text-sm text-muted-foreground mt-1">
              {mock.questions.length} question{mock.questions.length !== 1 ? 's' : ''}
            </p>
          )}
        </div>
        <div className="flex gap-2">
          {mock.questions.length > 0 && (
            <AlertDialog open={isClearDialogOpen} onOpenChange={setIsClearDialogOpen}>
              <AlertDialogTrigger asChild>
                <Button variant="outline" className="text-amber-400 hover:text-amber-800 hover:bg-red-50">
                  <Trash2 className="w-4 h-4 mr-2" />
                  Clear All
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This action cannot be undone. This will permanently delete all{" "}
                    <strong>{mock.questions.length}</strong> questions from this mock test.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel disabled={isClearing}>Cancel</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={handleClearAllQuestions}
                    disabled={isClearing}
                    className="bg-red-600 hover:bg-red-700"
                  >
                    {isClearing ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        Clearing...
                      </>
                    ) : (
                      "Clear All Questions"
                    )}
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          )}
          <Button onClick={() => setIsCsvUploadOpen(true)} variant="outline">
            <Upload className="w-4 h-4 mr-2" />
            Upload CSV
          </Button>
          <Button onClick={handleAddQuestion}>
            <Plus className="w-4 h-4 mr-2" />
            Add Question
          </Button>
        </div>
      </div>

      <QuestionTable
        questions={mock.questions}
        globalFilter={globalFilter}
        setGlobalFilter={setGlobalFilter}
        onEditQuestion={openEditModal}
        onDeleteQuestion={handleDeleteQuestion}
      />

      <FormModal
        isOpen={isEditOpen}
        onOpenChange={setIsEditOpen}
        question={editQuestion}
        onSave={handleSaveQuestion}
        onCancel={() => setIsEditOpen(false)}
      />

      <CsvUploadModal
        isOpen={isCsvUploadOpen}
        onOpenChange={setIsCsvUploadOpen}
        onUploadSuccess={handleCsvUploadSuccess}
        mockId={mockId as string}
      />
    </div>
  );
}