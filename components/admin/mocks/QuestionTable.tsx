"use client";

import React, { useState } from "react";
import { ColumnDef, flexRender, getCoreRowModel, useReactTable } from "@tanstack/react-table";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import QuestionActions from "./QuestionActions";

type Question = { id: string; question: string; type: string; options: string[]; answer: string; explanation?: string };

export default function QuestionsTable({ questions, mockId, refreshMock, setEditQuestion }: { questions: Question[]; mockId: string; refreshMock: () => void; setEditQuestion: (q: Question) => void }) {

  const columns: ColumnDef<Question>[] = [
    { accessorKey: "id", header: "ID", cell: info => <span className="font-mono text-sm">#{info.getValue().toString().slice(0,6)}</span> },
    { accessorKey: "question", header: "Question", cell: info => <span className="line-clamp-2">{info.getValue()}</span> },
    { accessorKey: "type", header: "Type", cell: info => <span>{info.getValue()}</span> },
    { id: "actions", header: "Actions", cell: ({ row }) => <QuestionActions question={row.original} mockId={mockId} refreshMock={refreshMock} setEditQuestion={setEditQuestion} /> }
  ];

  const table = useReactTable({ data: questions, columns, getCoreRowModel: getCoreRowModel() });

  return (
    <Table>
      <TableHeader>
        {table.getHeaderGroups().map(hg => <TableRow key={hg.id}>{hg.headers.map(h => <TableHead key={h.id}>{flexRender(h.column.columnDef.header, h.getContext())}</TableHead>)}</TableRow>)}
      </TableHeader>
      <TableBody>
        {table.getRowModel().rows.map(row => <TableRow key={row.id}>{row.getVisibleCells().map(cell => <TableCell key={cell.id}>{flexRender(cell.column.columnDef.cell, cell.getContext())}</TableCell>)}</TableRow>)}
      </TableBody>
    </Table>
  );
}
