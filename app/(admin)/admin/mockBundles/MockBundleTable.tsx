"use client";

import { useState, useMemo } from "react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { 
  Trash2, 
  Edit2, 
  RefreshCw, 
  Search, 
  ChevronUp, 
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Filter,
  Package
} from "lucide-react";
import { toast } from "sonner";

interface MockBundle {
  id: string;
  title: string;
  description?: string;
  mockIds: string[];
  basePrice: number;
  discountedPrice?: number | null;
  status: "PUBLISHED" | "DRAFT" | "ARCHIVED";
  order?: number;
  createdAt: string;
  updatedAt: string;
}

interface Props {
  bundles: MockBundle[];
  loading: boolean;
  onEdit: (bundle: MockBundle) => void;
  onRefresh: () => void;
}

export const MockBundleTable = ({ bundles, loading, onEdit, onRefresh }: Props) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [sortField, setSortField] = useState<"title" | "price" | "status" | "order">("order");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc");
  const [currentPage, setCurrentPage] = useState(1);
  const [isReordering, setIsReordering] = useState(false);
  const itemsPerPage = 10;

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this bundle? This action cannot be undone.")) return;
    try {
      const res = await fetch(`/api/admin/mockBundle?id=${id}`, { method: "DELETE" });
      const data = await res.json();
      if (res.ok) {
        alert(data.message || "Bundle deleted successfully");
        onRefresh();
      } else {
        alert(data.error || "Failed to delete bundle");
      }
    } catch (err: any) {
      console.error(err);
      alert(err.message || "Failed to delete bundle");
    }
  };

  // 🔄 Handle reordering mock bundles
  const handleReorderBundles = async (newOrder: MockBundle[]) => {
    try {
      setIsReordering(true);
      
      const mockBundleOrders = newOrder.map((bundle, index) => ({
        id: bundle.id,
        order: index + 1,
      }));

      const response = await fetch('/api/admin/mockBundle/reorder', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mockBundleOrders }),
      });

      if (!response.ok) throw new Error('Failed to reorder mock bundles');

      toast.success('Mock bundle order updated successfully');
      onRefresh();
    } catch (error) {
      console.error('Error reordering mock bundles:', error);
      toast.error('Failed to update mock bundle order');
    } finally {
      setIsReordering(false);
    }
  };

  // Move bundle up in order
  const moveUp = (index: number) => {
    if (index === 0) return;
    const newBundles = [...filteredAndSortedBundles];
    [newBundles[index], newBundles[index - 1]] = [newBundles[index - 1], newBundles[index]];
    handleReorderBundles(newBundles);
  };

  // Move bundle down in order
  const moveDown = (index: number) => {
    if (index === filteredAndSortedBundles.length - 1) return;
    const newBundles = [...filteredAndSortedBundles];
    [newBundles[index], newBundles[index + 1]] = [newBundles[index + 1], newBundles[index]];
    handleReorderBundles(newBundles);
  };

  const handleSort = (field: "title" | "price" | "status" | "order") => {
    if (sortField === field) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortDirection("asc");
    }
  };

  // Filter and sort bundles
  const filteredAndSortedBundles = useMemo(() => {
    const filtered = bundles.filter(bundle =>
      bundle.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      bundle.status.toLowerCase().includes(searchTerm.toLowerCase())
    );

    // Sort bundles
    filtered.sort((a, b) => {
      let aValue, bValue;
      
      switch (sortField) {
        case "price":
          aValue = a.discountedPrice ?? a.basePrice;
          bValue = b.discountedPrice ?? b.basePrice;
          break;
        case "status":
          aValue = a.status;
          bValue = b.status;
          break;
        case "order":
          aValue = a.order || 0;
          bValue = b.order || 0;
          break;
        case "title":
        default:
          aValue = a.title;
          bValue = b.title;
      }

      if (aValue < bValue) return sortDirection === "asc" ? -1 : 1;
      if (aValue > bValue) return sortDirection === "asc" ? 1 : -1;
      return 0;
    });

    return filtered;
  }, [bundles, searchTerm, sortField, sortDirection]);

  // Pagination
  const totalPages = Math.ceil(filteredAndSortedBundles.length / itemsPerPage);
  const paginatedBundles = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return filteredAndSortedBundles.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredAndSortedBundles, currentPage, itemsPerPage]);

  const SortIcon = ({ field }: { field: "title" | "price" | "status" | "order" }) => {
    if (sortField !== field) return <ChevronUp className="h-4 w-4 opacity-30" />;
    return sortDirection === "asc" ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />;
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 space-y-4">
        <RefreshCw className="h-8 w-8 animate-spin text-primary" />
        <p className="text-muted-foreground">Loading bundles...</p>
      </div>
    );
  }

  return (
    <div className="bg-card rounded-xl border shadow-sm">
      {/* Header with Search and Controls */}
      <div className="p-4 border-b">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search bundles by title or status..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 border-primary/20 focus:border-primary/50"
            />
          </div>
          
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={onRefresh}
              className="flex items-center gap-2"
            >
              <RefreshCw className="h-4 w-4" />
              Refresh
            </Button>
            
            <Button
              variant="outline"
              size="sm"
              className="flex items-center gap-2"
              onClick={() => {
                setSearchTerm("");
                setSortField("title");
                setSortDirection("asc");
                setCurrentPage(1);
              }}
            >
              <Filter className="h-4 w-4" />
              Clear Filters
            </Button>
          </div>
        </div>
      </div>

      {/* Results Info */}
  

      {/* Table */}
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent bg-slate-900 my-3">
              <TableHead 
                className="cursor-pointer hover:bg-accent/50 transition-colors w-20"
                onClick={() => handleSort("order")}
              >
                <div className="flex items-center gap-2">
                  Order
                  <SortIcon field="order" />
                </div>
              </TableHead>
              <TableHead 
                className="cursor-pointer hover:bg-accent/50 transition-colors "
                onClick={() => handleSort("title")}
              >
                <div className="flex items-center gap-2">
                  <Package className="h-4 w-4" />
                  Title
                  <SortIcon field="title" />
                </div>
              </TableHead>
              <TableHead 
                className="cursor-pointer hover:bg-accent/50 transition-colors"
                onClick={() => handleSort("price")}
              >
                <div className="flex items-center gap-2">
                  Price
                  <SortIcon field="price" />
                </div>
              </TableHead>
              <TableHead 
                className="cursor-pointer hover:bg-accent/50 transition-colors"
                onClick={() => handleSort("status")}
              >
                <div className="flex items-center gap-2">
                  Status
                  <SortIcon field="status" />
                </div>
              </TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {paginatedBundles.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-10 text-muted-foreground ">
                  {searchTerm ? (
                    <div className="flex flex-col items-center space-y-2">
                      <Search className="h-8 w-8" />
                      <p>No bundles found matching "{searchTerm}"</p>
                      <Button variant="outline" size="sm" onClick={() => setSearchTerm("")}>
                        Clear search
                      </Button>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center space-y-2">
                      <Package className="h-8 w-8" />
                      <p>No bundles created yet</p>
                    </div>
                  )}
                </TableCell>
              </TableRow>
            ) : (
              paginatedBundles.map((bundle, index) => (
                <TableRow key={bundle.id} className="hover:bg-accent/50 transition-colors">
                  <TableCell className="w-20">
                    <div className="flex items-center gap-1">
                      <span className="font-medium">{bundle.order || 0}</span>
                      <div className="flex flex-col gap-1 ml-2">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => moveUp(index)}
                          disabled={index === 0 || isReordering}
                          className="h-6 w-6 p-0"
                        >
                          <ChevronUp className="h-3 w-3" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => moveDown(index)}
                          disabled={index === paginatedBundles.length - 1 || isReordering}
                          className="h-6 w-6 p-0"
                        >
                          <ChevronDown className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="font-medium">
                    <div>
                      <div className="font-semibold">{bundle.title}</div>
                      {bundle.description && (
                        <div className="text-sm text-muted-foreground mt-1 line-clamp-1">
                          {bundle.description}
                        </div>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-col">
                      <span className="font-semibold text-primary">
                        ₹{bundle.discountedPrice ?? bundle.basePrice}
                      </span>
                      {bundle.discountedPrice && bundle.basePrice && (
                        <span className="text-sm text-muted-foreground line-through">
                          ₹{bundle.basePrice}
                        </span>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant={bundle.status === "PUBLISHED" ? "default" : "secondary"}
                      className={
                        bundle.status === "PUBLISHED"
                          ? "bg-green-100 text-green-800 hover:bg-green-100 dark:bg-green-900/30 dark:text-green-300"
                          : "bg-yellow-100 text-yellow-800 hover:bg-yellow-100 dark:bg-yellow-900/30 dark:text-yellow-300"
                      }
                    >
                      {bundle.status}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex justify-end gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => onEdit(bundle)}
                        className="h-8 w-8 p-0 hover:bg-primary/10 hover:text-primary"
                      >
                        <Edit2 className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDelete(bundle.id)}
                        className="h-8 w-8 p-0 hover:bg-destructive/10 hover:text-destructive border-destructive/20 text-destructive"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
          
        </Table>
      </div>

          <div className="p-4 bg-muted/20 border-b mt-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between text-sm text-muted-foreground">
          <span>
            Showing {paginatedBundles.length} of {filteredAndSortedBundles.length} bundles
            {searchTerm && ` for "${searchTerm}"`}
          </span>
          <span>Page {currentPage} of {totalPages}</span>
        </div>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="p-4 border-t">
          <div className="flex items-center justify-between">
            <div className="text-sm text-muted-foreground">
              Showing {((currentPage - 1) * itemsPerPage) + 1} to {Math.min(currentPage * itemsPerPage, filteredAndSortedBundles.length)} of {filteredAndSortedBundles.length} entries
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                disabled={currentPage === 1}
                className="h-8 w-8 p-0"
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              
              <div className="flex items-center gap-1">
                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                  const pageNum = i + 1;
                  return (
                    <Button
                      key={pageNum}
                      variant={currentPage === pageNum ? "default" : "outline"}
                      size="sm"
                      onClick={() => setCurrentPage(pageNum)}
                      className="h-8 w-8 p-0"
                    >
                      {pageNum}
                    </Button>
                  );
                })}
                {totalPages > 5 && <span className="px-2">...</span>}
              </div>
              
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                disabled={currentPage === totalPages}
                className="h-8 w-8 p-0"
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};