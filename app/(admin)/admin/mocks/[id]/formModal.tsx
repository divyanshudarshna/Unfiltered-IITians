"use client";

import React, { useState, useEffect } from "react";
import Image from "next/image";
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
import { Trash2, Plus, X, ImageIcon } from "lucide-react";
import { Question } from "./types";
import { toast } from "sonner";

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
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader className="flex-shrink-0">
          <DialogTitle>
            {question?.id?.startsWith("temp-") ? "Add New" : "Edit"} Question
          </DialogTitle>
        </DialogHeader>
        <div className="flex-1 overflow-y-auto pr-2">
          {question && (
            <EditQuestionForm
              question={question}
              onSave={onSave}
              onCancel={onCancel}
            />
          )}
        </div>
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
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  // Reset and initialize form data when question changes
  useEffect(() => {
    setFormData({...question});
    setMsqAnswers([]);
    
    if (question.type === "MSQ" && question.answer) {
      setMsqAnswers(question.answer.split(';').filter(opt => opt.trim()));
    } else if (question.type === "MCQ" && question.answer) {
      // Find the index of the correct answer in options
      const correctIndex = question.options?.findIndex(
        opt => opt === question.answer
      ) ?? -1;
      if (correctIndex !== -1) {
        setFormData(prev => ({...prev, answer: correctIndex.toString()}));
      }
    }
  }, [question]);

  // Handle image upload
  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast.error('Please select an image file');
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image size should be less than 5MB');
      return;
    }

    setIsUploading(true);
    setUploadProgress(0);

    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Upload failed');
      }

      const result = await response.json();
      
      setFormData(prev => ({
        ...prev,
        imageUrl: result.url
      }));

      toast.success('Image uploaded successfully!');
    } catch (error) {
      console.error('Upload error:', error);
      toast.error('Failed to upload image');
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
    }
  };

  // Remove uploaded image
  const removeImage = () => {
    setFormData(prev => ({
      ...prev,
      imageUrl: "" // Set to empty string instead of deleting
    }));
    toast.info('Image removed');
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    let finalAnswer: string | string[] = "";
    
    if (formData.type === "MCQ") {
      // For MCQ, store the option value, not the index
      const currentAnswer = Array.isArray(formData.answer) ? "" : formData.answer;
      const answerIndex = parseInt(currentAnswer);
      finalAnswer = formData.options?.[answerIndex] || "";
    } else if (formData.type === "MSQ") {
      // For MSQ, join selected options with semicolons
      finalAnswer = msqAnswers.join(';');
    } else {
      // For NAT and DESCRIPTIVE, use the answer as is
      finalAnswer = Array.isArray(formData.answer) ? formData.answer.join(';') : formData.answer;
    }
    
    const updatedQuestion: Question = {
      ...formData,
      answer: finalAnswer,
      options: formData.options || []
    };
    
    // Handle imageUrl properly - if it's empty, set to undefined
    if (!formData.imageUrl || formData.imageUrl.trim() === "") {
      updatedQuestion.imageUrl = undefined;
    }
    
    onSave(updatedQuestion);
  };

  const handleOptionChange = (index: number, value: string) => {
    const currentOptions = [...(formData.options || [])];
    currentOptions[index] = value;
    setFormData({ ...formData, options: currentOptions });
  };

  const handleMsqAnswerToggle = (optionValue: string) => {
    if (msqAnswers.includes(optionValue)) {
      setMsqAnswers(msqAnswers.filter(opt => opt !== optionValue));
    } else {
      setMsqAnswers([...msqAnswers, optionValue]);
    }
  };

  const addOption = () => {
    const currentOptions = formData.options || [];
    if (currentOptions.length < 6) {
      setFormData({
        ...formData,
        options: [...currentOptions, ""],
      });
    }
  };

  const removeOption = (index: number) => {
    const currentOptions = formData.options || [];
    if (currentOptions.length > 2) {
      const newOptions = currentOptions.filter((_, i) => i !== index);
      const removedOption = currentOptions[index];
      
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
      const currentOptions = formData.options || [];
      setFormData({
        ...formData,
        type: newType,
        options: currentOptions.length >= 2 ? currentOptions : ["", ""],
        answer: newType === "MCQ" ? "" : (Array.isArray(formData.answer) ? formData.answer.join(';') : formData.answer),
      });
      
      if (newType === "MCQ") {
        setMsqAnswers([]);
      }
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 pb-4">
      <div>
        <Label htmlFor="question">Question Text</Label>
        <Textarea
          id="question"
          value={formData.question}
          onChange={(e) =>
            setFormData({ ...formData, question: e.target.value })
          }
          required
          className="min-h-[80px] sm:min-h-[100px] resize-y"
        />
      </div>

      {/* Image Upload Section */}
      <div>
        <Label htmlFor="image">Question Image (Optional)</Label>
        <div className="mt-2 space-y-3">
          {formData.imageUrl && formData.imageUrl.trim() !== "" ? (
            <div className="relative">
              <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-3 bg-gray-50 dark:bg-gray-800">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Image Preview
                  </span>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={removeImage}
                    className="text-red-500 hover:text-red-700"
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
                <div className="relative">
                  <Image
                    src={formData.imageUrl}
                    alt="Question"
                    width={400}
                    height={256}
                    className="max-w-full h-auto max-h-64 object-contain rounded-md border border-gray-200"
                  />
                </div>
              </div>
            </div>
          ) : (
            <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-6">
              <div className="text-center">
                <ImageIcon className="mx-auto h-12 w-12 text-gray-400" />
                <div className="mt-4">
                  <label
                    htmlFor="image-upload"
                    className="cursor-pointer rounded-md bg-white dark:bg-gray-800 font-medium text-purple-600 focus-within:outline-none focus-within:ring-2 focus-within:ring-purple-500 focus-within:ring-offset-2 hover:text-purple-500"
                  >
                    <span>Upload an image</span>
                    <input
                      id="image-upload"
                      name="image-upload"
                      type="file"
                      className="sr-only"
                      accept="image/*"
                      onChange={handleImageUpload}
                      disabled={isUploading}
                    />
                  </label>
                  <p className="pl-1 text-sm text-gray-500">or drag and drop</p>
                </div>
                <p className="text-xs text-gray-500 mt-2">
                  PNG, JPG, GIF up to 5MB
                </p>
              </div>
            </div>
          )}
          
          {isUploading && (
            <div className="mt-2">
              <div className="flex items-center space-x-2">
                <div className="flex-1 bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                  <div
                    className="bg-purple-600 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${uploadProgress}%` }}
                  />
                </div>
                <span className="text-sm text-gray-500">Uploading...</span>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
              value={Array.isArray(formData.answer) ? "" : formData.answer} 
              onValueChange={(value) => setFormData({ ...formData, answer: value })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select answer" />
              </SelectTrigger>
              <SelectContent>
                {formData.options?.map((option, index) => (
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
            {formData.options?.map((option, index) => (
              <div key={index} className="flex flex-col sm:flex-row items-start sm:items-center gap-2">
                <div className="flex items-center gap-2 min-w-0 flex-1">
                  {formData.type === "MSQ" && (
                    <Checkbox
                      checked={msqAnswers.includes(option)}
                      onCheckedChange={() => handleMsqAnswerToggle(option)}
                      disabled={!option.trim()}
                      className="flex-shrink-0"
                    />
                  )}
                  <span className="text-muted-foreground w-6 flex-shrink-0">
                    {String.fromCharCode(65 + index)}.
                  </span>
                  <Input
                    value={option}
                    onChange={(e) => handleOptionChange(index, e.target.value)}
                    required={index < 2}
                    placeholder={`Option ${String.fromCharCode(65 + index)}`}
                    className="flex-1 min-w-0"
                  />
                </div>
                {formData.options && formData.options.length > 2 && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => removeOption(index)}
                    className="flex-shrink-0"
                  >
                    <Trash2 className="w-4 h-4 text-red-500" />
                  </Button>
                )}
              </div>
            ))}
            {(formData.options?.length ?? 0) < 6 && (
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
            value={Array.isArray(formData.answer) ? "" : formData.answer}
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
            value={Array.isArray(formData.answer) ? formData.answer.join('\n') : formData.answer}
            onChange={(e) =>
              setFormData({ ...formData, answer: e.target.value })
            }
            required
            className="min-h-[80px] sm:min-h-[100px] resize-y"
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
          className="min-h-[80px] sm:min-h-[100px] resize-y"
          placeholder="Add explanation for the answer"
        />
      </div>

      <div className="flex flex-col sm:flex-row justify-end gap-2 pt-4 sticky bottom-0 bg-background border-t mt-6">
        <Button type="button" variant="outline" onClick={onCancel} className="order-2 sm:order-1">
          Cancel
        </Button>
        <Button type="submit" className="order-1 sm:order-2">Save Question</Button>
      </div>
    </form>
  );
}