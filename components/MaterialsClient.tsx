// components/materials/MaterialsClient.tsx
"use client";

import React, { useMemo, useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Search, Funnel, RefreshCw, ChevronLeft, ChevronRight } from "lucide-react";
import CategorySection from "./CategorySection";

type MaterialShape = {
  id: string;
  title: string;
  slug?: string | null;
  content?: string | null;
  pdfUrl?: string | null;
  youtubeLink?: string | null;
  tags: string[];
  order?: number | null;
  published: boolean;
  subjectId: string;
  createdAt?: string;
};

type CategoryShape = {
  id: string;
  name: string;
  desc?: string | null;
  materials: MaterialShape[];
};

export default function MaterialsClient({ initialCategories }: { initialCategories: CategoryShape[] }) {
  const [query, setQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string | "all">("all");
  const [selectedTag, setSelectedTag] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<"newest" | "oldest" | "titleAsc" | "titleDesc">("newest");
  const [page, setPage] = useState(1);
  const pageSize = 12;

  // flatten materials for global pagination/search
  const allMaterials = useMemo(() => {
    return initialCategories.flatMap((c) =>
      c.materials.map((m) => ({ ...m, category: { id: c.id, name: c.name } }))
    );
  }, [initialCategories]);

  // build list of unique tags for the filter bar
  const allTags = useMemo(() => {
    const s = new Set<string>();
    allMaterials.forEach((m) => (m.tags || []).forEach((t) => t && s.add(t)));
    return Array.from(s).sort();
  }, [allMaterials]);

  // apply filters
  const filtered = useMemo(() => {
    let arr = allMaterials.filter((m) => {
      if (selectedCategory !== "all" && m.category.id !== selectedCategory) return false;
      if (selectedTag && !(m.tags || []).includes(selectedTag)) return false;
      if (query.trim()) {
        const q = query.toLowerCase();
        return (
          (m.title || "").toLowerCase().includes(q) ||
          (m.content || "").toLowerCase().includes(q) ||
          (m.category.name || "").toLowerCase().includes(q)
        );
      }
      return true;
    });

    // sort
    arr = arr.sort((a, b) => {
      if (sortBy === "newest") return (b.createdAt || "").localeCompare(a.createdAt || "");
      if (sortBy === "oldest") return (a.createdAt || "").localeCompare(b.createdAt || "");
      if (sortBy === "titleAsc") return (a.title || "").localeCompare(b.title || "");
      if (sortBy === "titleDesc") return (b.title || "").localeCompare(a.title || "");
      return 0;
    });

    return arr;
  }, [allMaterials, selectedCategory, selectedTag, query, sortBy]);

  // derived pagination
  const total = filtered.length;
  const pages = Math.max(1, Math.ceil(total / pageSize));
  const paginated = filtered.slice((page - 1) * pageSize, page * pageSize);

  // grouped by category for display: keep only materials currently in paginated list
  const grouped = useMemo(() => {
    const map = new Map<string, { id: string; name: string; materials: MaterialShape[] }>();
    paginated.forEach((m) => {
      const catId = m.category.id;
      const catName = m.category.name;
      if (!map.has(catId)) map.set(catId, { id: catId, name: catName, materials: [] });
      map.get(catId)!.materials.push(m);
    });
    return Array.from(map.values());
  }, [paginated]);

  const resetFilters = () => {
    setQuery("");
    setSelectedCategory("all");
    setSelectedTag(null);
    setSortBy("newest");
    setPage(1);
  };

  return (
    <section className="space-y-8 max-w-6xl mx-auto px-4 py-8">
      {/* Centered Header */}
      <div className="text-center space-y-4">
        <h1 className="text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-primary via-primary/80 to-primary animate-pulse">
          Free Materials
        </h1>
        <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
          Browse our collection of free study materials, carefully categorized and easily searchable.
        </p>
      </div>

      {/* Search and Filter Section */}
      <div className="bg-card rounded-2xl p-6 shadow-lg border border-primary/10 transition-all duration-300 hover:shadow-primary/10 hover:shadow-xl">
        <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
          <div className="relative w-full md:w-auto flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search title, content or category..."
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
                setPage(1);
              }}
              className="pl-10 w-full bg-background/50 border-primary/20 focus:border-primary/50 focus:ring-1 focus:ring-primary/30 transition-colors"
            />
          </div>

          <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
            <Select 
              onValueChange={(v) => { setSelectedCategory(v as string | "all"); setPage(1); }}
            >
              <SelectTrigger className="w-full md:w-44 bg-background/50 border-primary/20 focus:border-primary/50 focus:ring-1 focus:ring-primary/30">
                <SelectValue>{selectedCategory === "all" ? "All Subjects" : initialCategories.find(c => c.id === selectedCategory)?.name}</SelectValue>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all" >All Subjects</SelectItem>
                {initialCategories.map((c) => (<SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>))}
              </SelectContent>
            </Select>

            <Select 
              onValueChange={(v) => { setSortBy(v as any); setPage(1); }}
            >
              <SelectTrigger className="w-full md:w-44 bg-background/50 border-primary/20 focus:border-primary/50 focus:ring-1 focus:ring-primary/30">
                <SelectValue>
                  {sortBy === "newest" ? "Newest" : sortBy === "oldest" ? "Oldest" : sortBy === "titleAsc" ? "Title A→Z" : "Title Z→A"}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="newest">Newest</SelectItem>
                <SelectItem value="oldest">Oldest</SelectItem>
                <SelectItem value="titleAsc">Title A→Z</SelectItem>
                <SelectItem value="titleDesc">Title Z→A</SelectItem>
              </SelectContent>
            </Select>

            <Button 
              variant="outline" 
              onClick={resetFilters} 
              className="flex items-center gap-2 bg-background/50 border-primary/20 hover:bg-primary/10 hover:text-primary transition-colors"
            >
              <RefreshCw className="h-4 w-4" /> Reset
            </Button>
          </div>
        </div>

        {/* Tag chips */}
        <div className="mt-6 flex gap-2 flex-wrap justify-center">
          <Badge 
            variant={selectedTag === null ? "default" : "outline"} 
            onClick={() => { setSelectedTag(null); setPage(1); }} 
            className="cursor-pointer transition-all duration-200 hover:bg-primary/80 hover:scale-105 px-3 py-1"
          >
            All tags
          </Badge>
          {allTags.map((t) => (
            <Badge
              key={t}
              variant={selectedTag === t ? "default" : "outline"}
              onClick={() => { setSelectedTag((prev) => (prev === t ? null : t)); setPage(1); }}
              className="cursor-pointer transition-all duration-200 hover:bg-primary/80 hover:scale-105 px-3 py-1"
            >
              {t}
            </Badge>
          ))}
        </div>
      </div>

      {/* Results info */}
      <div className="flex flex-col sm:flex-row justify-between items-center text-sm text-muted-foreground bg-card/30 rounded-xl p-4 border border-primary/10">
        <div className="font-medium">{total} materials found</div>
        <div className="text-primary font-semibold">Page {page} of {pages}</div>
      </div>

      {/* Category Sections (grouped by category for the current page) */}
      <div className="space-y-8">
        {grouped.length === 0 ? (
          <div className="text-center py-20 text-muted-foreground bg-card/50 rounded-2xl p-8 border border-dashed border-primary/20">
            <div className="text-2xl mb-2">No materials found</div>
            <p>Try adjusting your search or filters to find what you're looking for.</p>
          </div>
        ) : (
          grouped.map((g) => (
            <CategorySection key={g.id} category={g} />
          ))
        )}
      </div>

      {/* Pagination controls */}
      {pages > 1 && (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-card/50 rounded-2xl p-6 border border-primary/10">
          <div className="text-sm text-muted-foreground">
            Showing {Math.min(total, page * pageSize)} of {total} materials
          </div>
          <div className="flex gap-2">
            <Button 
              disabled={page === 1} 
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              className="gap-2 bg-primary/90 hover:bg-primary transition-all duration-300 hover:scale-105"
            >
              <ChevronLeft className="h-4 w-4" /> Previous
            </Button>
            <Button 
              disabled={page >= pages} 
              onClick={() => setPage((p) => Math.min(pages, p + 1))}
              className="gap-2 bg-primary/90 hover:bg-primary transition-all duration-300 hover:scale-105"
            >
              Next <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </section>
  );
}