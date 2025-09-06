"use client"

import { useMemo, useState } from "react"
import { Button } from "@/components/ui/button"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { format } from "date-fns"
import { Pencil, Trash2, Search, ChevronLeft, ChevronRight } from "lucide-react"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"

type Faq = {
  id: string
  question: string
  answer: string
  category?: string | null
  createdAt: string
}

type FaqTableProps = {
  data: Faq[]
  loading: boolean
  onEdit: (faq: Faq) => void
  onDelete: (id: string) => void
}

const CATEGORY_COLORS: Record<string, string> = {
  "Getting Started": "bg-blue-500/20 text-blue-300 border-blue-500/30",
  General: "bg-gray-500/20 text-gray-300 border-gray-500/30",
  Courses: "bg-green-500/20 text-green-300 border-green-500/30",
  Mocks: "bg-purple-500/20 text-purple-300 border-purple-500/30",
  Sessions: "bg-orange-500/20 text-orange-300 border-orange-500/30",
  Materials: "bg-pink-500/20 text-pink-300 border-pink-500/30",
}

export function FaqTable({ data, loading, onEdit, onDelete }: FaqTableProps) {
  const [search, setSearch] = useState("")
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(5)

  const filteredData = useMemo(() => {
    if (!search) return data
    return data.filter(
      (faq) =>
        faq.question.toLowerCase().includes(search.toLowerCase()) ||
        faq.answer.toLowerCase().includes(search.toLowerCase()) ||
        faq.category?.toLowerCase().includes(search.toLowerCase())
    )
  }, [search, data])

  const totalPages = Math.ceil(filteredData.length / pageSize)
  const paginatedData = filteredData.slice(
    (page - 1) * pageSize,
    page * pageSize
  )

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        <span className="ml-2">Loading FAQs...</span>
      </div>
    )
  }
  
  if (!data?.length) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-muted-foreground">
        <div className="text-lg mb-2">No FAQs found</div>
        <p className="text-sm">Create your first FAQ to get started</p>
      </div>
    )
  }

  return (
    <div className="space-y-4 rounded-lg border bg-card p-4 shadow-sm">
      {/* Search + Page Size */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="relative w-full sm:max-w-sm">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search FAQs..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value)
              setPage(1)
            }}
            className="pl-9 bg-background"
          />
        </div>
        <div className="flex items-center gap-2 self-end sm:self-auto">
          <span className="text-sm text-muted-foreground">Rows per page:</span>
          <Select
            value={String(pageSize)}
            onValueChange={(val) => {
              setPageSize(Number(val))
              setPage(1)
            }}
          >
            <SelectTrigger className="w-20 bg-background">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {[5, 10, 20].map((size) => (
                <SelectItem key={size} value={String(size)}>
                  {size}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Table */}
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              <TableHead className="w-12 text-center">S.No</TableHead>
              <TableHead>Question</TableHead>
              <TableHead>Answer</TableHead>
              <TableHead>Category</TableHead>
              <TableHead>Created</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {paginatedData.map((faq, index) => (
              <TableRow key={faq.id} className="border-muted/50">
                {/* Serial Number */}
                <TableCell className="text-center text-muted-foreground font-medium">
                  {(page - 1) * pageSize + index + 1}
                </TableCell>

                {/* Question with Tooltip */}
                <TableCell className="font-medium max-w-xs">
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <div className="line-clamp-2 text-left cursor-help">
                          {faq.question}
                        </div>
                      </TooltipTrigger>
                      <TooltipContent className="max-w-sm p-3">
                        <p className="font-semibold mb-1">Question:</p>
                        {faq.question}
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </TableCell>

                {/* Answer with Tooltip */}
                <TableCell className="max-w-md">
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <div className="line-clamp-2 text-left cursor-help text-muted-foreground">
                          {faq.answer}
                        </div>
                      </TooltipTrigger>
                      <TooltipContent className="max-w-sm p-3">
                        <p className="font-semibold mb-1">Answer:</p>
                        {faq.answer}
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </TableCell>

                {/* Category with Badge */}
                <TableCell>
                  <Badge
                    variant="outline"
                    className={
                      CATEGORY_COLORS[faq.category ?? "General"] ??
                      "bg-gray-500/20 text-gray-300 border-gray-500/30"
                    }
                  >
                    {faq.category ?? "General"}
                  </Badge>
                </TableCell>

                {/* CreatedAt */}
                <TableCell className="text-muted-foreground">
                  {format(new Date(faq.createdAt), "PP")}
                  <br />
                  <span className="text-xs">
                    {format(new Date(faq.createdAt), "p")}
                  </span>
                </TableCell>

                {/* Actions */}
                <TableCell>
                  <div className="flex justify-end gap-2">
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => onEdit(faq)}
                            className="h-8 w-8 hover:bg-primary/20"
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>Edit FAQ</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => onDelete(faq.id)}
                            className="h-8 w-8 hover:bg-destructive/20"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>Delete FAQ</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Pagination Controls */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4">
        <p className="text-sm text-muted-foreground">
          Showing {paginatedData.length} of {filteredData.length} FAQs
        </p>
        
        <div className="flex items-center gap-2">
          <p className="text-sm text-muted-foreground mr-2">
            Page {page} of {totalPages || 1}
          </p>
          <Button
            variant="outline"
            size="icon"
            disabled={page === 1}
            onClick={() => setPage((p) => Math.max(p - 1, 1))}
            className="h-8 w-8"
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="icon"
            disabled={page === totalPages || totalPages === 0}
            onClick={() => setPage((p) => Math.min(p + 1, totalPages))}
            className="h-8 w-8"
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  )
}