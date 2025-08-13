"use client";

import React from "react";
import { Button } from "@/components/ui/button";
import { Edit2, Trash2 } from "lucide-react";

type Question = { id: string; question: string; type: string; options: string[]; answer: string; explanation?: string };

export default function QuestionActions({ question, mockId, refreshMock, setEditQuestion }: { question: Question; mockId: string; refreshMock: () => void; setEditQuestion: (q: Question) => void }) {

  const handleDelete = async () => {
    if (!confirm("Delete this question?")) return;
    const res = await fetch(`/api/admin/mocks/${mockId}/questions/${question.id}`, { method: "DELETE", credentials: 'include' });
    if (res.ok) refreshMock();
  };

  const handleEdit = () => setEditQuestion(question);

  return (
    <div className="flex gap-2">
      <Button variant="outline" size="sm" onClick={handleEdit}><Edit2 className="w-4 h-4 mr-1" />Edit</Button>
      <Button variant="destructive" size="sm" onClick={handleDelete}><Trash2 className="w-4 h-4 mr-1" />Delete</Button>
    </div>
  );
}
