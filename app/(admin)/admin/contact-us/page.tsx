"use client";

import React, { useEffect, useState, useMemo, useCallback } from "react";
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
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
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
  User,
  Tag,
  MessageSquare,
  RefreshCw,
} from "lucide-react";
import { toast } from "sonner";

type ContactUs = {
  id: string;
  name: string;
  email: string;
  subject: string;
  message: string;
  status: "PENDING" | "RESOLVED" | "DELETED";
  threadId: string | null;
  parentId: string | null;
  conversationType: "NEW_INQUIRY" | "ADMIN_REPLY" | "USER_REPLY";
  createdAt: string;
  updatedAt: string;
};

export default function AdminContactUsPage() {
  const [contacts, setContacts] = useState<ContactUs[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [globalFilter, setGlobalFilter] = useState("");

  const [viewOpen, setViewOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [selected, setSelected] = useState<ContactUs | null>(null);
  const [statusUpdateOpen, setStatusUpdateOpen] = useState(false);
  const [selectedStatus, setSelectedStatus] =
    useState<ContactUs["status"]>("PENDING");
  const [sendEmail, setSendEmail] = useState(false);
  const [emailMessage, setEmailMessage] = useState("");
  const [emailSubject, setEmailSubject] = useState("");
  const [sendingEmail, setSendingEmail] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [threadMessages, setThreadMessages] = useState<ContactUs[]>([]);
  const [showRepliesOnly, setShowRepliesOnly] = useState(false);

  // Fetch contacts
  const fetchContacts = async () => {
    setLoading(true);
    setRefreshing(true);
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
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchContacts();
  }, []);

  // Handle refresh
  const handleRefresh = async () => {
    await fetchContacts();
    toast.success("Contacts refreshed successfully");
  };

  // Load conversation thread
  const loadThreadMessages = useCallback(async (threadId: string) => {
    if (!threadId) return;
    
    try {
      const threadContacts = contacts.filter(c => c.threadId === threadId);
      // Sort by creation date to show conversation flow
      const sorted = [...threadContacts].sort((a, b) => 
        new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
      );
      setThreadMessages(sorted);
    } catch (err) {
      console.error('Failed to load thread:', err);
      setThreadMessages([]);
    }
  }, [contacts]);

  // Update status
  const handleStatusUpdate = async () => {
    if (!selected) return;
    
    setSendingEmail(true);
    try {
      // Update status
      const res = await fetch(`/api/contact-us/${selected.id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ status: selectedStatus }),
      });

      if (!res.ok) throw new Error("Failed to update status");

      // Send email if requested
      if (sendEmail && emailMessage && emailSubject) {
        console.log('📧 Sending email with payload:', {
          to: selected.email,
          subject: emailSubject,
          userName: selected.name,
          status: selectedStatus,
          contactId: selected.id,
          threadId: selected.threadId,
        });

        const emailRes = await fetch("/api/contact-us/send-email", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            to: selected.email,
            subject: emailSubject,
            message: emailMessage,
            userName: selected.name,
            status: selectedStatus,
            contactId: selected.id,
            threadId: selected.threadId,
          }),
        });

        const emailResult = await emailRes.json();
        console.log('📬 Email API response:', emailResult);

        if (emailRes.ok) {
          toast.success("Status updated and email sent successfully");
        } else {
          console.error("❌ Failed to send email:", emailResult);
          toast.error(`Status updated but email sending failed: ${emailResult.error || 'Unknown error'}`);
        }
      } else {
        toast.success("Status updated successfully");
      }

      setStatusUpdateOpen(false);
      setSelected(null);
      setSendEmail(false);
      setEmailMessage("");
      setEmailSubject("");
      setThreadMessages([]);
      fetchContacts();
    } catch (err) {
      console.error(err);
      toast.error("Failed to update status");
    } finally {
      setSendingEmail(false);
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
  const openViewModal = useCallback((contact: ContactUs) => {
    setSelected(contact);
    
    // Load conversation thread if exists
    if (contact.threadId) {
      loadThreadMessages(contact.threadId);
    } else {
      setThreadMessages([]);
    }
    
    setViewOpen(true);
  }, [loadThreadMessages]);

  // Open status update modal
  const openStatusUpdateModal = useCallback((contact: ContactUs) => {
    setSelected(contact);
    setSelectedStatus(contact.status);
    setSendEmail(false);
    setEmailMessage("");
    setEmailSubject(getDefaultEmailSubject(contact.status));
    
    // Load conversation thread if exists
    if (contact.threadId) {
      loadThreadMessages(contact.threadId);
    } else {
      setThreadMessages([]);
    }
    
    setStatusUpdateOpen(true);
  }, [loadThreadMessages]);

  // Open delete modal
  const openDeleteModal = useCallback((contact: ContactUs) => {
    setSelected(contact);
    setDeleteOpen(true);
  }, []);

  // Get default email subject based on status
  const getDefaultEmailSubject = (status: ContactUs["status"]) => {
    switch (status) {
      case "RESOLVED":
        return "Your inquiry has been resolved - Unfiltered IITians";
      case "PENDING":
        return "Update on your inquiry - Unfiltered IITians";
      default:
        return "Regarding your inquiry - Unfiltered IITians";
    }
  };

  // Update email subject when status changes
  const handleStatusChange = (value: ContactUs["status"]) => {
    setSelectedStatus(value);
    if (!emailSubject || emailSubject === getDefaultEmailSubject(selectedStatus)) {
      setEmailSubject(getDefaultEmailSubject(value));
    }
  };

  // Get thread message CSS class
  const getThreadMessageClass = (type: ContactUs["conversationType"]) => {
    switch (type) {
      case 'ADMIN_REPLY':
        return 'bg-purple-50 dark:bg-purple-950 border-purple-200 dark:border-purple-800';
      case 'USER_REPLY':
        return 'bg-cyan-50 dark:bg-cyan-950 border-cyan-200 dark:border-cyan-800';
      default:
        return 'bg-blue-50 dark:bg-blue-950 border-blue-200 dark:border-blue-800';
    }
  };

  // Status badge component
  const StatusBadge = ({ status }: { status: ContactUs["status"] }) => {
    const statusConfig = {
      PENDING: {
        label: "Pending",
        variant: "secondary" as const,
        style: "bg-yellow-800" as const,
      },
      RESOLVED: {
        label: "Resolved",
        variant: "default" as const,
        style: "bg-green-800 text-white" as const,
      },
      DELETED: { 
        label: "Deleted", 
        variant: "destructive" as const, 
        style: "" as const 
      },
    };

    const config = statusConfig[status];

    return (
      <Badge variant={config.variant} className={config.style}>
        {config.label}
      </Badge>
    );
  };

  // Conversation type badge component
  const ConversationTypeBadge = ({ type }: { type: ContactUs["conversationType"] }) => {
    const typeConfig = {
      NEW_INQUIRY: {
        label: "New Inquiry",
        icon: "📩",
        style: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
      },
      ADMIN_REPLY: {
        label: "Admin Reply",
        icon: "💬",
        style: "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200",
      },
      USER_REPLY: {
        label: "User Reply",
        icon: "✉️",
        style: "bg-cyan-100 text-cyan-800 dark:bg-cyan-900 dark:text-cyan-200",
      },
    };

    const config = typeConfig[type];

    return (
      <Badge variant="outline" className={`${config.style} text-xs`}>
        {config.icon} {config.label}
      </Badge>
    );
  };

  // Columns - Memoized to prevent infinite re-renders
  const columns: ColumnDef<ContactUs>[] = useMemo(() => [
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
      accessorKey: "conversationType",
      header: "Type",
      cell: (info) => {
        const type = info.getValue() as ContactUs["conversationType"];
        return <ConversationTypeBadge type={type} />;
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
  ], [openViewModal, openStatusUpdateModal, openDeleteModal]);  // Add handler dependencies

  // helper function
  const getStr = (val: unknown) =>
    typeof val === "string" ? val.toLowerCase() : "";

  // Filter contacts based on showRepliesOnly - show only ADMIN_REPLY and USER_REPLY messages
  const filteredContacts = useMemo(() => 
    showRepliesOnly 
      ? contacts.filter(c => c.conversationType === 'ADMIN_REPLY' || c.conversationType === 'USER_REPLY')
      : contacts,
    [showRepliesOnly, contacts]
  );

  // Table instance
  const table = useReactTable({
    data: filteredContacts,
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
        <div>
          <h1 className="text-2xl font-bold">Contact Messages</h1>
          <div className="text-sm text-muted-foreground mt-1">
            {table.getFilteredRowModel().rows.length} messages
          </div>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={handleRefresh}
          disabled={refreshing}
          className="gap-2"
        >
          <RefreshCw className={`h-4 w-4 ${refreshing ? "animate-spin" : ""}`} />
          Refresh
        </Button>
      </div>

      <div className="flex items-center justify-between mb-4 gap-4">
        <Input
          placeholder="Search contacts..."
          value={globalFilter}
          onChange={(e) => setGlobalFilter(e.target.value)}
          className="max-w-md"
        />
        <Button
          variant={showRepliesOnly ? "default" : "outline"}
          size="sm"
          onClick={() => setShowRepliesOnly(!showRepliesOnly)}
          className="gap-2 whitespace-nowrap"
        >
          <MessageSquare className="h-4 w-4" />
          {showRepliesOnly ? "All Contacts" : "Replies"}
        </Button>
      </div>

      <div className="rounded-md border overflow-hidden">
        <div className="overflow-x-auto scrollbar-thin scrollbar-thumb-gray-400 scrollbar-track-gray-100">
          <Table className="min-w-[900px]">
            <TableHeader className="bg-gray-900 text-white">
              {table.getHeaderGroups().map((headerGroup) => (
                <TableRow key={headerGroup.id}>
                  {headerGroup.headers.map((header) => (
                    <TableHead key={header.id} className="whitespace-nowrap">
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
                      <TableCell key={cell.id} className="whitespace-nowrap">
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
                    {selected.message.split('\n\n-------')[0]}
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
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Update Status</DialogTitle>
            <DialogDescription>
              Update the status for {selected?.name}&apos;s message and optionally send them an email notification
            </DialogDescription>
          </DialogHeader>
          {selected && (
            <div className="space-y-4 py-4">
              <div>
                <Label>Status</Label>
                <Select
                  value={selectedStatus}
                  onValueChange={handleStatusChange}
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

              <div className="flex items-center space-x-2 p-4 border rounded-lg bg-muted/50">
                <Checkbox
                  id="send-email"
                  checked={sendEmail}
                  onCheckedChange={(checked) => setSendEmail(checked as boolean)}
                />
                <label
                  htmlFor="send-email"
                  className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                >
                  Send email notification to user
                </label>
              </div>

              {sendEmail && (
                <div className="space-y-4 p-4 border rounded-lg">
                  <div className="space-y-2">
                    <Label htmlFor="email-subject">Email Subject</Label>
                    <Input
                      id="email-subject"
                      value={emailSubject}
                      onChange={(e) => setEmailSubject(e.target.value)}
                      placeholder="Enter email subject"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="email-message">Email Message</Label>
                    <Textarea
                      id="email-message"
                      value={emailMessage}
                      onChange={(e) => setEmailMessage(e.target.value)}
                      placeholder={`Dear ${selected.name},\n\nThank you for reaching out to us regarding "${selected.subject}".\n\n[Your message here]\n\nBest regards,\nUnfiltered IITians Team`}
                      rows={8}
                      className="resize-none"
                    />
                    <p className="text-xs text-muted-foreground">
                      This message will be sent to: <strong>{selected.email}</strong>
                    </p>
                  </div>

                  {/* Conversation Thread History */}
                  {threadMessages.length > 0 && (
                    <div className="space-y-2 max-h-60 overflow-y-auto">
                      <strong className="text-sm">Conversation History:</strong>
                      {threadMessages.map((msg) => (
                        <div 
                          key={msg.id} 
                          className={`text-sm p-3 rounded border ${getThreadMessageClass(msg.conversationType)}`}
                        >
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-2">
                              <ConversationTypeBadge type={msg.conversationType} />
                              <span className="text-xs text-muted-foreground">
                                {new Date(msg.createdAt).toLocaleString('en-IN', {
                                  month: 'short',
                                  day: 'numeric',
                                  hour: '2-digit',
                                  minute: '2-digit',
                                })}
                              </span>
                            </div>
                          </div>
                          <p className="text-xs whitespace-pre-wrap">{msg.message.split('\n\n-------')[0]}</p>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Current/Original Message if not in thread view */}
                  {threadMessages.length === 0 && (
                    <div className="text-sm text-muted-foreground bg-blue-50 dark:bg-blue-950 p-3 rounded border border-blue-200 dark:border-blue-800">
                      <strong>Original Message:</strong>
                      <p className="mt-1 text-xs whitespace-pre-wrap">{selected.message.split('\n\n-------')[0]}</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setStatusUpdateOpen(false);
                setSendEmail(false);
                setEmailMessage("");
                setThreadMessages([]);
              }}
              disabled={sendingEmail}
            >
              Cancel
            </Button>
            <Button 
              onClick={handleStatusUpdate}
              disabled={sendingEmail || (sendEmail && (!emailMessage || !emailSubject))}
            >
              {sendingEmail ? (
                <>
                  <Mail className="w-4 h-4 mr-2 animate-spin" />
                  {sendEmail ? "Updating & Sending..." : "Updating..."}
                </>
              ) : (
                <>Update Status</>
              )}
            </Button>
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
