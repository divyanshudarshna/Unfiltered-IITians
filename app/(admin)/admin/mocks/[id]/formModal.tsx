"use client";

import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Trash2, Plus } from "lucide-react";
import { Question } from "./types";

interface FormModalProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  question: Question | null;
  onSave: (question: Question) => void;
  onCancel: () => void;
}

export default function FormModal({
  isOpen,
  onOpenChange,
  question,
  onSave,
  onCancel,
}: FormModalProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>
            {question?.id?.startsWith("temp-") ? "Add New" : "Edit"} Question
          </DialogTitle>
        </DialogHeader>
        {question && (
          <EditQuestionForm
            question={question}
            onSave={onSave}
            onCancel={onCancel}
          />
        )}
      </DialogContent>
    </Dialog>
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
  const [formData, setFormData] = useState<Question>({...question});
  const [msqAnswers, setMsqAnswers] = useState<string[]>([]);

  // Initialize form data based on question type
  useEffect(() => {
    if (question.type === "MSQ" && question.answer) {
      setMsqAnswers(question.answer.split(';').filter(opt => opt.trim()));
    } else if (question.type === "MCQ" && question.answer) {
      // Find the index of the correct answer in options
      const correctIndex = question.options.findIndex(
        opt => opt === question.answer
      );
      if (correctIndex !== -1) {
        setFormData(prev => ({...prev, answer: correctIndex.toString()}));
      }
    }
  }, [question]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    let finalAnswer = "";
    
    if (formData.type === "MCQ") {
      // For MCQ, store the option value, not the index
      const answerIndex = parseInt(formData.answer);
      finalAnswer = formData.options[answerIndex] || "";
    } else if (formData.type === "MSQ") {
      // For MSQ, join selected options with semicolons
      finalAnswer = msqAnswers.join(';');
    } else {
      // For NAT and DESCRIPTIVE, use the answer as is
      finalAnswer = formData.answer;
    }
    
    const updatedQuestion: Question = {
      ...formData,
      answer: finalAnswer
    };
    
    onSave(updatedQuestion);
  };

  const handleOptionChange = (index: number, value: string) => {
    const newOptions = [...formData.options];
    newOptions[index] = value;
    setFormData({ ...formData, options: newOptions });
  };

  const handleMsqAnswerToggle = (optionValue: string) => {
    if (msqAnswers.includes(optionValue)) {
      setMsqAnswers(msqAnswers.filter(opt => opt !== optionValue));
    } else {
      setMsqAnswers([...msqAnswers, optionValue]);
    }
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
      const removedOption = formData.options[index];
      
      setFormData({ ...formData, options: newOptions });
      
      // Remove from MSQ answers if it was selected
      if (formData.type === "MSQ" && msqAnswers.includes(removedOption)) {
        setMsqAnswers(msqAnswers.filter(opt => opt !== removedOption));
      }
    }
  };

  // Handle type change with proper state reset
  const handleTypeChange = (newType: "MCQ" | "MSQ" | "DESCRIPTIVE" | "NAT") => {
    if (newType === "DESCRIPTIVE" || newType === "NAT") {
      // Reset options for descriptive or NAT types
      setFormData({
        ...formData,
        type: newType,
        options: [],
        answer: newType === "NAT" ? "" : formData.answer,
      });
      setMsqAnswers([]);
    } else {
      // For MCQ/MSQ, ensure we have at least 2 options
      setFormData({
        ...formData,
        type: newType,
        options: formData.options.length >= 2 ? formData.options : ["", ""],
        answer: newType === "MCQ" ? "" : formData.answer,
      });
      
      if (newType === "MCQ") {
        setMsqAnswers([]);
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
          onChange={(e) =>
            setFormData({ ...formData, question: e.target.value })
          }
          required
          className="min-h-[100px]"
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="type">Question Type</Label>
          <Select
            value={formData.type}
            onValueChange={(value) => {
              handleTypeChange(value as "MCQ" | "MSQ" | "DESCRIPTIVE" | "NAT");
            }}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="MCQ">Multiple Choice (MCQ)</SelectItem>
              <SelectItem value="MSQ">Multiple Select (MSQ)</SelectItem>
              <SelectItem value="NAT">Numerical Answer (NAT)</SelectItem>
              <SelectItem value="DESCRIPTIVE">Descriptive</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {formData.type === "MCQ" && (
          <div>
            <Label htmlFor="answer">Correct Answer</Label>
            <Select 
              value={formData.answer} 
              onValueChange={(value) => setFormData({ ...formData, answer: value })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select answer" />
              </SelectTrigger>
              <SelectContent>
                {formData.options.map((option, index) => (
                  <SelectItem
                    key={index}
                    value={index.toString()}
                    disabled={!option.trim()}
                  >
                    {String.fromCharCode(65 + index)}. {option}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}
      </div>

      {(formData.type === "MCQ" || formData.type === "MSQ") && (
        <div>
          <Label>Options</Label>
          <div className="space-y-2">
            {formData.options.map((option, index) => (
              <div key={index} className="flex items-center gap-2">
                {formData.type === "MSQ" && (
                  <Checkbox
                    checked={msqAnswers.includes(option)}
                    onCheckedChange={() => handleMsqAnswerToggle(option)}
                    disabled={!option.trim()}
                  />
                )}
                <span className="text-muted-foreground w-6">
                  {String.fromCharCode(65 + index)}.
                </span>
                <Input
                  value={option}
                  onChange={(e) => handleOptionChange(index, e.target.value)}
                  required={index < 2}
                  placeholder={`Option ${String.fromCharCode(65 + index)}`}
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
          
          {formData.type === "MSQ" && msqAnswers.length > 0 && (
            <div className="mt-2 p-3 bg-muted rounded-md">
              <p className="text-sm font-medium">Selected Answers:</p>
              <p className="text-sm text-muted-foreground">
                {msqAnswers.join('; ')}
              </p>
            </div>
          )}
        </div>
      )}

      {formData.type === "NAT" && (
        <div>
          <Label htmlFor="nat-answer">Numerical Answer</Label>
          <Input
            id="nat-answer"
            type="number"
            step="any"
            value={formData.answer}
            onChange={(e) =>
              setFormData({ ...formData, answer: e.target.value })
            }
            required
            placeholder="Enter a numerical value"
          />
          <p className="text-xs text-muted-foreground mt-1">
            Enter the numerical answer (integer or decimal)
          </p>
        </div>
      )}

      {formData.type === "DESCRIPTIVE" && (
        <div>
          <Label htmlFor="answer">Expected Answer</Label>
          <Textarea
            id="answer"
            value={formData.answer}
            onChange={(e) =>
              setFormData({ ...formData, answer: e.target.value })
            }
            required
            className="min-h-[100px]"
            placeholder="Enter the expected answer"
          />
        </div>
      )}

      <div>
        <Label htmlFor="explanation">Explanation (Optional)</Label>
        <Textarea
          id="explanation"
          value={formData.explanation || ""}
          onChange={(e) =>
            setFormData({ ...formData, explanation: e.target.value })
          }
          className="min-h-[100px]"
          placeholder="Add explanation for the answer"
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