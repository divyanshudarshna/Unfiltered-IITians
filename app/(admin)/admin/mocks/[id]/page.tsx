"use client";

import React, { useEffect, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import {
  ColumnDef,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table";
import { useRouter, useParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import {
  Edit2,
  Trash2,
  ChevronUp,
  ChevronDown,
  Plus,
  Search,
  List,
  CheckCircle,
  Type,
  FileText,
  Hash
} from "lucide-react";

type Question = {
  id: string;
  question: string;
  type: "MCQ" | "MSQ" | "DESCRIPTIVE";
  options: string[];
  answer: string;
  explanation?: string;
};

type MockTestDetail = {
  id: string;
  title: string;
  questions: Question[];
};

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

  // Fetch mock by id
  const fetchMock = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/mocks/${mockId}`, {
        credentials: 'include'
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

  // Delete question
  const handleDeleteQuestion = async (questionId: string) => {
    if (!confirm("Are you sure you want to delete this question?")) return;

    try {
      const res = await fetch(`/api/admin/mocks/${mockId}/questions/${questionId}`, {
        method: "DELETE",
        credentials: 'include'
      });
      if (res.ok) {
        setMock((prev) => {
          if (!prev) return prev;
          return {
            ...prev,
            questions: prev.questions.filter((q) => q.id !== questionId),
          };
        });
      } else {
        alert("Failed to delete question");
      }
    } catch (err) {
      alert("Error deleting question");
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
      const res = await fetch(`/api/admin/mocks/${mockId}/questions/${updatedQuestion.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: 'include',
        body: JSON.stringify(updatedQuestion),
      });
      const data = await res.json();

      if (res.ok) {
        setMock((prev) => {
          if (!prev) return prev;
          return {
            ...prev,
            questions: prev.questions.map((q) =>
              q.id === updatedQuestion.id ? data.question : q
            ),
          };
        });
        setIsEditOpen(false);
      } else {
        alert(data.error || "Failed to update question");
      }
    } catch (err) {
      alert("Error updating question");
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

  // Get question type icon and color
  const getQuestionTypeBadge = (type: string) => {
    const typeMap: Record<string, { icon: JSX.Element; color: string }> = {
      MCQ: { icon: <List className="w-4 h-4" />, color: "bg-blue-100 text-blue-800" },
      MSQ: { icon: <CheckCircle className="w-4 h-4" />, color: "bg-purple-100 text-purple-800" },
      DESCRIPTIVE: { icon: <FileText className="w-4 h-4" />, color: "bg-green-100 text-green-800" },
    };

    const { icon, color } = typeMap[type] || { icon: <Type className="w-4 h-4" />, color: "bg-gray-100 text-gray-800" };
    
    return (
      <Badge className={`${color} flex items-center gap-1`}>
        {icon}
        {type}
      </Badge>
    );
  };

  // Columns for questions table
  const columns: ColumnDef<Question>[] = [
    {
      accessorKey: "id",
      header: "ID",
      cell: (info) => (
        <span className="text-muted-foreground font-mono text-sm">
          #{info.getValue()?.toString().slice(0, 6)}
        </span>
      ),
    },
    {
      accessorKey: "question",
      header: "Question",
      cell: (info) => (
        <span className="font-medium line-clamp-2">
          {info.getValue() as string}
        </span>
      ),
    },
    {
      accessorKey: "options",
      header: "Options",
      cell: (info) => {
        const options = info.getValue() as string[];
        return (
          <div className="space-y-1">
            {options.map((opt, i) => (
              <div key={i} className="flex items-center">
                <span className="text-muted-foreground text-xs w-6">{String.fromCharCode(65 + i)}.</span>
                <span className="text-sm">{opt || "-"}</span>
              </div>
            ))}
          </div>
        );
      },
    },
    {
      accessorKey: "type",
      header: "Type",
      cell: (info) => getQuestionTypeBadge(info.getValue() as string),
    },
    {
      accessorKey: "answer",
      header: "Correct Answer",
      cell: (info) => {
        const answer = info.getValue() as string;
        const question = info.row.original;
        const optionIndex = question.options.indexOf(answer);
        return (
          <Badge variant="outline" className="font-mono">
            {optionIndex >= 0 ? String.fromCharCode(65 + optionIndex) : answer}
          </Badge>
        );
      },
    },
    {
      id: "actions",
      header: "Actions",
      cell: ({ row }) => {
        const question = row.original;
        return (
          <div className="flex space-x-2">
            <Button
              variant="outline"
              size="sm"
              className="h-8"
              onClick={() => openEditModal(question)}
            >
              <Edit2 className="w-4 h-4 mr-1" />
              Edit
            </Button>
            <Button
              variant="destructive"
              size="sm"
              className="h-8"
              onClick={() => handleDeleteQuestion(question.id)}
            >
              <Trash2 className="w-4 h-4 mr-1" />
              Delete
            </Button>
          </div>
        );
      },
    },
  ];

  const table = useReactTable({
    data: mock?.questions ?? [],
    columns,
    state: {
      globalFilter,
    },
    onGlobalFilterChange: setGlobalFilter,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    globalFilterFn: (row, columnId, filterValue) => {
      const search = filterValue.toLowerCase();
      const question = row.getValue("question").toString().toLowerCase();
      const type = row.getValue("type").toString().toLowerCase();
      const answer = row.getValue("answer").toString().toLowerCase();
      
      return (
        question.includes(search) ||
        type.includes(search) ||
        answer.includes(search)
      );
    },
  });

  if (loading) return (
    <div className="p-6 flex justify-center">
      <p className="animate-pulse">Loading mock details...</p>
    </div>
  );

  if (error) return (
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

  if (!mock) return (
    <div className="p-6">
      <p>No mock found.</p>
      <Button variant="outline" className="mt-4" onClick={() => router.back()}>
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
        </div>
        <Button onClick={handleAddQuestion}>
          <Plus className="w-4 h-4 mr-2" />
          Add Question
        </Button>
      </div>

      <div className="flex items-center justify-between mb-4">
        <div className="relative w-full max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search questions..."
            value={globalFilter ?? ""}
            onChange={(e) => setGlobalFilter(e.target.value)}
            className="pl-10"
          />
        </div>
        <div className="text-sm text-muted-foreground">
          {table.getFilteredRowModel().rows.length} questions
        </div>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader className="bg-gray-900">
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <TableHead key={header.id}>
                    {flexRender(
                      header.column.columnDef.header,
                      header.getContext()
                    )}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow key={row.id}>
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell
                  colSpan={columns.length}
                  className="h-24 text-center"
                >
                  No questions found.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-between px-2 py-4">
        <div className="text-sm text-muted-foreground">
          Page {table.getState().pagination.pageIndex + 1} of{" "}
          {table.getPageCount()}
        </div>
        <div className="flex space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => table.previousPage()}
            disabled={!table.getCanPreviousPage()}
          >
            <ChevronLeft className="w-4 h-4 mr-1" />
            Previous
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => table.nextPage()}
            disabled={!table.getCanNextPage()}
          >
            Next
            <ChevronRight className="w-4 h-4 ml-1" />
          </Button>
        </div>
      </div>

      {/* Edit Question Modal */}
      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
          <DialogTitle>
  {editQuestion?.id?.startsWith("temp-") ? "Add New" : "Edit"} Question
</DialogTitle>
          </DialogHeader>
          {editQuestion && (
            <EditQuestionForm
              question={editQuestion}
              onSave={handleSaveQuestion}
              onCancel={() => setIsEditOpen(false)}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

// Edit Question Form component
function EditQuestionForm({
  question,
  onSave,
  onCancel,
}: {
  question: Question;
  onSave: (q: Question) => void;
  onCancel: () => void;
}) {
  const [formData, setFormData] = useState<Question>(question);
  const [answerOption, setAnswerOption] = useState(
    question.options.indexOf(question.answer).toString()
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const updatedQuestion = {
      ...formData,
      answer: formData.type === "DESCRIPTIVE" 
        ? formData.answer 
        : formData.options[parseInt(answerOption)],
    };
    onSave(updatedQuestion);
  };

  const handleOptionChange = (index: number, value: string) => {
    const newOptions = [...formData.options];
    newOptions[index] = value;
    setFormData({ ...formData, options: newOptions });
  };

  const addOption = () => {
    if (formData.options.length < 6) {
      setFormData({
        ...formData,
        options: [...formData.options, ""],
      });
    }
  };

  const removeOption = (index: number) => {
    if (formData.options.length > 2) {
      const newOptions = formData.options.filter((_, i) => i !== index);
      setFormData({ ...formData, options: newOptions });
      if (answerOption === index.toString()) {
        setAnswerOption("0");
      }
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <Label htmlFor="question">Question Text</Label>
        <Textarea
          id="question"
          value={formData.question}
          onChange={(e) => setFormData({ ...formData, question: e.target.value })}
          required
          className="min-h-[100px]"
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="type">Question Type</Label>
          <Select
            value={formData.type}
            onValueChange={(value) => setFormData({ 
              ...formData, 
              type: value as "MCQ" | "MSQ" | "DESCRIPTIVE" 
            })}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="MCQ">Multiple Choice (MCQ)</SelectItem>
              <SelectItem value="MSQ">Multiple Select (MSQ)</SelectItem>
              <SelectItem value="DESCRIPTIVE">Descriptive</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {formData.type !== "DESCRIPTIVE" && (
          <div>
            <Label htmlFor="answer">Correct Answer</Label>
            <Select
              value={answerOption}
              onValueChange={setAnswerOption}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select answer" />
              </SelectTrigger>
              <SelectContent>
                {formData.options.map((_, index) => (
                  <SelectItem 
                    key={index} 
                    value={index.toString()}
                    disabled={!formData.options[index]}
                  >
                    Option {String.fromCharCode(65 + index)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}
      </div>

      {formData.type !== "DESCRIPTIVE" && (
        <div>
          <Label>Options</Label>
          <div className="space-y-2">
            {formData.options.map((option, index) => (
              <div key={index} className="flex items-center gap-2">
                <span className="text-muted-foreground w-6">
                  {String.fromCharCode(65 + index)}.
                </span>
                <Input
                  value={option}
                  onChange={(e) => handleOptionChange(index, e.target.value)}
                  required={index < 2}
                />
                {formData.options.length > 2 && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => removeOption(index)}
                  >
                    <Trash2 className="w-4 h-4 text-red-500" />
                  </Button>
                )}
              </div>
            ))}
            {formData.options.length < 6 && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={addOption}
              >
                <Plus className="w-4 h-4 mr-2" />
                Add Option
              </Button>
            )}
          </div>
        </div>
      )}

      {formData.type === "DESCRIPTIVE" && (
        <div>
          <Label htmlFor="answer">Expected Answer</Label>
          <Textarea
            id="answer"
            value={formData.answer}
            onChange={(e) => setFormData({ ...formData, answer: e.target.value })}
            required
            className="min-h-[100px]"
          />
        </div>
      )}

      <div>
        <Label htmlFor="explanation">Explanation (Optional)</Label>
        <Textarea
          id="explanation"
          value={formData.explanation || ""}
          onChange={(e) => setFormData({ ...formData, explanation: e.target.value })}
          className="min-h-[100px]"
        />
      </div>

      <div className="flex justify-end gap-2 pt-4">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit">Save Question</Button>
      </div>
    </form>
  );
}