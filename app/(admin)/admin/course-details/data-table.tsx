"use client";

import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

export default function DataTable({ data }: { data: any[] }) {
  const handleDelete = async (id: string) => {
    await fetch(`/api/admin/course-details/${id}`, { method: "DELETE" });
    window.location.reload();
  };

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Title</TableHead>
          <TableHead>Description</TableHead>
          <TableHead>Course</TableHead>
          <TableHead>Actions</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {data.map((detail) => (
          <TableRow key={detail.id}>
            <TableCell>{detail.title}</TableCell>
            <TableCell>{detail.description}</TableCell>
            <TableCell>{detail.course?.title}</TableCell>
            <TableCell>
              <Button
                variant="destructive"
                onClick={() => handleDelete(detail.id)}
              >
                Delete
              </Button>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
