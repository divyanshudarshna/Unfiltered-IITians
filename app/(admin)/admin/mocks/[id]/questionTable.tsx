"use client";

import React from "react";
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipTrigger, TooltipContent } from "@/components/ui/tooltip";
import { Search, Edit2, Trash2,List,Type,CheckCircle,FileText } from "lucide-react";
import { Question } from "./types";

interface QuestionTableProps {
  questions: Question[];
  globalFilter: string;
  setGlobalFilter: (filter: string) => void;
  onEditQuestion: (question: Question) => void;
  onDeleteQuestion: (questionId: string) => void;
}

export default function QuestionTable({
  questions,
  globalFilter,
  setGlobalFilter,
  onEditQuestion,
  onDeleteQuestion,
}: QuestionTableProps) {
  const columns: ColumnDef<Question>[] = [
    {
      id: "serial",
      header: "S.No",
      cell: ({ row }) => (
        <span className="text-muted-foreground font-mono text-sm">
          {row.index + 1}
        </span>
      ),
    },
    {
      accessorKey: "question",
      header: "Question",
      cell: (info) => {
        const value = info.getValue();
        const text = typeof value === "string" ? value : "Invalid question";
        const maxLength = 50;

        const truncated = text.length > maxLength ? text.slice(0, maxLength) + "..." : text;

        return (
          <Tooltip>
            <TooltipTrigger asChild>
              <span className="font-medium line-clamp-2 cursor-pointer">{truncated}</span>
            </TooltipTrigger>
            <TooltipContent className="max-w-sm whitespace-pre-wrap">
              {text}
            </TooltipContent>
          </Tooltip>
        );
      },
    },
    {
      accessorKey: "options",
      header: "Options",
      cell: (info) => {
        const options = info.getValue();
        if (!Array.isArray(options)) return <span className="text-red-500">No options</span>;
        const maxLength = 20;

        return (
          <div className="space-y-1">
            {options.map((opt, i) => {
              const text = typeof opt === "string" ? opt || "-" : "Invalid option";
              const truncated = text.length > maxLength ? text.slice(0, maxLength) + "..." : text;

              return (
                <Tooltip key={i}>
                  <TooltipTrigger asChild>
                    <div className="flex items-center cursor-pointer">
                      <span className="text-muted-foreground text-xs w-6">
                        {String.fromCharCode(65 + i)}.
                      </span>
                      <span className="text-sm">{truncated}</span>
                    </div>
                  </TooltipTrigger>
                  <TooltipContent className="max-w-xs whitespace-pre-wrap">{text}</TooltipContent>
                </Tooltip>
              );
            })}
          </div>
        );
      },
    },
    {
      accessorKey: "type",
      header: "Type",
      cell: (info) => {
        const value = info.getValue();
        return getQuestionTypeBadge(typeof value === "string" ? value : "UNKNOWN");
      },
    },
    {
      accessorKey: "answer",
      header: "Correct Answer",
      cell: (info) => {
        const answer = info.getValue();
        const question = info.row.original;

        if (typeof answer !== "string") {
          return <Badge variant="outline" className="font-mono">Invalid</Badge>;
        }

        const options = Array.isArray(question?.options) ? question.options : [];
        const optionIndex = options.indexOf(answer);
        const display = optionIndex >= 0 ? String.fromCharCode(65 + optionIndex) : answer;

        const maxLength = 20;
        const truncated = display.length > maxLength ? display.slice(0, maxLength) + "..." : display;

        return (
          <Tooltip>
            <TooltipTrigger asChild>
              <Badge variant="outline" className="font-mono cursor-pointer">{truncated}</Badge>
            </TooltipTrigger>
            <TooltipContent className="max-w-xs whitespace-pre-wrap">{display}</TooltipContent>
          </Tooltip>
        );
      },
    },
    {
      id: "actions",
      header: "Actions",
      cell: ({ row }) => {
        const question = row.original;
        if (!question || typeof question !== "object") return <span className="text-red-500">Invalid</span>;

        return (
          <div className="flex space-x-2">
            <Button
              variant="outline"
              size="sm"
              className="h-8"
              onClick={() => onEditQuestion(question)}
            >
              <Edit2 className="w-4 h-4 mr-1" /> Edit
            </Button>
            <Button
              variant="destructive"
              size="sm"
              className="h-8"
              onClick={() => onDeleteQuestion(question.id)}
            >
              <Trash2 className="w-4 h-4 mr-1" /> Delete
            </Button>
          </div>
        );
      },
    },
  ];

  const table = useReactTable({
    data: questions,
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

  return (
    <>
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
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext()
                      )}
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
    </>
  );
}

// Helper function for question type badge
function getQuestionTypeBadge(type: string) {
  const typeMap: Record<string, { icon: JSX.Element; color: string }> = {
    MCQ: {
      icon: <List className="w-4 h-4" />,
      color: "bg-blue-100 text-blue-800",
    },
    MSQ: {
      icon: <CheckCircle className="w-4 h-4" />,
      color: "bg-purple-100 text-purple-800",
    },
    DESCRIPTIVE: {
      icon: <FileText className="w-4 h-4" />,
      color: "bg-green-100 text-green-800",
    },
  };

  const { icon, color } = typeMap[type] || {
    icon: <Type className="w-4 h-4" />,
    color: "bg-gray-100 text-gray-800",
  };

  return (
    <Badge className={`${color} flex items-center gap-1`}>
      {icon}
      {type}
    </Badge>
  );
}