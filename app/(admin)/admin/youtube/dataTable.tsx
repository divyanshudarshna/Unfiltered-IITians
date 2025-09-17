"use client";

import { useEffect, useState, useMemo } from "react";
import { Button } from "@/components/ui/button";

import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { 
  Input 
} from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import {
  SearchIcon,
  FilterIcon,
  ChevronUpIcon,
  ChevronDownIcon as SortDescIcon,
  ChevronUpIcon as SortAscIcon,
  ChevronDownIcon
} from "lucide-react";
import Form from "./form";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";

interface Video {
  id: string;
  title: string;
  description: string;
  link: string;
  categoryId: string;
  category: { name: string };
}

interface Category {
  id: string;
  name: string;
  desc?: string;
}

type Props = {
  type: "video" | "category";
  onDataChange?: () => void;
};

type SortField = "title" | "name" | "category" | "description";
type SortDirection = "asc" | "desc";

export default function DataTable({ type, onDataChange }: Props) {
  const [data, setData] = useState<Video[] | Category[]>([]);
  const [filteredData, setFilteredData] = useState<Video[] | Category[]>([]);
  const [editingItem, setEditingItem] = useState<Video | Category | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [sortField, setSortField] = useState<SortField>(type === "video" ? "title" : "name");
  const [sortDirection, setSortDirection] = useState<SortDirection>("asc");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [availableCategories, setAvailableCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const itemsPerPageOptions = [5, 10, 20, 50];

  useEffect(() => {
    fetchData();
  }, [type]);

  async function fetchData() {
    setIsLoading(true);
    try {
      const res = await fetch(`/api/admin/youtube/${type}`);
      const result = await res.json();
      setData(result);
      setFilteredData(result);
      
      // If type is video, fetch categories for filtering
      if (type === "video") {
        const categoriesRes = await fetch("/api/admin/youtube/category");
        const categories = await categoriesRes.json();
        setAvailableCategories(categories);
      }
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setIsLoading(false);
    }
  }

  // Filter and sort data
  useEffect(() => {
    let result = [...data];
    
    // Apply search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(item => 
        (item.title || item.name).toLowerCase().includes(query) ||
        (item.description || "").toLowerCase().includes(query) ||
        (type === "video" && (item as Video).category?.name.toLowerCase().includes(query))
      );
    }
    
    // Apply category filter for videos
    if (type === "video" && categoryFilter !== "all") {
      result = result.filter(item => (item as Video).categoryId === categoryFilter);
    }
    
    // Apply sorting
    result.sort((a, b) => {
      let aValue, bValue;
      
      if (sortField === "category") {
        aValue = (a as Video).category?.name || "";
        bValue = (b as Video).category?.name || "";
      } else {
        aValue = a[sortField] || "";
        bValue = b[sortField] || "";
      }
      
      if (typeof aValue === "string" && typeof bValue === "string") {
        return sortDirection === "asc" 
          ? aValue.localeCompare(bValue) 
          : bValue.localeCompare(aValue);
      }
      
      return sortDirection === "asc" 
        ? (aValue > bValue ? 1 : -1) 
        : (aValue < bValue ? 1 : -1);
    });
    
    setFilteredData(result);
    setCurrentPage(1); // Reset to first page when filters change
  }, [data, searchQuery, sortField, sortDirection, categoryFilter, type]);

  async function handleDelete(id: string) {
    if (!confirm("Are you sure you want to delete this item?")) return;

    try {
      await fetch(`/api/admin/youtube/${type}/${id}`, { method: "DELETE" });
      fetchData();
      // Notify parent component about data change
      if (onDataChange) onDataChange();
    } catch (error) {
      console.error("Error deleting item:", error);
    }
  }

  function handleSort(field: SortField) {
    if (sortField === field) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortDirection("asc");
    }
  }

  function renderSortIcon(field: SortField) {
    if (sortField !== field) return <ChevronDownIcon className="h-4 w-4 opacity-50" />;
    return sortDirection === "asc" ? <SortAscIcon className="h-4 w-4" /> : <SortDescIcon className="h-4 w-4" />;
  }

  // Handle form close with data refresh
  const handleFormClose = () => {
    setShowForm(false);
    fetchData();
    // Notify parent component about data change
    if (onDataChange) onDataChange();
  };

  // Pagination logic
  const totalPages = Math.ceil(filteredData.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedData = filteredData.slice(startIndex, startIndex + itemsPerPage);

  const getPageNumbers = () => {
    const pages = [];
    const maxVisiblePages = 5;
    
    let startPage = Math.max(1, currentPage - Math.floor(maxVisiblePages / 2));
    let endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);
    
    if (endPage - startPage + 1 < maxVisiblePages) {
      startPage = Math.max(1, endPage - maxVisiblePages + 1);
    }
    
    for (let i = startPage; i <= endPage; i++) {
      pages.push(i);
    }
    
    return pages;
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
        <div className="relative w-full sm:max-w-sm">
          <SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder={`Search ${type}s...`}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        
        <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
          {type === "video" && (
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger className="w-full sm:w-[180px]">
                <FilterIcon className="h-4 w-4 mr-2" />
                <SelectValue placeholder="Filter by category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                {availableCategories.map(category => (
                  <SelectItem key={category.id} value={category.id}>
                    {category.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
          
          <Select 
            value={itemsPerPage.toString()} 
            onValueChange={(value) => setItemsPerPage(Number(value))}
          >
            <SelectTrigger className="w-full sm:w-[120px]">
              <span className="flex items-center">
                <span className="mr-2">Show:</span>
                <SelectValue placeholder="10" />
              </span>
            </SelectTrigger>
            <SelectContent>
              {itemsPerPageOptions.map(option => (
                <SelectItem key={option} value={option.toString()}>
                  {option}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          
          <Button 
            onClick={() => { setEditingItem(null); setShowForm(true); }}
            className="w-full sm:w-auto"
          >
            Add New {type}
          </Button>
        </div>
      </div>

      {showForm && (
        <Form 
          type={type} 
          item={editingItem} 
          onClose={handleFormClose} 
        />
      )}

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead 
                className="cursor-pointer hover:bg-accent"
                onClick={() => handleSort(type === "video" ? "title" : "name")}
              >
                <div className="flex items-center">
                  {type === "video" ? "Title" : "Name"}
                  {renderSortIcon(type === "video" ? "title" : "name")}
                </div>
              </TableHead>
              {type === "video" && (
                <TableHead 
                  className="cursor-pointer hover:bg-accent"
                  onClick={() => handleSort("category")}
                >
                  <div className="flex items-center">
                    Category
                    {renderSortIcon("category")}
                  </div>
                </TableHead>
              )}
              <TableHead>
                {type === "video" ? "Description" : "Description"}
              </TableHead>
              {type === "video" && (
                <TableHead>Link</TableHead>
              )}
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              Array.from({ length: 5 }).map((_, index) => (
                <TableRow key={index}>
                  <TableCell><Skeleton className="h-4 w-full" /></TableCell>
                  {type === "video" && <TableCell><Skeleton className="h-4 w-full" /></TableCell>}
                  <TableCell><Skeleton className="h-4 w-full" /></TableCell>
                  {type === "video" && <TableCell><Skeleton className="h-4 w-full" /></TableCell>}
                  <TableCell className="flex gap-2 justify-end">
                    <Skeleton className="h-8 w-16" />
                    <Skeleton className="h-8 w-16" />
                  </TableCell>
                </TableRow>
              ))
            ) : paginatedData.length > 0 ? (
              paginatedData.map((item: any) => (
                <TableRow key={item.id}>
                  <TableCell className="font-medium">{item.title || item.name}</TableCell>
                  {type === "video" && (
                    <TableCell>
                      <Badge variant="outline">{item.category?.name}</Badge>
                    </TableCell>
                  )}
                  <TableCell className="max-w-xs truncate">{item.description || item.desc || "-"}</TableCell>
                  {type === "video" && (
                    <TableCell>
                      <a 
                        href={item.link} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:underline dark:text-blue-400 text-sm"
                      >
                        View Video
                      </a>
                    </TableCell>
                  )}
                  <TableCell>
                    <div className="flex gap-2 justify-end">
                      <Button 
                        size="sm" 
                        variant="outline"
                        onClick={() => { setEditingItem(item); setShowForm(true); }}
                      >
                        Edit
                      </Button>
                      <Button 
                        size="sm" 
                        variant="destructive"
                        onClick={() => handleDelete(item.id)}
                      >
                        Delete
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={type === "video" ? 5 : 3} className="h-24 text-center">
                  No {type}s found.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {filteredData.length > 0 && (
        <div className="flex items-center justify-between px-2">
          <div className="text-sm text-muted-foreground">
            Showing <strong>{startIndex + 1}</strong> to <strong>{Math.min(startIndex + itemsPerPage, filteredData.length)}</strong> of <strong>{filteredData.length}</strong> {type}s
          </div>
          
          <Pagination>
            <PaginationContent>
              <PaginationItem>
                <PaginationPrevious 
                  onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                  className={currentPage === 1 ? "pointer-events-none opacity-50" : "cursor-pointer"}
                />
              </PaginationItem>
              
              {getPageNumbers().map(page => (
                <PaginationItem key={page}>
                  <PaginationLink
                    isActive={currentPage === page}
                    onClick={() => setCurrentPage(page)}
                    className="cursor-pointer"
                  >
                    {page}
                  </PaginationLink>
                </PaginationItem>
              ))}
              
              <PaginationItem>
                <PaginationNext 
                  onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                  className={currentPage === totalPages ? "pointer-events-none opacity-50" : "cursor-pointer"}
                />
              </PaginationItem>
            </PaginationContent>
          </Pagination>
        </div>
      )}
    </div>
  );
}