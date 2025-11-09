"use client";

import { useState } from "react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Pencil, Trash2, Search, Mail, Eye } from "lucide-react";
import { format } from "date-fns";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent } from "@/components/ui/card";

interface Announcement {
  id: string;
  title: string;
  message: string;
  course?: {
    id: string;
    title: string;
  };
  sendEmail: boolean;
  createdAt: string;
  totalRecipients?: number;
  readCount?: number;
  emailDeliveredCount?: number;
}

interface AnnouncementTableProps {
  data: Announcement[];
  loading: boolean;
  onEdit: (announcement: Announcement) => void;
  onDelete: (id: string) => void;
}

export function AnnouncementTable({ data, loading, onEdit, onDelete }: AnnouncementTableProps) {
  const [search, setSearch] = useState("");
  const [courseFilter, setCourseFilter] = useState("all");
  const [emailFilter, setEmailFilter] = useState("all");

  const filteredData = data.filter(announcement => {
    const matchesSearch = announcement.title.toLowerCase().includes(search.toLowerCase()) ||
                         announcement.message.toLowerCase().includes(search.toLowerCase()) ||
                         announcement.course?.title.toLowerCase().includes(search.toLowerCase());
    
    const matchesCourse = courseFilter === "all" || announcement.course?.id === courseFilter;
    const matchesEmail = emailFilter === "all" || 
                        (emailFilter === "sent" && announcement.sendEmail) ||
                        (emailFilter === "not-sent" && !announcement.sendEmail);

    return matchesSearch && matchesCourse && matchesEmail;
  });

  const uniqueCourses = data
    .map(a => a.course)
    .filter((course, index, self) => 
      course && self.findIndex(c => c?.id === course.id) === index
    ) as { id: string; title: string }[];

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="flex gap-4">
          <Skeleton className="h-10 flex-1" />
          <Skeleton className="h-10 w-32" />
          <Skeleton className="h-10 w-40" />
        </div>
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} className="h-16 w-full" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search announcements..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        
        <Select value={courseFilter} onValueChange={setCourseFilter}>
          <SelectTrigger className="w-full sm:w-[180px]">
            <SelectValue placeholder="Filter by course" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Courses</SelectItem>
            {uniqueCourses.map(course => (
              <SelectItem key={course.id} value={course.id}>
                {course.title}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={emailFilter} onValueChange={setEmailFilter}>
          <SelectTrigger className="w-full sm:w-[180px]">
            <SelectValue placeholder="Email status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Types</SelectItem>
            <SelectItem value="sent">Email Sent</SelectItem>
            <SelectItem value="not-sent">No Email</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Mobile Card View */}
      <div className="block md:hidden space-y-4">
        {filteredData.length === 0 ? (
          <Card>
            <CardContent className="py-8 text-center text-muted-foreground">
              No announcements found
            </CardContent>
          </Card>
        ) : (
          filteredData.map((announcement) => (
            <Card key={announcement.id} className="overflow-hidden">
              <CardContent className="p-4 space-y-3">
                <div className="flex justify-between items-start gap-2">
                  <h3 className="font-medium text-base line-clamp-2 flex-1">
                    {announcement.title}
                  </h3>
                  <div className="flex gap-1 flex-shrink-0">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => onEdit(announcement)}
                      className="h-8 w-8"
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => onDelete(announcement.id)}
                      className="h-8 w-8 text-destructive hover:text-destructive"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
                
                <div className="flex flex-wrap gap-2">
                  <Badge variant="outline" className="text-xs">
                    {announcement.course?.title || "Unknown Course"}
                  </Badge>
                  {announcement.sendEmail ? (
                    <Badge variant="secondary" className="gap-1 text-xs">
                      <Mail className="h-3 w-3" />
                      Sent
                    </Badge>
                  ) : (
                    <Badge variant="outline" className="text-xs">No Email</Badge>
                  )}
                </div>

                <div className="flex justify-between items-center text-sm text-muted-foreground">
                  <div className="flex items-center gap-2">
                    <Eye className="h-4 w-4" />
                    <span>
                      {announcement.readCount || 0}/{announcement.totalRecipients || 0}
                    </span>
                  </div>
                  <span className="text-xs">
                    {format(new Date(announcement.createdAt), "MMM d, yyyy")}
                  </span>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Desktop Table View */}
      <div className="hidden md:block rounded-md border overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Title</TableHead>
              <TableHead>Course</TableHead>
              <TableHead>Recipients</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Created</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredData.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                  No announcements found
                </TableCell>
              </TableRow>
            ) : (
              filteredData.map((announcement) => (
                <TableRow key={announcement.id}>
                  <TableCell className="font-medium max-w-xs">
                    <div className="line-clamp-2">{announcement.title}</div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">
                      {announcement.course?.title || "Unknown Course"}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Eye className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm">
                        {announcement.readCount || 0}/{announcement.totalRecipients || 0}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell>
                    {announcement.sendEmail ? (
                      <Badge variant="secondary" className="gap-1">
                        <Mail className="h-3 w-3" />
                        Sent
                      </Badge>
                    ) : (
                      <Badge variant="outline">No Email</Badge>
                    )}
                  </TableCell>
                  <TableCell>
                    {format(new Date(announcement.createdAt), "MMM d, yyyy")}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => onEdit(announcement)}
                        className="h-8 w-8"
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => onDelete(announcement.id)}
                        className="h-8 w-8 text-destructive hover:text-destructive"
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

      {filteredData.length > 0 && (
        <div className="text-sm text-muted-foreground text-center">
          Showing {filteredData.length} of {data.length} announcements
        </div>
      )}
    </div>
  );
}