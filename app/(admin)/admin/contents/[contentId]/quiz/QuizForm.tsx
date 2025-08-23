"use client";

import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Plus, Trash2 } from "lucide-react";

export type QuestionType = "MCQ" | "MSQ" | "NAT";

export interface Question {
  question: string;
  type: QuestionType;
  options: string[];
  answer: string | string[] | number;
  explanation?: string;
}

interface QuizFormProps {
  question?: Question | null;
  onSave: (q: Question) => void;
  onCancel: () => void;
}

export default function QuizForm({ question, onSave, onCancel }: QuizFormProps) {
  const [formData, setFormData] = useState<Question>({
    question: "",
    type: "MCQ",
    options: ["", "", "", ""],
    answer: "",
    explanation: "",
  });

  const [answerOption, setAnswerOption] = useState("0");
  const [msqAnswers, setMsqAnswers] = useState<string[]>([]);

  useEffect(() => {
    if (question) {
      setFormData(question);
      
      if (question.type === "MCQ" && typeof question.answer === "string") {
        const index = question.options.indexOf(question.answer);
        setAnswerOption(index >= 0 ? index.toString() : "0");
      } else if (question.type === "MSQ" && Array.isArray(question.answer)) {
        setMsqAnswers(question.answer);
      }
    } else {
      // Reset form for new question
      setFormData({
        question: "",
        type: "MCQ",
        options: ["", "", "", ""],
        answer: "",
        explanation: "",
      });
      setAnswerOption("0");
      setMsqAnswers([]);
    }
  }, [question]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    let finalAnswer: string | string[] | number = formData.answer;

    if (formData.type === "MCQ") {
      finalAnswer = formData.options[parseInt(answerOption)] || "";
    } else if (formData.type === "MSQ") {
      finalAnswer = msqAnswers;
    } else if (formData.type === "NAT") {
      finalAnswer = Number(formData.answer) || 0;
    }

    onSave({ ...formData, answer: finalAnswer });
  };

  const handleOptionChange = (index: number, value: string) => {
    const newOptions = [...formData.options];
    newOptions[index] = value;
    setFormData({ ...formData, options: newOptions });
  };

  const handleMsqAnswerToggle = (option: string) => {
    if (msqAnswers.includes(option)) {
      setMsqAnswers(msqAnswers.filter(a => a !== option));
    } else {
      setMsqAnswers([...msqAnswers, option]);
    }
  };

  const addOption = () => {
    if (formData.options.length < 6) {
      setFormData({ ...formData, options: [...formData.options, ""] });
    }
  };

  const removeOption = (index: number) => {
    if (formData.options.length > 2) {
      const newOptions = formData.options.filter((_, i) => i !== index);
      setFormData({ ...formData, options: newOptions });
      
      // Update answer selection if needed
      if (formData.type === "MCQ" && answerOption === index.toString()) {
        setAnswerOption("0");
      }
      
      // Remove from MSQ answers if needed
      if (formData.type === "MSQ") {
        const removedOption = formData.options[index];
        setMsqAnswers(msqAnswers.filter(a => a !== removedOption));
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
            onValueChange={(value) => {
              const newType = value as QuestionType;
              setFormData((prev) => ({
                ...prev,
                type: newType,
                options: newType === "NAT" ? [] : prev.options.length ? prev.options : ["", "", "", ""],
                answer: newType === "NAT" ? 0 : newType === "MSQ" ? [] : "",
              }));
              setAnswerOption("0");
              setMsqAnswers([]);
            }}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="MCQ">Multiple Choice (MCQ)</SelectItem>
              <SelectItem value="MSQ">Multiple Select (MSQ)</SelectItem>
              <SelectItem value="NAT">Numerical Answer (NAT)</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {formData.type === "MCQ" && (
          <div>
            <Label>Correct Answer</Label>
            <Select value={answerOption} onValueChange={setAnswerOption}>
              <SelectTrigger>
                <SelectValue placeholder="Select answer" />
              </SelectTrigger>
              <SelectContent>
                {formData.options.map((_, idx) => (
                  <SelectItem key={idx} value={idx.toString()}>
                    Option {String.fromCharCode(65 + idx)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}

        {formData.type === "NAT" && (
          <div>
            <Label>Answer (Number)</Label>
            <Input
              type="number"
              value={formData.answer as number}
              onChange={(e) => setFormData({ ...formData, answer: Number(e.target.value) })}
              required
            />
          </div>
        )}
      </div>

      {formData.type !== "NAT" && (
        <div>
          <Label>Options</Label>
          <div className="space-y-2">
            {formData.options.map((option, index) => (
              <div key={index} className="flex items-center gap-2">
                <span className="w-6">{String.fromCharCode(65 + index)}.</span>
                <Input
                  value={option}
                  onChange={(e) => handleOptionChange(index, e.target.value)}
                  required={index < 2}
                />
                {formData.type === "MSQ" && (
                  <Button
                    type="button"
                    variant={msqAnswers.includes(option) ? "default" : "outline"}
                    size="sm"
                    onClick={() => handleMsqAnswerToggle(option)}
                  >
                    {msqAnswers.includes(option) ? "Selected" : "Select"}
                  </Button>
                )}
                {formData.options.length > 2 && (
                  <Button type="button" variant="ghost" size="icon" onClick={() => removeOption(index)}>
                    <Trash2 className="w-4 h-4 text-red-500" />
                  </Button>
                )}
              </div>
            ))}
            {formData.options.length < 6 && formData.type !== "NAT" && (
              <Button type="button" variant="outline" size="sm" onClick={addOption}>
                <Plus className="w-4 h-4 mr-2" /> Add Option
              </Button>
            )}
          </div>
        </div>
      )}

      <div>
        <Label>Explanation (Optional)</Label>
        <Textarea
          value={formData.explanation || ""}
          onChange={(e) => setFormData({ ...formData, explanation: e.target.value })}
          className="min-h-[100px]"
        />
      </div>

      <div className="flex justify-end gap-2 pt-4">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit">
          {question ? "Update" : "Add"} Question
        </Button>
      </div>
    </form>
  );
}