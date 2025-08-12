"use client";

import React, { useEffect, useState } from "react";
import {
  ColumnDef,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { useRouter } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import {
  ArrowUpDown,
  Edit2,
  Trash2,
  ArrowLeft,
  ArrowRight,
  BookOpen,
  DollarSign,
  Trophy,
  Star,
  Award,
  AlertCircle
} from "lucide-react";

type MockTest = {
  id: string;
  title: string;
  description?: string;
  price: number;
  difficulty: string;
  questions: Array<any>;
  createdAt: string;
};

export default function AdminMocksPage() {
  const [mocks, setMocks] = useState<MockTest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [globalFilter, setGlobalFilter] = useState("");
  const router = useRouter();

  const fetchMocks = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/mocks", {
        credentials: 'include' // Ensure cookies are sent
      });
      if (!res.ok) throw new Error("Failed to fetch");
      const data = await res.json();
      setMocks(data.mocks);
      setError(null);
    } catch (err) {
      setError("Failed to load mocks. Please try again.");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMocks();
  }, []);

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this mock test?")) return;

    try {
      const res = await fetch(`/api/admin/mocks/${id}`, {
        method: "DELETE",
        credentials: 'include'
      });
      if (res.ok) {
        setMocks((prev) => prev.filter((m) => m.id !== id));
      } else {
        throw new Error("Delete failed");
      }
    } catch (err) {
      alert("Error deleting mock");
    }
  };

  const getDifficultyBadge = (difficulty: string) => {
    const difficultyMap: Record<string, { icon: JSX.Element; color: string }> = {
      EASY: { icon: <Star className="w-4 h-4" />, color: "bg-green-100 text-green-800" },
      MEDIUM: { icon: <Award className="w-4 h-4" />, color: "bg-yellow-100 text-yellow-800" },
      HARD: { icon: <Trophy className="w-4 h-4" />, color: "bg-red-100 text-red-800" },
      DEFAULT: { icon: <AlertCircle className="w-4 h-4" />, color: "bg-gray-100 text-gray-800" }
    };

    const { icon, color } = difficultyMap[difficulty] || difficultyMap.DEFAULT;
    
    return (
      <Badge className={`${color} flex items-center gap-1`}>
        {icon}
        {difficulty}
      </Badge>
    );
  };

  const columns: ColumnDef<MockTest>[] = [
    {
      accessorKey: "title",
      header: "Title",
      cell: (info) => (
        <span className="font-medium">{info.getValue() as string}</span>
      ),
    },
    {
      accessorKey: "description",
      header: "Description",
      cell: (info) => (
        <span className="text-muted-foreground">
          {info.getValue() || "-"}
        </span>
      ),
    },
    {
      id: "questions",
      header: () => (
        <div className="flex items-center">
          <BookOpen className="w-4 h-4 mr-1" />
          Questions
        </div>
      ),
      cell: (info) => {
        const questions = info.row.original.questions || [];
        return (
          <Badge variant="outline" className="font-mono">
            {questions.length}
          </Badge>
        );
      },
    },
    {
      accessorKey: "price",
      header: () => (
        <div className="flex items-center">
          <DollarSign className="w-4 h-4 mr-1" />
          Price
        </div>
      ),
      cell: (info) => {
        const price = info.getValue() as number;
        return price > 0 ? (
          <span className="font-bold text-green-600">₹{price}</span>
        ) : (
          <Badge variant="secondary" className="text-xs">
            FREE
          </Badge>
        );
      },
    },
    {
      accessorKey: "difficulty",
      header: "Difficulty",
      cell: (info) => getDifficultyBadge(info.getValue() as string),
    },
    {
      accessorKey: "createdAt",
      header: "Created At",
      cell: (info) => (
        <span className="text-sm text-muted-foreground">
          {new Date(info.getValue() as string).toLocaleDateString()}
        </span>
      ),
    },
    {
      id: "actions",
      header: "Actions",
      cell: ({ row }) => {
        const mock = row.original;
        return (
          <div className="flex space-x-2">
            <Button
              variant="outline"
              size="sm"
              className="h-8"
              onClick={() => router.push(`/admin/mocks/${mock.id}`)}
            >
              <Edit2 className="w-4 h-4 mr-1" />
              Edit
            </Button>
            <Button
              variant="destructive"
              size="sm"
              className="h-8"
              onClick={() => handleDelete(mock.id)}
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
    data: mocks,
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
      const title = row.getValue("title").toString().toLowerCase();
      const difficulty = row.getValue("difficulty").toString().toLowerCase();
      const description = row.getValue("description")?.toString().toLowerCase() || "";
      return (
        title.includes(search) ||
        difficulty.includes(search) ||
        description.includes(search)
      );
    },
  });

  if (loading) return (
    <div className="p-6 flex justify-center">
      <p className="animate-pulse">Loading mocks...</p>
    </div>
  );

  if (error) return (
    <div className="p-6">
      <p className="text-red-600 flex items-center">
        <AlertCircle className="w-5 h-5 mr-2" />
        {error}
      </p>
      <Button variant="outline" className="mt-4" onClick={fetchMocks}>
        Retry
      </Button>
    </div>
  );

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Mock Tests Management</h1>
        <Button onClick={() => router.push("/admin/mocks/new")}>
          Create New Mock
        </Button>
      </div>

      <div className="flex items-center justify-between mb-4">
        <Input
          placeholder="Search mocks..."
          value={globalFilter ?? ""}
          onChange={(e) => setGlobalFilter(e.target.value)}
          className="max-w-md"
        />
        <div className="text-sm text-muted-foreground">
          {table.getFilteredRowModel().rows.length} mocks found
        </div>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader className="bg-gray-900">
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <TableHead key={header.id}>
                    {header.isPlaceholder
                      ? null
                      : flexRender(
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
                  No results.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <div className="flex items-center justify-between px-2 py-4">
        <div className="text-sm text-muted-foreground">
          Showing {table.getRowModel().rows.length} of{" "}
          {table.getFilteredRowModel().rows.length} row(s)
        </div>
        <div className="flex space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => table.previousPage()}
            disabled={!table.getCanPreviousPage()}
          >
            <ArrowLeft className="w-4 h-4 mr-1" />
            Previous
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => table.nextPage()}
            disabled={!table.getCanNextPage()}
          >
            Next
            <ArrowRight className="w-4 h-4 ml-1" />
          </Button>
        </div>
      </div>
    </div>
  );
}