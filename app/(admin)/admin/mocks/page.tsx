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
import { CreateMockModal } from "@/components/admin/mocks/CreateMockModal";
import {
  Edit2,
  Trash2,
  ArrowLeft,
  ArrowRight,
  BookOpen,
  DollarSign,
  Trophy,
  Star,
  Award,
  AlertCircle,
  Clock,
  RefreshCw,
  FileText,
  TrendingUp,
  BarChart3,
} from "lucide-react";
import { EditMockModal } from "@/components/admin/mocks/EditMockModal";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

type MockTest = {
  id: string;
  title: string;
  description?: string;
  price: number;
  actualPrice?: number;
  duration?: number;
  difficulty: string;
  questions: Array<any>;
  createdAt: string;
  status: string;
};

type MockStats = {
  totalMocks: number;
  publishedMocks: number;
  draftMocks: number;
  easyMocks: number;
  mediumMocks: number;
  hardMocks: number;
  avgQuestions: number;
};

export default function AdminMocksPage() {
  const [mocks, setMocks] = useState<MockTest[]>([]);
  const [stats, setStats] = useState<MockStats>({
    totalMocks: 0,
    publishedMocks: 0,
    draftMocks: 0,
    easyMocks: 0,
    mediumMocks: 0,
    hardMocks: 0,
    avgQuestions: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [globalFilter, setGlobalFilter] = useState("");
  const [refreshing, setRefreshing] = useState(false);
  const router = useRouter();
  const [editOpen, setEditOpen] = useState(false);
  const [selectedMock, setSelectedMock] = useState<MockTest | null>(null);

  // Calculate stats from mocks data
  const calculateStats = (mocksData: MockTest[]) => {
    const totalMocks = mocksData.length;
    const publishedMocks = mocksData.filter(mock => mock.status === "PUBLISHED").length;
    const draftMocks = mocksData.filter(mock => mock.status === "DRAFT").length;
    const easyMocks = mocksData.filter(mock => mock.difficulty === "EASY").length;
    const mediumMocks = mocksData.filter(mock => mock.difficulty === "MEDIUM").length;
    const hardMocks = mocksData.filter(mock => mock.difficulty === "HARD").length;
    
    const totalQuestions = mocksData.reduce((sum, mock) => 
      sum + (Array.isArray(mock.questions) ? mock.questions.length : 0), 0);
    const avgQuestions = totalMocks > 0 ? Math.round(totalQuestions / totalMocks) : 0;

    return {
      totalMocks,
      publishedMocks,
      draftMocks,
      easyMocks,
      mediumMocks,
      hardMocks,
      avgQuestions,
    };
  };

  // Fetch mocks
  const fetchMocks = async () => {
    setRefreshing(true);
    try {
      const res = await fetch("/api/admin/mocks", { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch mocks");
      const data = await res.json();
      setMocks(data.mocks);
      setStats(calculateStats(data.mocks));
      setError(null);
    } catch (err) {
      console.error(err);
      setError("Failed to load mocks. Please try again.");
    } finally {
      setLoading(false);
      setRefreshing(false);
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
        credentials: "include",
      });
      if (res.ok) {
        setMocks((prev) => prev.filter((m) => m.id !== id));
        setStats(calculateStats(mocks.filter((m) => m.id !== id)));
      } else throw new Error("Delete failed");
    } catch (err) {
      alert("Error deleting mock");
    }
  };

  const getDifficultyBadge = (difficulty: string) => {
    const difficultyMap: Record<string, { icon: JSX.Element; color: string }> = {
      EASY: { icon: <Star className="w-4 h-4" />, color: "bg-green-100 text-green-800 border-green-200" },
      MEDIUM: { icon: <Award className="w-4 h-4" />, color: "bg-yellow-100 text-yellow-800 border-yellow-200" },
      HARD: { icon: <Trophy className="w-4 h-4" />, color: "bg-red-100 text-red-800 border-red-200" },
      DEFAULT: { icon: <AlertCircle className="w-4 h-4" />, color: "bg-gray-100 text-gray-800 border-gray-200" },
    };
    const { icon, color } = difficultyMap[difficulty] || difficultyMap.DEFAULT;
    return (
      <Badge variant="outline" className={`${color} flex items-center gap-1 border`}>
        {icon} {difficulty}
      </Badge>
    );
  };

  // Stats Cards
  const StatsCard = ({ title, value, icon, description, trend }: { 
    title: string; 
    value: number; 
    icon: React.ReactNode;
    description?: string;
    trend?: string;
  }) => (
    <Card className="relative overflow-hidden">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        {icon}
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        {description && (
          <p className="text-xs text-muted-foreground">
            {description}
          </p>
        )}
        {trend && (
          <div className="flex items-center text-xs text-muted-foreground mt-1">
            <TrendingUp className="w-3 h-3 mr-1" />
            {trend}
          </div>
        )}
      </CardContent>
    </Card>
  );

  // Columns
  const columns: ColumnDef<MockTest>[] = [
    {
      id: "sno",
      header: "S.No",
      cell: ({ row }) => {
        return (
          <span className="text-sm font-medium text-muted-foreground">
            {row.index + 1}
          </span>
        );
      },
      size: 60,
    },
    {
      accessorKey: "title",
      header: "Title",
      cell: (info) => <span className="font-medium">{info.getValue() as string}</span>,
    },
    {
      accessorKey: "description",
      header: "Description",
      cell: (info) => {
        const value = info.getValue() as string;
        const maxLength = 30;
        const displayText = value?.length > maxLength ? value.slice(0, maxLength) + "..." : value || "-";

        return (
          <span className="text-muted-foreground" title={value || "-"}>
            {displayText}
          </span>
        );
      },
    },
    {
      id: "questions",
      header: () => (
        <div className="flex items-center">
          <BookOpen className="w-4 h-4 mr-1" /> Qns
        </div>
      ),
      cell: (info) => {
        const questions = Array.isArray(info.row.original.questions) ? info.row.original.questions : [];
        return (
          <Badge
            variant="outline"
            className="font-mono hover:bg-gray-50 cursor-pointer border"
            onClick={() => router.push(`/admin/mocks/${info.row.original.id}`)}
          >
            {questions.length}
          </Badge>
        );
      },
    },
    {
      accessorKey: "price",
      header: () => (
        <div className="flex items-center">
          ₹ Price
        </div>
      ),
      cell: ({ row }) => {
        const price = row.original.price;
        const actualPrice = row.original.actualPrice;
        return price > 0 ? (
          <div className="flex flex-col items-start">
            {actualPrice && actualPrice > price && (
              <span className="text-sm text-gray-500 line-through">₹{actualPrice}</span>
            )}
            <span className="font-bold text-green-600">₹{price}</span>
          </div>
        ) : (
          <Badge variant="secondary" className="text-xs border">
            FREE
          </Badge>
        );
      },
    },
    {
      accessorKey: "duration",
      header: () => (
        <div className="flex items-center">
          <Clock className="w-4 h-4 mr-1" /> Duration
        </div>
      ),
      cell: (info) => {
        const duration = info.getValue() as number | undefined;
        return (
          <span className="text-sm text-amber-500 font-medium flex items-center gap-1">
            <Clock className="w-4 h-4" />
            {duration ? `${duration} min` : "-"}
          </span>
        );
      },
    },
    {
      accessorKey: "difficulty",
      header: "Difficulty",
      cell: (info) => getDifficultyBadge(info.getValue() as string),
    },
    {
      accessorKey: "status",
      header: "Status",
      cell: (info) => {
        const status = info.getValue() as string;
        return (
          <Badge
            variant={status === "PUBLISHED" ? "default" : status === "DRAFT" ? "secondary" : "outline"}
            className="capitalize border"
          >
            {status.toLowerCase()}
          </Badge>
        );
      },
    },
    {
      id: "actions",
      header: "Actions",
      cell: ({ row }) => {
        const mock = row.original;

        return (
          <TooltipProvider>
            <div className="flex items-center gap-2">
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="outline"
                    size="icon"
                    className="bg-green-50 hover:bg-green-100 text-green-600 border-green-200"
                    onClick={() => router.push(`/mocks/${mock.id}/start`)}
                  >
                    <Trophy className="w-4 h-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Play Quiz</TooltipContent>
              </Tooltip>

              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => {
                      setSelectedMock(mock);
                      setEditOpen(true);
                    }}
                  >
                    <Edit2 className="w-4 h-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Edit</TooltipContent>
              </Tooltip>

              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => router.push(`/admin/mocks/${mock.id}`)}
                  >
                    <BookOpen className="w-4 h-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Questions</TooltipContent>
              </Tooltip>

              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="destructive"
                    size="icon"
                    onClick={() => handleDelete(mock.id)}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Delete</TooltipContent>
              </Tooltip>
            </div>
          </TooltipProvider>
        );
      },
    },
  ];

  // Table instance
  const table = useReactTable({
    data: mocks,
    columns,
    state: { globalFilter },
    onGlobalFilterChange: setGlobalFilter,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    globalFilterFn: (row, _, filterValue) => {
      const search = filterValue.toLowerCase();
      const title = row.getValue("title").toString().toLowerCase();
      const difficulty = row.getValue("difficulty").toString().toLowerCase();
      const description = row.getValue("description")?.toString().toLowerCase() || "";
      return title.includes(search) || difficulty.includes(search) || description.includes(search);
    },
  });

  if (loading)
    return (
      <div className="p-6 flex justify-center">
        <p className="animate-pulse">Loading mocks...</p>
      </div>
    );

  if (error)
    return (
      <div className="p-6">
        <p className="text-red-600 flex items-center">
          <AlertCircle className="w-5 h-5 mr-2" /> {error}
        </p>
        <Button variant="outline" className="mt-4" onClick={fetchMocks}>
          Retry
        </Button>
      </div>
    );

  return (
    <div className="flex flex-col gap-6 p-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Mock Tests Management</h1>
          <p className="text-muted-foreground mt-2">
            Manage and organize all your mock tests in one place
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="sm"
            onClick={fetchMocks}
            disabled={refreshing}
            className="flex items-center gap-2"
          >
            <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <CreateMockModal onSuccess={fetchMocks} />
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatsCard
          title="Total Mocks"
          value={stats.totalMocks}
          icon={<FileText className="w-4 h-4 text-muted-foreground" />}
          description="All mock tests"
        />
        <StatsCard
          title="Published"
          value={stats.publishedMocks}
          icon={<TrendingUp className="w-4 h-4 text-muted-foreground" />}
          description={`${stats.draftMocks} drafts`}
          trend={`${Math.round((stats.publishedMocks / stats.totalMocks) * 100) || 0}% published`}
        />
        <StatsCard
          title="Avg Questions"
          value={stats.avgQuestions}
          icon={<BarChart3 className="w-4 h-4 text-muted-foreground" />}
          description="Per mock test"
        />
        <StatsCard
          title="Difficulty Spread"
          value={stats.easyMocks + stats.mediumMocks + stats.hardMocks}
          icon={<Trophy className="w-4 h-4 text-muted-foreground" />}
          description={`${stats.easyMocks}E / ${stats.mediumMocks}M / ${stats.hardMocks}H`}
        />
      </div>

      {/* Search and Filters */}
      <div className="flex items-center justify-between">
        <Input
          placeholder="Search mocks by title, difficulty, or description..."
          value={globalFilter}
          onChange={(e) => setGlobalFilter(e.target.value)}
          className="max-w-md"
        />
        <div className="text-sm text-muted-foreground">
          {table.getFilteredRowModel().rows.length} of {mocks.length} mocks
        </div>
      </div>

      {/* Data Table */}
      <div className="rounded-lg border bg-card">
        <Table>
          <TableHeader className="bg-muted/50">
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <TableHead key={header.id} className="font-semibold">
                    {header.isPlaceholder
                      ? null
                      : flexRender(header.column.columnDef.header, header.getContext())}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow 
                  key={row.id} 
                  className="hover:bg-muted/30 transition-colors"
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={columns.length} className="h-24 text-center">
                  <div className="flex flex-col items-center justify-center text-muted-foreground">
                    <FileText className="w-12 h-12 mb-2 opacity-50" />
                    <p>No mock tests found.</p>
                    <p className="text-sm">Create your first mock test to get started.</p>
                  </div>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {/* Edit Modal */}
      {selectedMock && (
        <EditMockModal
          mock={selectedMock}
          open={editOpen}
          onOpenChange={setEditOpen}
          onSuccess={fetchMocks}
        />
      )}

      {/* Pagination */}
      <div className="flex items-center justify-between px-2">
        <div className="text-sm text-muted-foreground">
          Page {table.getState().pagination.pageIndex + 1} of{" "}
          {table.getPageCount()} • {table.getFilteredRowModel().rows.length} total mocks
        </div>
        <div className="flex space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => table.previousPage()}
            disabled={!table.getCanPreviousPage()}
            className="flex items-center gap-1"
          >
            <ArrowLeft className="w-4 h-4" />
            Previous
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => table.nextPage()}
            disabled={!table.getCanNextPage()}
            className="flex items-center gap-1"
          >
            Next
            <ArrowRight className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}