'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@clerk/nextjs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { 
  Search, 
  RefreshCw, 
  ChevronLeft, 
  ChevronRight, 
  Mail,
  Calendar,
  Users,
  Eye,
  Trash2,
  AlertTriangle,
  TrendingUp,
  Send,
  Activity
} from 'lucide-react';
import { format } from 'date-fns';
import { Label } from '@/components/ui/label';

interface EmailLog {
  id: string;
  subject: string;
  body: string;
  recipients: string[];
  recipientCount: number;
  sentBy: string | null;
  source: string | null;
  metadata: Record<string, unknown> | null;
  sentAt: string;
}

interface Stats {
  totalEmails: number;
  emailsToday: number;
  emailsThisMonth: number;
  totalRecipients: number;
}

export default function EmailLogsPage() {
  const { getToken } = useAuth();
  const [emailLogs, setEmailLogs] = useState<EmailLog[]>([]);
  const [stats, setStats] = useState<Stats>({
    totalEmails: 0,
    emailsToday: 0,
    emailsThisMonth: 0,
    totalRecipients: 0,
  });
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(false);

  // Filters
  const [search, setSearch] = useState('');
  const [sourceFilter, setSourceFilter] = useState('');
  const [sortBy, setSortBy] = useState('sentAt');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 50,
    total: 0,
    pages: 0,
  });

  // View/Delete dialogs
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedLog, setSelectedLog] = useState<EmailLog | null>(null);
  const [securityPassword, setSecurityPassword] = useState('');

  // Fetch stats
  const fetchStats = async () => {
    try {
      const token = await getToken();
      const response = await fetch('/api/admin/email-logs/stats', {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.ok) {
        const data = await response.json();
        setStats(data.stats);
      }
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  // Fetch email logs
  const fetchEmailLogs = async () => {
    setLoading(true);
    try {
      const token = await getToken();
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '50',
        sortBy,
        sortOrder,
        ...(search && { search }),
        ...(sourceFilter && sourceFilter !== 'all' && { source: sourceFilter }),
      });

      const response = await fetch(`/api/admin/email-logs?${params}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.ok) {
        const data = await response.json();
        setEmailLogs(data.emailLogs);
        setPagination(data.pagination);
      } else {
        toast.error('Failed to fetch email logs');
      }
    } catch (error) {
      console.error('Error fetching email logs:', error);
      toast.error('Error loading email logs');
    } finally {
      setLoading(false);
    }
  };

  // View email
  const handleViewEmail = (log: EmailLog) => {
    setSelectedLog(log);
    setViewDialogOpen(true);
  };

  // Delete email
  const handleDeleteEmail = (log: EmailLog) => {
    setSelectedLog(log);
    setSecurityPassword('');
    setDeleteDialogOpen(true);
  };

  const confirmDelete = async () => {
    if (!selectedLog) return;

    setDeleting(true);
    try {
      const token = await getToken();
      const response = await fetch(`/api/admin/email-logs/${selectedLog.id}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ password: securityPassword }),
      });

      const data = await response.json();

      if (response.ok) {
        toast.success('Email log deleted successfully');
        setDeleteDialogOpen(false);
        setSelectedLog(null);
        setSecurityPassword('');
        fetchEmailLogs();
        fetchStats();
      } else if (response.status === 403) {
        toast.error('Invalid security password');
      } else {
        toast.error(data.error || 'Failed to delete email log');
      }
    } catch (error) {
      console.error('Error deleting email log:', error);
      toast.error('Error deleting email log');
    } finally {
      setDeleting(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  useEffect(() => {
    fetchEmailLogs();
  }, [page, sortBy, sortOrder, search, sourceFilter]);

  return (
    <div className="container mx-auto p-4 sm:p-6 lg:p-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Mail className="h-8 w-8 text-primary" />
            Email Logs
          </h1>
          <p className="text-muted-foreground mt-1">
            Track and manage all emails sent from the platform
          </p>
        </div>
        <Button onClick={() => { fetchEmailLogs(); fetchStats(); }} variant="outline">
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Emails</CardTitle>
            <Mail className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalEmails}</div>
            <p className="text-xs text-muted-foreground">All time</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Today</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.emailsToday}</div>
            <p className="text-xs text-muted-foreground">Emails sent today</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">This Month</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.emailsThisMonth}</div>
            <p className="text-xs text-muted-foreground">Emails this month</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Recipients</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalRecipients}</div>
            <p className="text-xs text-muted-foreground">All time</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Filters</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by subject, sender, or recipient..."
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setPage(1);
                }}
                className="pl-10"
              />
            </div>

            <Select value={sourceFilter} onValueChange={(value) => { setSourceFilter(value); setPage(1); }}>
              <SelectTrigger>
                <SelectValue placeholder="Filter by source" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Sources</SelectItem>
                <SelectItem value="newsletter">Newsletter</SelectItem>
                <SelectItem value="course-enrollments">Course Enrollments</SelectItem>
                <SelectItem value="session-enrollments">Session Enrollments</SelectItem>
                <SelectItem value="users">Users</SelectItem>
              </SelectContent>
            </Select>

            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger>
                <SelectValue placeholder="Sort by" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="sentAt">Sent Date</SelectItem>
                <SelectItem value="subject">Subject</SelectItem>
                <SelectItem value="recipientCount">Recipients</SelectItem>
              </SelectContent>
            </Select>

            <Select value={sortOrder} onValueChange={(value: 'asc' | 'desc') => setSortOrder(value)}>
              <SelectTrigger>
                <SelectValue placeholder="Order" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="desc">Newest First</SelectItem>
                <SelectItem value="asc">Oldest First</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Email Logs Table */}
      <Card>
        <CardHeader>
          <CardTitle>Email History ({pagination.total} total)</CardTitle>
          <CardDescription>
            View all emails sent from the admin panel
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center py-12">
              <RefreshCw className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : emailLogs.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <Mail className="h-12 w-12 mx-auto mb-3 opacity-50" />
              <p className="text-lg font-medium">No email logs found</p>
              <p className="text-sm">Emails sent from the admin panel will appear here</p>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="rounded-md border overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-12">S.No</TableHead>
                      <TableHead>Subject</TableHead>
                      <TableHead>Source</TableHead>
                      <TableHead>Recipients</TableHead>
                      <TableHead>Sent By</TableHead>
                      <TableHead>Sent Date</TableHead>
                      <TableHead className="text-center">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {emailLogs.map((log, index) => (
                      <TableRow key={log.id}>
                        <TableCell className="font-medium">
                          {(page - 1) * pagination.limit + index + 1}
                        </TableCell>
                        <TableCell>
                          <div className="max-w-md">
                            <p className="font-medium truncate">{log.subject}</p>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="secondary">
                            {log.source || 'Unknown'}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Users className="h-4 w-4 text-muted-foreground" />
                            <span>{log.recipientCount}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <span className="text-sm">{log.sentBy || 'N/A'}</span>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Calendar className="h-4 w-4 text-muted-foreground" />
                            <span className="text-sm">
                              {format(new Date(log.sentAt), 'MMM dd, yyyy HH:mm')}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center justify-center gap-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleViewEmail(log)}
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDeleteEmail(log)}
                              className="text-destructive hover:text-destructive"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              {/* Pagination */}
              <div className="flex items-center justify-between">
                <div className="text-sm text-muted-foreground">
                  Showing {(page - 1) * pagination.limit + 1} to{' '}
                  {Math.min(page * pagination.limit, pagination.total)} of {pagination.total} emails
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPage(p => Math.max(1, p - 1))}
                    disabled={page === 1}
                  >
                    <ChevronLeft className="h-4 w-4" />
                    Previous
                  </Button>
                  <div className="text-sm">
                    Page {page} of {pagination.pages}
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPage(p => Math.min(pagination.pages, p + 1))}
                    disabled={page === pagination.pages}
                  >
                    Next
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* View Email Dialog */}
      <Dialog open={viewDialogOpen} onOpenChange={setViewDialogOpen}>
        <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Email Details</DialogTitle>
            <DialogDescription>
              View complete email information and content
            </DialogDescription>
          </DialogHeader>

          {selectedLog && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium">Subject</Label>
                  <p className="text-sm mt-1">{selectedLog.subject}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium">Source</Label>
                  <Badge variant="secondary" className="mt-1">
                    {selectedLog.source || 'Unknown'}
                  </Badge>
                </div>
                <div>
                  <Label className="text-sm font-medium">Sent By</Label>
                  <p className="text-sm mt-1">{selectedLog.sentBy || 'N/A'}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium">Sent Date</Label>
                  <p className="text-sm mt-1">
                    {format(new Date(selectedLog.sentAt), 'MMM dd, yyyy HH:mm:ss')}
                  </p>
                </div>
              </div>

              <div>
                <Label className="text-sm font-medium">Recipients ({selectedLog.recipientCount})</Label>
                <div className="flex flex-wrap gap-2 mt-2">
                  {selectedLog.recipients.slice(0, 10).map((email, idx) => (
                    <Badge key={idx} variant="outline">
                      {email}
                    </Badge>
                  ))}
                  {selectedLog.recipients.length > 10 && (
                    <Badge variant="outline">
                      +{selectedLog.recipients.length - 10} more
                    </Badge>
                  )}
                </div>
              </div>

              <div>
                <Label className="text-sm font-medium">Email Body (Preview)</Label>
                <div 
                  className="mt-2 p-4 border rounded-md bg-muted max-h-96 overflow-y-auto"
                  dangerouslySetInnerHTML={{ __html: selectedLog.body }}
                />
              </div>

              {selectedLog.metadata && Object.keys(selectedLog.metadata).length > 0 && (
                <div>
                  <Label className="text-sm font-medium">Metadata</Label>
                  <pre className="mt-2 p-4 bg-muted rounded-md text-xs overflow-x-auto">
                    {JSON.stringify(selectedLog.metadata, null, 2)}
                  </pre>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-destructive">
              <AlertTriangle className="h-5 w-5" />
              Delete Email Log
            </DialogTitle>
            <DialogDescription>
              This action cannot be undone. This will permanently delete the email log from the database.
            </DialogDescription>
          </DialogHeader>

          {selectedLog && (
            <div className="space-y-4">
              <div className="bg-muted p-3 rounded-md">
                <p className="text-sm font-medium">Email: {selectedLog.subject}</p>
                <p className="text-xs text-muted-foreground mt-1">
                  Sent to {selectedLog.recipientCount} recipient(s) on{' '}
                  {format(new Date(selectedLog.sentAt), 'MMM dd, yyyy')}
                </p>
              </div>

              <div>
                <Label htmlFor="securityPassword" className="flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4 text-destructive" />
                  Enter Security Password to Confirm
                </Label>
                <Input
                  id="securityPassword"
                  type="password"
                  value={securityPassword}
                  onChange={(e) => setSecurityPassword(e.target.value)}
                  placeholder="Enter admin security password"
                  className="mt-2"
                />
              </div>
            </div>
          )}

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setDeleteDialogOpen(false);
                setSecurityPassword('');
              }}
              disabled={deleting}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={confirmDelete}
              disabled={!securityPassword || deleting}
            >
              {deleting ? (
                <>
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  Deleting...
                </>
              ) : (
                <>
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete Log
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
