'use client';



import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu';
import { 
  Pagination, 
  PaginationContent, 
  PaginationItem, 
  PaginationLink, 
  PaginationNext, 
  PaginationPrevious 
} from '@/components/ui/pagination';
import { 
  Copy, 
  Download, 
  MoreHorizontal, 
  Trash2, 
  Mail, 
  Search,
  Users,
  Calendar,
  Send,
  X
} from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';

interface NewsletterSubscription {
  id: string;
  email: string;
  createdAt: string;
  updatedAt: string;
}

interface PaginationInfo {
  page: number;
  limit: number;
  totalCount: number;
  totalPages: number;
}

export default function NewsletterAdmin() {
  const [subscriptions, setSubscriptions] = useState<NewsletterSubscription[]>([]);
  const [pagination, setPagination] = useState<PaginationInfo>({
    page: 1,
    limit: 10,
    totalCount: 0,
    totalPages: 0,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedEmails, setSelectedEmails] = useState<string[]>([]);
  const [isEmailDialogOpen, setIsEmailDialogOpen] = useState(false);
  const [emailSubject, setEmailSubject] = useState('Important Update from Unfiltered IITians');
  const [emailMessage, setEmailMessage] = useState('');
  const [isSendingEmail, setIsSendingEmail] = useState(false);

  const fetchSubscriptions = async (page: number = 1) => {
    try {
      setIsLoading(true);
      const response = await fetch(`/api/admin/newsletter?page=${page}&limit=${pagination.limit}`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch subscriptions');
      }

      const data = await response.json();
      setSubscriptions(data.subscriptions);
      setPagination(data.pagination);
    } catch (error) {
      toast.error('Failed to load subscriptions');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchSubscriptions();
  }, []);

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this subscription?')) {
      return;
    }

    try {
      const response = await fetch('/api/admin/newsletter', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ id }),
      });

      if (!response.ok) {
        throw new Error('Failed to delete subscription');
      }

      toast.success('Subscription deleted successfully');
      fetchSubscriptions(pagination.page);
    } catch (error) {
      toast.error('Failed to delete subscription');
    }
  };

  const handleExportCSV = async () => {
    try {
      const response = await fetch('/api/admin/newsletter/export');
      
      if (!response.ok) {
        throw new Error('Failed to export subscriptions');
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `newsletter-subscriptions-${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      
      toast.success('Subscriptions exported successfully');
    } catch (error) {
      toast.error('Failed to export subscriptions');
    }
  };

  const copyToClipboard = (email: string) => {
    navigator.clipboard.writeText(email);
    toast.success('Email copied to clipboard');
  };

  const toggleEmailSelection = (email: string) => {
    setSelectedEmails(prev => 
      prev.includes(email) 
        ? prev.filter(e => e !== email)
        : [...prev, email]
    );
  };

  const toggleSelectAll = () => {
    if (selectedEmails.length === filteredSubscriptions.length) {
      setSelectedEmails([]);
    } else {
      setSelectedEmails(filteredSubscriptions.map(sub => sub.email));
    }
  };

  const handleOpenEmailDialog = () => {
    if (selectedEmails.length === 0) {
      toast.error('Please select at least one subscriber');
      return;
    }
    setIsEmailDialogOpen(true);
  };

  const handleSendEmail = async () => {
    if (!emailMessage.trim()) {
      toast.error('Please enter an email message');
      return;
    }

    setIsSendingEmail(true);
    try {
      const response = await fetch('/api/admin/newsletter/send-email', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          emails: selectedEmails,
          subject: emailSubject,
          message: emailMessage,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to send emails');
      }

      toast.success(`Email sent successfully to ${selectedEmails.length} subscriber(s)`);
      setIsEmailDialogOpen(false);
      setSelectedEmails([]);
      setEmailMessage('');
      setEmailSubject('Important Update from Unfiltered IITians');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to send emails');
    } finally {
      setIsSendingEmail(false);
    }
  };

  const filteredSubscriptions = subscriptions.filter(subscription =>
    subscription.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8 space-y-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div className="space-y-2">
            <Skeleton className="h-8 w-64" />
            <Skeleton className="h-4 w-48" />
          </div>
          <Skeleton className="h-10 w-32" />
        </div>
        
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-48" />
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="flex items-center space-x-4">
                  <Skeleton className="h-12 w-12 rounded-full" />
                  <div className="space-y-2">
                    <Skeleton className="h-4 w-64" />
                    <Skeleton className="h-4 w-32" />
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 space-y-6">
      {/* Header Section */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="space-y-2">
          <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
            Newsletter Subscriptions
          </h1>
          <p className="text-muted-foreground flex items-center gap-2">
            <Users className="w-4 h-4" />
            {pagination.totalCount} total subscribers
            {selectedEmails.length > 0 && (
              <Badge variant="secondary" className="ml-2">
                {selectedEmails.length} selected
              </Badge>
            )}
          </p>
        </div>
        
        <div className="flex gap-2">
          {selectedEmails.length > 0 && (
            <Button onClick={handleOpenEmailDialog} className="gap-2" variant="default">
              <Send className="w-4 h-4" />
              Send Email ({selectedEmails.length})
            </Button>
          )}
          <Button onClick={handleExportCSV} variant="outline" className="gap-2">
            <Download className="w-4 h-4" />
            Export CSV
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Subscribers</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{pagination.totalCount}</div>
            <p className="text-xs text-muted-foreground">
              All time newsletter subscribers
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Current Page</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{pagination.page}</div>
            <p className="text-xs text-muted-foreground">
              of {pagination.totalPages} pages
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Page Size</CardTitle>
            <Mail className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{pagination.limit}</div>
            <p className="text-xs text-muted-foreground">
              Subscribers per page
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Search and Table Section */}
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div className="space-y-1">
              <CardTitle>Subscriber List</CardTitle>
              <CardDescription>
                Manage your newsletter subscribers and their preferences
              </CardDescription>
            </div>
            <div className="relative w-full sm:w-64">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search subscribers..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-8"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12">
                    <Checkbox
                      checked={selectedEmails.length === filteredSubscriptions.length && filteredSubscriptions.length > 0}
                      onCheckedChange={toggleSelectAll}
                    />
                  </TableHead>
                  <TableHead className="w-[400px]">Email</TableHead>
                  <TableHead>Subscription Date</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredSubscriptions.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center py-8 text-muted-foreground">
                      <Mail className="w-12 h-12 mx-auto mb-4 opacity-50" />
                      <div>No subscribers found</div>
                      {searchTerm && (
                        <div className="text-sm">Try adjusting your search terms</div>
                      )}
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredSubscriptions.map((subscription) => (
                    <TableRow key={subscription.id} className="group">
                      <TableCell>
                        <Checkbox
                          checked={selectedEmails.includes(subscription.email)}
                          onCheckedChange={() => toggleEmailSelection(subscription.email)}
                        />
                      </TableCell>
                      <TableCell className="font-medium">
                        <div className="flex items-center gap-3">
                          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10">
                            <Mail className="h-4 w-4 text-primary" />
                          </div>
                          <div>
                            <div className="font-medium">{subscription.email}</div>
                            <Badge variant="secondary" className="mt-1">
                              Active
                            </Badge>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-col">
                          <span className="text-sm">
                            {formatDate(subscription.createdAt)}
                          </span>
                          <span className="text-xs text-muted-foreground">
                            Updated {formatDate(subscription.updatedAt)}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm">
                              <MoreHorizontal className="h-4 w-4" />
                              <span className="sr-only">Actions</span>
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => copyToClipboard(subscription.email)}>
                              <Copy className="h-4 w-4 mr-2" />
                              Copy Email
                            </DropdownMenuItem>
                            <DropdownMenuItem 
                              onClick={() => handleDelete(subscription.id)}
                              className="text-destructive focus:text-destructive"
                            >
                              <Trash2 className="h-4 w-4 mr-2" />
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>

          {/* Pagination */}
          {pagination.totalPages > 1 && (
            <div className="mt-6">
              <Pagination>
                <PaginationContent>
                  <PaginationItem>
                    <PaginationPrevious 
                      onClick={() => fetchSubscriptions(pagination.page - 1)}
                      className={pagination.page === 1 ? "pointer-events-none opacity-50" : "cursor-pointer"}
                    />
                  </PaginationItem>
                  
                  {[...Array(pagination.totalPages)].map((_, index) => (
                    <PaginationItem key={index}>
                      <PaginationLink
                        onClick={() => fetchSubscriptions(index + 1)}
                        isActive={pagination.page === index + 1}
                        className="cursor-pointer"
                      >
                        {index + 1}
                      </PaginationLink>
                    </PaginationItem>
                  ))}
                  
                  <PaginationItem>
                    <PaginationNext 
                      onClick={() => fetchSubscriptions(pagination.page + 1)}
                      className={pagination.page === pagination.totalPages ? "pointer-events-none opacity-50" : "cursor-pointer"}
                    />
                  </PaginationItem>
                </PaginationContent>
              </Pagination>
              
              <div className="text-center text-sm text-muted-foreground mt-2">
                Showing {subscriptions.length} of {pagination.totalCount} subscribers
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Email Compose Dialog */}
      <Dialog open={isEmailDialogOpen} onOpenChange={setIsEmailDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Send className="w-5 h-5" />
              Send Email to Subscribers
            </DialogTitle>
            <DialogDescription>
              Compose and send a custom email to {selectedEmails.length} selected subscriber(s)
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="recipients">Recipients</Label>
              <div className="p-3 border rounded-md bg-muted/50 max-h-32 overflow-y-auto">
                <div className="flex flex-wrap gap-2">
                  {selectedEmails.map((email, index) => (
                    <Badge key={index} variant="secondary" className="gap-1">
                      {email}
                      <button
                        onClick={() => toggleEmailSelection(email)}
                        className="ml-1 hover:text-destructive"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </Badge>
                  ))}
                </div>
              </div>
              <p className="text-xs text-muted-foreground">
                Click on a badge to remove a recipient
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="subject">Email Subject</Label>
              <Input
                id="subject"
                value={emailSubject}
                onChange={(e) => setEmailSubject(e.target.value)}
                placeholder="Enter email subject"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="message">Email Message</Label>
              <Textarea
                id="message"
                value={emailMessage}
                onChange={(e) => setEmailMessage(e.target.value)}
                placeholder="Enter your message here... This will be sent using the Unfiltered IITians email template with professional formatting."
                rows={10}
                className="resize-none"
              />
              <p className="text-xs text-muted-foreground">
                Your message will be formatted with the Unfiltered IITians branding and footer template
              </p>
            </div>

            <div className="bg-blue-50 dark:bg-blue-950 p-4 rounded-lg border border-blue-200 dark:border-blue-800">
              <h4 className="font-semibold text-sm mb-2 flex items-center gap-2">
                <Mail className="w-4 h-4" />
                Email Preview
              </h4>
              <p className="text-xs text-muted-foreground">
                The email will include:
              </p>
              <ul className="text-xs text-muted-foreground mt-2 space-y-1 ml-4 list-disc">
                <li>Professional header with Unfiltered IITians branding</li>
                <li>Your custom message content</li>
                <li>Links to courses, resources, and contact</li>
                <li>Footer with copyright and social links</li>
              </ul>
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setIsEmailDialogOpen(false);
                setEmailMessage('');
              }}
              disabled={isSendingEmail}
            >
              Cancel
            </Button>
            <Button
              onClick={handleSendEmail}
              disabled={isSendingEmail || !emailMessage.trim() || selectedEmails.length === 0}
            >
              {isSendingEmail ? (
                <>
                  <Mail className="w-4 h-4 mr-2 animate-spin" />
                  Sending...
                </>
              ) : (
                <>
                  <Send className="w-4 h-4 mr-2" />
                  Send Email
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}