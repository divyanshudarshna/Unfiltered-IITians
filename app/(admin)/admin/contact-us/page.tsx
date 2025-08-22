"use client";

import React, { useEffect, useState } from "react";
import { Label } from "recharts";
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
import { Badge } from "@/components/ui/badge";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertCircle,
  Eye,
  Trash2,
  ArrowLeft,
  ArrowRight,
  Mail,
  Calendar,
} from "lucide-react";
import { toast } from "sonner";

type ContactUs = {
  id: string;
  name: string;
  email: string;
  subject: string;
  message: string;
  status: "PENDING" | "RESOLVED" | "DELETED";
  createdAt: string;
  updatedAt: string;
};

import { User, Tag, MessageSquare } from "lucide-react";

export default function AdminContactUsPage() {
  const [contacts, setContacts] = useState<ContactUs[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [globalFilter, setGlobalFilter] = useState("");

  // Modal states
  const [viewOpen, setViewOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [selected, setSelected] = useState<ContactUs | null>(null);
  const [statusUpdateOpen, setStatusUpdateOpen] = useState(false);
  const [selectedStatus, setSelectedStatus] =
    useState<ContactUs["status"]>("PENDING");

  // Fetch contacts
  const fetchContacts = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/contact-us");
      if (!res.ok) throw new Error("Failed to fetch contacts");
      const data = await res.json();
      setContacts(data);
      setError(null);
    } catch (err) {
      console.error(err);
      setError("Failed to load contacts. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchContacts();
  }, []);

  // Update status
  const handleStatusUpdate = async () => {
    if (!selected) return;
    try {
      const res = await fetch(`/api/contact-us/${selected.id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ status: selectedStatus }),
      });

      if (!res.ok) throw new Error("Failed to update status");

      setStatusUpdateOpen(false);
      setSelected(null);
      fetchContacts();

      toast.success("Status updated successfully");
    } catch (err) {
      console.error(err);
      toast.error("Failed to update status");
    }
  };

  // Delete contact
  const handleDelete = async () => {
    if (!selected) return;
    try {
      const res = await fetch(`/api/contact-us/${selected.id}`, {
        method: "DELETE",
      });

      if (!res.ok) throw new Error("Failed to delete contact");

      setDeleteOpen(false);
      setSelected(null);
      fetchContacts();

      toast.success("Contact deleted successfully");
    } catch (err) {
      console.error(err);
      toast.error("Failed to delete contact");
    }
  };

  // Open view modal
  const openViewModal = (contact: ContactUs) => {
    setSelected(contact);
    setViewOpen(true);
  };

  // Open status update modal
  const openStatusUpdateModal = (contact: ContactUs) => {
    setSelected(contact);
    setSelectedStatus(contact.status);
    setStatusUpdateOpen(true);
  };

  // Open delete modal
  const openDeleteModal = (contact: ContactUs) => {
    setSelected(contact);
    setDeleteOpen(true);
  };

  // Status badge component
  const StatusBadge = ({ status }: { status: ContactUs["status"] }) => {
    const statusConfig = {
      PENDING: {
        label: "Pending",
        variant: "secondary",
        style: "bg-yellow-800" as const,
      },
      RESOLVED: {
        label: "Resolved",
        variant: "default",
        style: "bg-green-800 text-white" as const,
      },
      DELETED: { label: "Deleted", variant: "destructive", style: "" as const },
    };

    const config = statusConfig[status];

    return (
      <Badge variant={config.variant} className={config.style}>
        {config.label}
      </Badge>
    );
  };

  // Columns
  const columns: ColumnDef<ContactUs>[] = [
    {
      accessorKey: "name",
      header: "Name",
      cell: (info) => (
        <span className="font-medium">{info.getValue() as string}</span>
      ),
    },
    {
      accessorKey: "email",
      header: "Email",
      cell: (info) => (
        <span className="flex items-center gap-2">
          <Mail className="w-4 h-4" /> {info.getValue() as string}
        </span>
      ),
    },
    {
      accessorKey: "subject",
      header: "Subject",
      cell: (info) => {
        const value = info.getValue() as string | undefined;
        if (!value) return <span className="text-muted-foreground">—</span>;

        const truncated =
          value.length > 40 ? value.slice(0, 40) + "..." : value;

        return (
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <span className="cursor-pointer">{truncated}</span>
              </TooltipTrigger>
              <TooltipContent className="max-w-xs whitespace-pre-wrap">
                <p>{value}</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        );
      },
    },
    {
      accessorKey: "status",
      header: "Status",
      cell: (info) => {
        const status = info.getValue() as ContactUs["status"];
        return <StatusBadge status={status} />;
      },
    },
    {
      accessorKey: "createdAt",
      header: "Received",
      cell: (info) => (
        <span className="text-sm text-muted-foreground flex items-center gap-2">
          <Calendar className="w-4 h-4" />
          {new Date(info.getValue() as string).toLocaleDateString("en-IN")}
        </span>
      ),
    },
    {
      id: "actions",
      header: "Actions",
      cell: ({ row }) => {
        const contact = row.original;
        return (
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => openViewModal(contact)}
            >
              <Eye className="w-4 h-4 mr-1" /> View
            </Button>
            <Button
              variant="default"
              size="sm"
              onClick={() => openStatusUpdateModal(contact)}
            >
              Update Status
            </Button>
            <Button
              variant="destructive"
              size="sm"
              onClick={() => openDeleteModal(contact)}
            >
              <Trash2 className="w-4 h-4 " />
            </Button>
          </div>
        );
      },
    },
  ];

  // helper function
  const getStr = (val: unknown) =>
    typeof val === "string" ? val.toLowerCase() : "";

  // Table instance
  const table = useReactTable({
    data: contacts,
    columns,
    state: { globalFilter },
    onGlobalFilterChange: setGlobalFilter,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    globalFilterFn: (row, _columnId, filterValue) => {
      const search = filterValue.toLowerCase();

      return (
        getStr(row.getValue("name")).includes(search) ||
        getStr(row.getValue("email")).includes(search) ||
        getStr(row.getValue("subject")).includes(search) ||
        getStr(row.getValue("status")).includes(search)
      );
    },
  });

  if (loading) return <div className="p-6">Loading contacts...</div>;
  if (error)
    return (
      <div className="p-6 text-red-600 flex items-center">
        <AlertCircle className="w-5 h-5 mr-2" /> {error}
      </div>
    );

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Contact Messages</h1>
        <div className="text-sm text-muted-foreground">
          {table.getFilteredRowModel().rows.length} messages
        </div>
      </div>

      <div className="flex items-center justify-between mb-4">
        <Input
          placeholder="Search contacts..."
          value={globalFilter}
          onChange={(e) => setGlobalFilter(e.target.value)}
          className="max-w-md"
        />
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader className="bg-gray-900 text-white">
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
                  No contact messages found.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <div className="flex justify-between items-center mt-4">
        <Button
          variant="outline"
          size="sm"
          onClick={() => table.previousPage()}
          disabled={!table.getCanPreviousPage()}
        >
          <ArrowLeft className="w-4 h-4 mr-1" /> Previous
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => table.nextPage()}
          disabled={!table.getCanNextPage()}
        >
          Next <ArrowRight className="w-4 h-4 ml-1" />
        </Button>
      </div>

      {/* View Modal */}
      <Dialog open={viewOpen} onOpenChange={setViewOpen}>
        <DialogContent className="max-w-2xl rounded-2xl shadow-xl border">
          <DialogHeader className="space-y-1 pb-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary/10 rounded-full">
                <Mail className="w-5 h-5 text-primary" />
              </div>
              <div>
                <DialogTitle className="text-xl font-semibold tracking-tight">
                  Contact Message Details
                </DialogTitle>
                <DialogDescription className="text-sm text-muted-foreground">
                  Received on{" "}
                  {selected &&
                    new Date(selected.createdAt).toLocaleDateString("en-IN", {
                      weekday: "long",
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                    })}
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>

          {selected && (
            <div className="space-y-6 py-2">
              {/* Name & Email */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                    <User className="w-4 h-4" />
                    <span>Name</span>
                  </div>
                  <div className="p-3 bg-muted/50 rounded-lg border">
                    <p className="font-medium text-foreground">
                      {selected.name}
                    </p>
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                    <Mail className="w-4 h-4" />
                    <span>Email Address</span>
                  </div>
                  <div className="p-3 bg-muted/50 rounded-lg border">
                    <p className="font-medium text-foreground break-all">
                      {selected.email}
                    </p>
                  </div>
                </div>
              </div>

              {/* Subject */}
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                  <Tag className="w-4 h-4" />
                  <span>Subject</span>
                </div>
                <div className="p-3 bg-muted/50 rounded-lg border">
                  <p className="font-medium text-foreground">
                    {selected.subject}
                  </p>
                </div>
              </div>

              {/* Message */}
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                  <MessageSquare className="w-4 h-4" />
                  <span>Message</span>
                </div>
                <div className="p-4 bg-muted/50 rounded-lg border">
                  <p className="text-foreground whitespace-pre-wrap leading-relaxed">
                    {selected.message}
                  </p>
                </div>
              </div>

              {/* Status & Last Updated */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                    <AlertCircle className="w-4 h-4" />
                    <span>Status</span>
                  </div>
                  <div className="mt-1">
                    <StatusBadge status={selected.status} />
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                    <Calendar className="w-4 h-4" />
                    <span>Last Updated</span>
                  </div>
                  <div className="p-3 bg-muted/50 rounded-lg border">
                    <p className="font-medium text-foreground">
                      {new Date(selected.updatedAt).toLocaleDateString(
                        "en-IN",
                        {
                          year: "numeric",
                          month: "short",
                          day: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        }
                      )}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          <DialogFooter className="pt-4 border-t">
            <Button
              onClick={() => setViewOpen(false)}
              className="rounded-lg px-6 shadow-sm"
              variant="outline"
            >
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      {/* Status Update Modal */}
      <Dialog open={statusUpdateOpen} onOpenChange={setStatusUpdateOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Update Status</DialogTitle>
            <DialogDescription>
              Update the status for {selected?.name}'s message
            </DialogDescription>
          </DialogHeader>
          {selected && (
            <div className="space-y-4">
              <div>
                <Label>Status</Label>
                <Select
                  value={selectedStatus}
                  onValueChange={(value: ContactUs["status"]) =>
                    setSelectedStatus(value)
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="PENDING">Pending</SelectItem>
                    <SelectItem value="RESOLVED">Resolved</SelectItem>
                    <SelectItem value="DELETED">Deleted</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setStatusUpdateOpen(false)}
            >
              Cancel
            </Button>
            <Button onClick={handleStatusUpdate}>Update Status</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Modal */}
      <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Delete Contact Message</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete the message from {selected?.name}?
              This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteOpen(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDelete}>
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
