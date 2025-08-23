"use client";

import { useState, useMemo } from "react";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import { Edit, Trash2, Search } from "lucide-react";
import { Question } from "./QuizForm";

interface QuizTableProps {
  questions: Question[];
  onEdit: (index: number) => void;
  onDelete: (index: number) => void;
}

export default function QuizTable({ questions, onEdit, onDelete }: QuizTableProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

  // Filter questions based on search term
  const filteredQuestions = useMemo(() => {
    return questions.filter(question =>
      question.question.toLowerCase().includes(searchTerm.toLowerCase()) ||
      question.explanation?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      question.options.some(option => option.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (typeof question.answer === 'string' && question.answer.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (Array.isArray(question.answer) && question.answer.some(ans => ans.toLowerCase().includes(searchTerm.toLowerCase())))
    );
  }, [questions, searchTerm]);

  // Calculate pagination
  const totalPages = Math.ceil(filteredQuestions.length / itemsPerPage);
  const currentQuestions = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return filteredQuestions.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredQuestions, currentPage, itemsPerPage]);

  const formatAnswer = (question: Question) => {
    if (question.type === "MSQ") {
      return Array.isArray(question.answer) ? question.answer.join(", ") : "";
    } else if (question.type === "NAT") {
      return question.answer.toString();
    } else {
      return question.answer.toString();
    }
  };

  const TruncatedText = ({ text, maxLength = 50 }: { text: string; maxLength?: number }) => {
    if (!text) return "-";
    
    const truncated = text.length > maxLength ? `${text.substring(0, maxLength)}...` : text;
    
    if (text.length > maxLength) {
      return (
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <span className="cursor-help">{truncated}</span>
            </TooltipTrigger>
            <TooltipContent>
              <p className="max-w-xs break-words">{text}</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      );
    }
    
    return <span>{text}</span>;
  };

  const OptionsList = ({ question }: { question: Question }) => {
    if (question.type === "NAT") return <span className="text-muted-foreground">N/A</span>;
    
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <div className="cursor-help">
              {question.options.slice(0, 2).map((opt, idx) => (
                <div key={idx} className="text-sm">
                  {String.fromCharCode(65 + idx)}. {opt}
                </div>
              ))}
              {question.options.length > 2 && (
                <div className="text-xs text-muted-foreground">
                  +{question.options.length - 2} more options
                </div>
              )}
            </div>
          </TooltipTrigger>
          <TooltipContent className="max-w-xs">
            <div className="space-y-1">
              {question.options.map((opt, idx) => (
                <div key={idx} className="text-sm">
                  <strong>{String.fromCharCode(65 + idx)}.</strong> {opt}
                </div>
              ))}
            </div>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  };

  return (
    <div className="space-y-4">
      {/* Search Bar */}
      <div className="relative max-w-sm">
        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
        <Input
          type="search"
          placeholder="Search questions..."
          className="pl-8"
          value={searchTerm}
          onChange={(e) => {
            setSearchTerm(e.target.value);
            setCurrentPage(1); // Reset to first page when searching
          }}
        />
      </div>

      {/* Table */}
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-12">#</TableHead>
              <TableHead className="min-w-[200px]">Question</TableHead>
              <TableHead className="w-20">Type</TableHead>
              <TableHead className="min-w-[120px]">Options</TableHead>
              <TableHead className="min-w-[120px]">Correct Answer</TableHead>
              <TableHead className="min-w-[150px]">Explanation</TableHead>
              <TableHead className="text-right w-32">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {currentQuestions.length > 0 ? (
              currentQuestions.map((question, index) => {
                const globalIndex = questions.findIndex(q => q === question);
                return (
                  <TableRow key={globalIndex}>
                    <TableCell>{globalIndex + 1}</TableCell>
                    <TableCell>
                      <TruncatedText text={question.question} maxLength={40} />
                    </TableCell>
                    <TableCell>{question.type}</TableCell>
                    <TableCell>
                      <OptionsList question={question} />
                    </TableCell>
                    <TableCell>
                      <TruncatedText text={formatAnswer(question)} maxLength={40} />
                    </TableCell>
                    <TableCell>
                      <TruncatedText text={question.explanation || ""} maxLength={50} />
                    </TableCell>
                    <TableCell>
                      <div className="flex justify-end gap-2">
                        <Button size="sm" variant="outline" onClick={() => onEdit(globalIndex)}>
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button size="sm" variant="destructive" onClick={() => onDelete(globalIndex)}>
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })
            ) : (
              <TableRow>
                <TableCell colSpan={7} className="text-center h-24">
                  {searchTerm ? "No matching questions found." : "No questions found."}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <Pagination>
          <PaginationContent>
            <PaginationItem>
              <PaginationPrevious
                href="#"
                onClick={(e) => {
                  e.preventDefault();
                  setCurrentPage(prev => Math.max(prev - 1, 1));
                }}
                className={currentPage === 1 ? "pointer-events-none opacity-50" : ""}
              />
            </PaginationItem>
            
            {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
              <PaginationItem key={page}>
                <PaginationLink
                  href="#"
                  onClick={(e) => {
                    e.preventDefault();
                    setCurrentPage(page);
                  }}
                  isActive={currentPage === page}
                >
                  {page}
                </PaginationLink>
              </PaginationItem>
            ))}
            
            <PaginationItem>
              <PaginationNext
                href="#"
                onClick={(e) => {
                  e.preventDefault();
                  setCurrentPage(prev => Math.min(prev + 1, totalPages));
                }}
                className={currentPage === totalPages ? "pointer-events-none opacity-50" : ""}
              />
            </PaginationItem>
          </PaginationContent>
        </Pagination>
      )}

      {/* Results count */}
      <div className="text-sm text-muted-foreground">
        Showing {currentQuestions.length} of {filteredQuestions.length} question(s)
        {searchTerm && ` filtered from ${questions.length} total`}
      </div>
    </div>
  );
}