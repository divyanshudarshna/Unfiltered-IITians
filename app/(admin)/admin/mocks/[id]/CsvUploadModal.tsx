"use client";

import React, { useState, useRef } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { 
  Upload, 
  FileText, 
  AlertCircle, 
  CheckCircle, 
  Download,
  HelpCircle,
  Loader2
} from "lucide-react";
import { Question } from "./types";

interface CsvUploadModalProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onUploadSuccess: () => void;
  mockId: string;
}

interface CsvValidationResult {
  isValid: boolean;
  questions: Question[];
  errors: string[];
}

export default function CsvUploadModal({
  isOpen,
  onOpenChange,
  onUploadSuccess,
  mockId,
}: CsvUploadModalProps) {
  const [file, setFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [validationResult, setValidationResult] = useState<CsvValidationResult | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Proper CSV parser that handles quoted fields with commas
  const parseCSV = (text: string): string[][] => {
    const rows: string[][] = [];
    let currentRow: string[] = [];
    let currentField = "";
    let inQuotes = false;
    let escapeNext = false;

    for (let i = 0; i < text.length; i++) {
      const char = text[i];

      if (escapeNext) {
        currentField += char;
        escapeNext = false;
        continue;
      }

      if (char === '\\') {
        escapeNext = true;
        continue;
      }

      if (char === '"') {
        inQuotes = !inQuotes;
        continue;
      }

      if (char === ',' && !inQuotes) {
        currentRow.push(currentField.trim());
        currentField = "";
        continue;
      }

      if (char === '\n' && !inQuotes) {
        currentRow.push(currentField.trim());
        rows.push(currentRow);
        currentRow = [];
        currentField = "";
        continue;
      }

      if (char === '\r') {
        continue; // Ignore carriage returns
      }

      currentField += char;
    }

    // Add the last field and row
    if (currentField.length > 0) {
      currentRow.push(currentField.trim());
    }
    if (currentRow.length > 0) {
      rows.push(currentRow);
    }

    return rows;
  };

  const validateCsv = (csvText: string): CsvValidationResult => {
    const rows = parseCSV(csvText);
    const errors: string[] = [];
    const questions: Question[] = [];

    if (rows.length < 2) {
      errors.push("CSV must have at least a header row and one data row");
      return { isValid: false, questions: [], errors };
    }

    const headers = rows[0].map(h => h.trim().toLowerCase());
    const requiredHeaders = ['question', 'type', 'answer'];
    
    // Check required headers
    for (const requiredHeader of requiredHeaders) {
      if (!headers.includes(requiredHeader)) {
        errors.push(`Missing required header: ${requiredHeader}`);
      }
    }

    if (errors.length > 0) {
      return { isValid: false, questions: [], errors };
    }

    // Process each row
    for (let i = 1; i < rows.length; i++) {
      const row = rows[i];
      const rowData: Record<string, string> = {};
      
      headers.forEach((header, index) => {
        rowData[header] = (index < row.length) ? row[index] : '';
      });

      // Clean quotes from all fields
      Object.keys(rowData).forEach(key => {
        if (rowData[key]) {
          rowData[key] = rowData[key].replace(/^"|"$/g, '');
        }
      });

      // Validate question type
      const validTypes = ['MCQ', 'MSQ', 'DESCRIPTIVE', 'NAT'];
      if (!validTypes.includes(rowData.type)) {
        errors.push(`Row ${i + 1}: Invalid question type '${rowData.type}'. Must be one of: ${validTypes.join(', ')}`);
        continue;
      }

      // Parse options
      let options: string[] = [];
      if (rowData.type === 'MCQ' || rowData.type === 'MSQ') {
        if (rowData.options) {
          // Split by semicolon and clean each option
          options = rowData.options.split(';').map(opt => opt.trim()).filter(opt => opt);
        }
        
        if (options.length < 2) {
          errors.push(`Row ${i + 1}: MCQ/MSQ questions require at least 2 options`);
          continue;
        }
      }

      // Validate answer based on type
      if (!rowData.answer) {
        errors.push(`Row ${i + 1}: Answer is required`);
        continue;
      }

      let finalAnswer = rowData.answer;
      
     if (rowData.type === 'MCQ') {
  // For MCQ, store as "Option A", "Option B", etc.
  const correctIndex = options.findIndex(opt => opt === rowData.answer);
  if (correctIndex !== -1) {
    finalAnswer = `${String.fromCharCode(65 + correctIndex)}`;
  } else if (rowData.answer.match(/^[A-F]$/i)) {
    const letterIndex = rowData.answer.toUpperCase().charCodeAt(0) - 65;
    if (letterIndex >= 0 && letterIndex < options.length) {
      finalAnswer = `${String.fromCharCode(65 + letterIndex)}`;
    } else {
      errors.push(`Row ${i + 1}: MCQ answer '${rowData.answer}' doesn't match any option`);
      continue;
    }
  } else {
    errors.push(`Row ${i + 1}: MCQ answer '${rowData.answer}' doesn't match any option`);
    continue;
  }
} else if (rowData.type === 'MSQ') {
  // For MSQ, store as "Option A;Option C;..."
  const answerOptions = rowData.answer.split(';').map(opt => opt.trim()).filter(opt => opt);
  const answerLabels: string[] = [];

  for (const answerOption of answerOptions) {
    const optionIndex = options.findIndex(opt => opt === answerOption);
    if (optionIndex !== -1) {
      answerLabels.push(`${String.fromCharCode(65 + optionIndex)}`);
    } else if (answerOption.match(/^[A-F]$/i)) {
      const letterIndex = answerOption.toUpperCase().charCodeAt(0) - 65;
      if (letterIndex >= 0 && letterIndex < options.length) {
        answerLabels.push(`${String.fromCharCode(65 + letterIndex)}`);
      } else {
        errors.push(`Row ${i + 1}: MSQ answer '${answerOption}' doesn't match any option`);
        continue;
      }
    } else {
      errors.push(`Row ${i + 1}: MSQ answer '${answerOption}' doesn't match any option`);
      continue;
    }
  }

  finalAnswer = answerLabels.join(';');
}

      const question: Question = {
        id: `temp-csv-${Date.now()}-${i}`,
        question: rowData.question,
        type: rowData.type as Question['type'],
        options: options,
        answer: finalAnswer,
        explanation: rowData.explanation || undefined,
      };

      questions.push(question);
    }

    return {
      isValid: errors.length === 0,
      questions,
      errors
    };
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      if (selectedFile.type !== 'text/csv' && !selectedFile.name.endsWith('.csv')) {
        alert('Please upload a CSV file');
        return;
      }
      setFile(selectedFile);
      setValidationResult(null);
      setUploadProgress(0);
    }
  };

  const handleUpload = async () => {
    if (!file) return;

    setIsUploading(true);
    setUploadProgress(30);
    const reader = new FileReader();
    
    reader.onload = async (e) => {
      try {
        const csvText = e.target?.result as string;
        setUploadProgress(60);
        const result = validateCsv(csvText);
        setValidationResult(result);
        setUploadProgress(80);

        if (result.isValid && result.questions.length > 0) {
          // Upload to server
          const res = await fetch(`/api/admin/mocks/${mockId}/questions/bulk`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            credentials: 'include',
            body: JSON.stringify({ questions: result.questions }),
          });

          setUploadProgress(100);
          const data = await res.json();

          if (res.ok) {
            setTimeout(() => {
              onUploadSuccess();
              onOpenChange(false);
              resetForm();
            }, 500);
          } else {
            alert(`Upload failed: ${data.error || 'Unknown error'}`);
          }
        }
      } catch (error) {
        alert('Error processing CSV file');
        console.error(error);
      } finally {
        setIsUploading(false);
        setUploadProgress(0);
      }
    };

    reader.readAsText(file);
  };

  const resetForm = () => {
    setFile(null);
    setValidationResult(null);
    setUploadProgress(0);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleOpenChange = (open: boolean) => {
    if (!open) {
      resetForm();
    }
    onOpenChange(open);
  };

 

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-lg">
            <Upload className="h-5 w-5" />
            Upload Questions via CSV
          </DialogTitle>
          <DialogDescription className="text-muted-foreground">
            Bulk upload questions using a CSV file. Ensure your file follows the required format.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* File Upload Section */}
          <Card>
            <CardContent className="p-4">
              <div className="space-y-4">
                <div className="grid w-full items-center gap-1.5">
                  <Label htmlFor="csv-file" className="text-sm font-medium">
                    CSV File
                  </Label>
                  <Input
                    id="csv-file"
                    type="file"
                    accept=".csv"
                    onChange={handleFileChange}
                    ref={fileInputRef}
                    className="cursor-pointer"
                    disabled={isUploading}
                  />
                </div>

                {file && (
                  <div className="flex items-center gap-3 p-3 bg-muted rounded-lg">
                    <FileText className="h-5 w-5 text-blue-500" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{file.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {Math.round(file.size / 1024)} KB
                      </p>
                    </div>
                    <Badge variant="secondary" className="shrink-0">
                      Ready
                    </Badge>
                  </div>
                )}

                {isUploading && (
                  <div className="space-y-2">
                    <Progress value={uploadProgress} className="h-2" />
                    <p className="text-xs text-muted-foreground text-center">
                      Processing... {uploadProgress}%
                    </p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Validation Results */}
          {validationResult && (
            <Card className={validationResult.isValid ? "border-green-200" : "border-destructive"}>
              <CardContent className="p-4">
                <div className="flex items-center gap-3 mb-3">
                  {validationResult.isValid ? (
                    <CheckCircle className="h-5 w-5 text-green-600" />
                  ) : (
                    <AlertCircle className="h-5 w-5 text-destructive" />
                  )}
                  <div>
                    <p className={`font-medium ${validationResult.isValid ? "text-green-800" : "text-destructive"}`}>
                      {validationResult.isValid 
                        ? `Validation Successful!`
                        : `Validation Failed`
                      }
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {validationResult.isValid 
                        ? `Found ${validationResult.questions.length} valid questions`
                        : `Found ${validationResult.errors.length} errors`
                      }
                    </p>
                  </div>
                </div>

                {!validationResult.isValid && validationResult.errors.length > 0 && (
                  <div className="space-y-2 mt-3">
                    <p className="text-sm font-medium text-destructive">Errors:</p>
                    <div className="max-h-32 overflow-y-auto space-y-1">
                      {validationResult.errors.slice(0, 10).map((error, index) => (
                        <div key={index} className="text-sm text-destructive flex items-start gap-2">
                          <span className="text-xs">•</span>
                          <span>{error}</span>
                        </div>
                      ))}
                      {validationResult.errors.length > 10 && (
                        <p className="text-sm text-muted-foreground">
                          ...and {validationResult.errors.length - 10} more errors
                        </p>
                      )}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Format Guide */}
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-3">
                <HelpCircle className="h-4 w-4 text-muted-foreground" />
                <h4 className="font-medium">CSV Format Guide</h4>
              </div>
              
              <div className="bg-muted p-3 rounded-md mb-3">
                <pre className="text-sm font-mono whitespace-pre-wrap">
                    <span className="text-emerald-400">question, type, answer, options, explanation</span>
{`
"What is 2+2?",MCQ,0,"4;5;6;7","Basic addition"
"Select prime numbers",MSQ,"2;3;5","1;2;3;4;5","Prime numbers explanation"
"Solve for x: 2x = 10",NAT,5,,
"Describe your approach",DESCRIPTIVE,"Detailed answer here",,`}
                </pre>
              </div>

              <div className="text-xs text-muted-foreground space-y-1">
                <p>• <strong>MCQ</strong>: Answer should be option index (0, 1, 2...) or option letter (A, B, C...)</p>
                <p>• <strong>MSQ</strong>: Separate multiple answers with semicolons (A;B;C)</p>
                <p>• <strong>NAT</strong>: Numerical answers only</p>
                <p>• <strong>DESCRIPTIVE</strong>: Text answer</p>
                <p>• Separate multiple options with semicolons (;)</p>
              </div>

              
            </CardContent>
          </Card>
        </div>

        <DialogFooter className="flex flex-col sm:flex-row gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={() => handleOpenChange(false)}
            disabled={isUploading}
            className="flex-1"
          >
            Cancel
          </Button>
          <Button
            onClick={handleUpload}
            disabled={!file || isUploading}
            className="flex-1 gap-2"
          >
            {isUploading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Uploading...
              </>
            ) : (
              <>
                <Upload className="h-4 w-4" />
                Upload Questions
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}