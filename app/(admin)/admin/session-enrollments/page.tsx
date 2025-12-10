'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@clerk/nextjs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
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
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { toast } from 'sonner';
import { 
  Search, 
  Mail, 
  RefreshCw, 
  ChevronLeft, 
  ChevronRight, 
  Users, 
  GraduationCap,
  Calendar,
  IndianRupee,
  Send,
  Clock,
  Tag,
  User,
  Gift,
  Plus,
  MoreVertical,
  Eye,
  Trash2,
  AlertTriangle,
  Lock
} from 'lucide-react';
import { format } from 'date-fns';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface Enrollment {
  id: string;
  enrolledAt: string;
  completedAt?: string | null;
  amountPaid: number | null;
  paymentStatus: string;
  razorpayOrderId: string | null;
  razorpayPaymentId: string | null;
  user: {
    id: string;
    name: string | null;
    email: string;
    profileImageUrl: string | null;
  };
  session?: {
    id: string;
    title: string;
    price: number;
    duration: number | null;
    expiryDate: string | null;
  };
}

interface Session {
  id: string;
  title: string;
  _count: {
    enrollments: number;
  };
}

interface MockTest {
  id: string;
  title: string;
  description: string | null;
  price: number;
  actualPrice: number | null;
  difficulty: string;
  duration: number | null;
  tags: string[];
}

interface UserSubscription {
  id: string;
  type: string;
  title: string;
  description: string | null;
  difficulty?: string;
  actualAmountPaid: number;
  originalPrice: number;
  discountApplied: number;
  couponCode: string | null;
  paidAt: string;
  expiresAt: string | null;
  paid: boolean;
}

export default function SessionEnrollmentsPage() {
  const { getToken } = useAuth();
  const [enrollments, setEnrollments] = useState<Enrollment[]>([]);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);

  // Filters
  const [selectedSession, setSelectedSession] = useState('');
  const [search, setSearch] = useState('');
  const [sortBy, setSortBy] = useState('enrolledAt');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 50,
    total: 0,
    pages: 0,
  });

  // Selection
  const [selectedEnrollments, setSelectedEnrollments] = useState<string[]>([]);
  const [selectAll, setSelectAll] = useState(false);

  // Email form
  const [emailDialogOpen, setEmailDialogOpen] = useState(false);
  const [emailSubject, setEmailSubject] = useState('');
  const [emailMessage, setEmailMessage] = useState('');

  // Add Mocks feature
  const [addMocksDialogOpen, setAddMocksDialogOpen] = useState(false);
  const [availableMocks, setAvailableMocks] = useState<MockTest[]>([]);
  const [selectedMocks, setSelectedMocks] = useState<string[]>([]);
  const [addingMocks, setAddingMocks] = useState(false);
  const [loadingMocks, setLoadingMocks] = useState(false);

  // View Subscriptions Dialog
  const [viewSubscriptionsDialogOpen, setViewSubscriptionsDialogOpen] = useState(false);
  const [selectedEnrollmentForView, setSelectedEnrollmentForView] = useState<Enrollment | null>(null);
  const [userSubscriptions, setUserSubscriptions] = useState<UserSubscription[]>([]);
  const [loadingSubscriptions, setLoadingSubscriptions] = useState(false);

  // Delete Enrollment Dialog
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedEnrollmentForDelete, setSelectedEnrollmentForDelete] = useState<Enrollment | null>(null);
  const [securityPassword, setSecurityPassword] = useState('');
  const [deletingEnrollment, setDeletingEnrollment] = useState(false);

  // Fetch sessions with enrollments
  useEffect(() => {
    const fetchSessions = async () => {
      try {
        const token = await getToken();
        const response = await fetch('/api/admin/session-enrollments/sessions', {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (response.ok) {
          const data = await response.json();
          setSessions(data.sessions || []);
          if (data.sessions && data.sessions.length > 0) {
            setSelectedSession(data.sessions[0].id);
          }
        }
      } catch (error) {
        console.error('Error fetching sessions:', error);
      }
    };
    fetchSessions();
  }, [getToken]);

  // Fetch enrollments
  const fetchEnrollments = async () => {
    if (!selectedSession) return;
    
    try {
      setLoading(true);
      const token = await getToken();

      const params = new URLSearchParams({
        page: page.toString(),
        limit: '50',
        sortBy,
        sortOrder,
        sessionId: selectedSession,
        ...(search && { search }),
      });

      const response = await fetch(`/api/admin/session-enrollments?${params}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!response.ok) throw new Error('Failed to fetch enrollments');

      const data = await response.json();
      setEnrollments(data.enrollments || []);
      setPagination(data.pagination);
    } catch (error) {
      console.error('Error fetching enrollments:', error);
      toast.error('Failed to load enrollments');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (selectedSession) {
      fetchEnrollments();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, selectedSession, sortBy, sortOrder]);

  // Handle search with debounce
  useEffect(() => {
    if (!selectedSession) return;
    
    const timer = setTimeout(() => {
      if (page === 1) {
        fetchEnrollments();
      } else {
        setPage(1);
      }
    }, 500);

    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search]);

  // Reset page when session changes
  useEffect(() => {
    setPage(1);
    setSelectedEnrollments([]);
    setSelectAll(false);
  }, [selectedSession]);

  // Handle select all
  const handleSelectAll = (checked: boolean) => {
    setSelectAll(checked);
    if (checked) {
      setSelectedEnrollments(enrollments.map((e) => e.id));
    } else {
      setSelectedEnrollments([]);
    }
  };

  // Handle individual selection
  const handleSelectEnrollment = (id: string, checked: boolean) => {
    if (checked) {
      setSelectedEnrollments((prev) => [...prev, id]);
    } else {
      setSelectedEnrollments((prev) => prev.filter((eid) => eid !== id));
      setSelectAll(false);
    }
  };

  // Send emails
  const sendEmails = async () => {
    if (selectedEnrollments.length === 0) {
      toast.error('Please select at least one student');
      return;
    }

    if (!emailSubject.trim() || !emailMessage.trim()) {
      toast.error('Please enter subject and message');
      return;
    }

    setSending(true);
    try {
      const token = await getToken();
      const response = await fetch('/api/admin/session-enrollments/send-email', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          enrollmentIds: selectedEnrollments,
          subject: emailSubject,
          message: emailMessage,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        toast.success(data.message || 'Emails sent successfully!');
        setEmailDialogOpen(false);
        setEmailSubject('');
        setEmailMessage('');
        setSelectedEnrollments([]);
        setSelectAll(false);
      } else {
        throw new Error(data.error || 'Failed to send emails');
      }
    } catch (error) {
      console.error('Error sending emails:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to send emails');
    } finally {
      setSending(false);
    }
  };

  // Fetch available mocks
  const fetchMocks = async () => {
    setLoadingMocks(true);
    try {
      const token = await getToken();
      const response = await fetch('/api/admin/mocks/list', {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.ok) {
        const data = await response.json();
        setAvailableMocks(data.mocks || []);
      }
    } catch (error) {
      console.error('Error fetching mocks:', error);
      toast.error('Failed to load mocks');
    } finally {
      setLoadingMocks(false);
    }
  };

  // Open add mocks dialog
  const openAddMocksDialog = () => {
    if (selectedEnrollments.length === 0) {
      toast.error('Please select at least one student');
      return;
    }
    fetchMocks();
    setAddMocksDialogOpen(true);
  };

  // Handle mock selection
  const handleMockSelection = (mockId: string, checked: boolean) => {
    if (checked) {
      setSelectedMocks((prev) => [...prev, mockId]);
    } else {
      setSelectedMocks((prev) => prev.filter((id) => id !== mockId));
    }
  };

  // Add mocks to selected students
  const addMocksToStudents = async () => {
    if (selectedMocks.length === 0) {
      toast.error('Please select at least one mock test');
      return;
    }

    setAddingMocks(true);
    try {
      const token = await getToken();
      const response = await fetch('/api/admin/session-enrollments/add-mocks', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          enrollmentIds: selectedEnrollments,
          mockIds: selectedMocks,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        toast.success(data.message || 'Mocks added successfully!');
        setAddMocksDialogOpen(false);
        setSelectedMocks([]);
        setSelectedEnrollments([]);
        setSelectAll(false);
      } else {
        throw new Error(data.error || 'Failed to add mocks');
      }
    } catch (error) {
      console.error('Error adding mocks:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to add mocks');
    } finally {
      setAddingMocks(false);
    }
  };

  // Handle view subscriptions
  const handleViewSubscriptions = async (enrollment: Enrollment) => {
    setSelectedEnrollmentForView(enrollment);
    setLoadingSubscriptions(true);
    
    // Delay opening dialog to let dropdown close first
    setTimeout(() => {
      setViewSubscriptionsDialogOpen(true);
    }, 50);

    try {
      const token = await getToken();
      const response = await fetch(
        `/api/admin/session-enrollments/subscriptions/${enrollment.id}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      if (response.ok) {
        const data = await response.json();
        setUserSubscriptions(data.subscriptions || []);
      } else {
        throw new Error('Failed to fetch subscriptions');
      }
    } catch (error) {
      console.error('Error fetching subscriptions:', error);
      toast.error('Failed to load user subscriptions');
    } finally {
      setLoadingSubscriptions(false);
    }
  };

  // Handle delete enrollment
  const handleDeleteEnrollment = (enrollment: Enrollment) => {
    setSelectedEnrollmentForDelete(enrollment);
    setSecurityPassword('');
    
    // Delay opening dialog to let dropdown close first
    setTimeout(() => {
      setDeleteDialogOpen(true);
    }, 50);
  };

  // Confirm delete enrollment
  const confirmDeleteEnrollment = async () => {
    if (!selectedEnrollmentForDelete) return;

    if (!securityPassword) {
      toast.error('Please enter security password');
      return;
    }

    setDeletingEnrollment(true);
    try {
      const token = await getToken();
      const response = await fetch('/api/admin/session-enrollments/delete', {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          enrollmentId: selectedEnrollmentForDelete.id,
          securityPassword,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        toast.success(data.message || 'Enrollment deleted successfully');
        setDeleteDialogOpen(false);
        setSelectedEnrollmentForDelete(null);
        setSecurityPassword('');
        fetchEnrollments(); // Refresh the list
      } else {
        // Handle specific error cases
        if (response.status === 403) {
          if (data.error?.toLowerCase().includes('password')) {
            toast.error('Invalid security password. Please try again.');
          } else if (data.error?.toLowerCase().includes('admin')) {
            toast.error('Admin access required to perform this action.');
          } else {
            toast.error(data.error || 'Access denied. Please check your permissions.');
          }
        } else if (response.status === 404) {
          toast.error('Enrollment not found. It may have been already deleted.');
          setDeleteDialogOpen(false);
          setSelectedEnrollmentForDelete(null);
          setSecurityPassword('');
          fetchEnrollments(); // Refresh the list
        } else if (response.status === 401) {
          toast.error('Your session has expired. Please log in again.');
        } else {
          toast.error(data.error || 'Failed to delete enrollment. Please try again.');
        }
      }
    } catch (error) {
      console.error('Error deleting enrollment:', error);
      toast.error('Network error. Please check your connection and try again.');
    } finally {
      setDeletingEnrollment(false);
    }
  };

  const selectedSessionName = sessions.find(s => s.id === selectedSession)?.title || '';

  return (
    <div className="container mx-auto p-4 sm:p-6 lg:p-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4">
        <div className="flex items-start justify-between gap-4">
          <div className="space-y-2">
            <h1 className="text-3xl lg:text-4xl font-bold tracking-tight flex items-center gap-3">
              <div className="p-2 bg-primary/10 rounded-lg">
                <GraduationCap className="h-7 w-7 text-primary" />
              </div>
              Session Enrollments
            </h1>
            <p className="text-muted-foreground text-sm lg:text-base">
              Manage session enrollments and send personalized emails
            </p>
          </div>
          <Button 
            onClick={fetchEnrollments} 
            variant="outline" 
            size="sm"
            className="gap-2 hover:bg-primary/5"
          >
            <RefreshCw className="h-4 w-4" />
            Refresh
          </Button>
        </div>

        {/* Session Selector Card */}
        <Card className="border-2 shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <GraduationCap className="h-5 w-5 text-primary" />
              Select Session
            </CardTitle>
            <CardDescription>
              Choose a session to view and manage its enrollments
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Select value={selectedSession} onValueChange={setSelectedSession}>
              <SelectTrigger className="w-full h-12 text-base">
                <SelectValue placeholder="Select a session..." />
              </SelectTrigger>
              <SelectContent>
                {sessions.map((session) => (
                  <SelectItem key={session.id} value={session.id} className="cursor-pointer">
                    <div className="flex items-center justify-between w-full gap-4">
                      <span className="font-medium">{session.title}</span>
                      <Badge variant="secondary" className="ml-auto">
                        <Users className="h-3 w-3 mr-1" />
                        {session._count.enrollments}
                      </Badge>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </CardContent>
        </Card>
      </div>

      {selectedSession && (
        <>
          {/* Stats & Actions Banner */}
          <div className="grid gap-4 md:grid-cols-2">
            <Card className="border-2">
              <CardContent className="pt-6">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-blue-500/10 rounded-lg">
                    <Users className="h-6 w-6 text-blue-500" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Total Enrollments</p>
                    <p className="text-2xl font-bold">{pagination.total}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {selectedEnrollments.length > 0 && (
              <Card className="border-2 border-primary/20 bg-primary/5">
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <div className="p-3 bg-primary/10 rounded-lg">
                        <Mail className="h-6 w-6 text-primary" />
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Selected Students</p>
                        <p className="text-2xl font-bold">{selectedEnrollments.length}</p>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button 
                        onClick={openAddMocksDialog}
                        variant="outline"
                        className="gap-2"
                      >
                        <Gift className="h-4 w-4" />
                        Add Mocks
                      </Button>
                      <Button 
                        onClick={() => setEmailDialogOpen(true)}
                        className="gap-2"
                      >
                        <Send className="h-4 w-4" />
                        Send Email
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Enrollments Table */}
          <Card className="border-2 shadow-sm">
            <CardHeader className="space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <CardTitle className="text-xl">
                  Enrolled Students
                </CardTitle>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Clock className="h-4 w-4" />
                  Showing {((pagination.page - 1) * pagination.limit) + 1} to{' '}
                  {Math.min(pagination.page * pagination.limit, pagination.total)} of{' '}
                  {pagination.total}
                </div>
              </div>

              {/* Search and Sort Controls */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                <div className="relative">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search by name or email..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="pl-10 h-11"
                  />
                </div>

                <Select value={sortBy} onValueChange={setSortBy}>
                  <SelectTrigger className="h-11">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="enrolledAt">
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4" />
                        Enrollment Date
                      </div>
                    </SelectItem>
                    <SelectItem value="userName">
                      <div className="flex items-center gap-2">
                        <User className="h-4 w-4" />
                        Student Name
                      </div>
                    </SelectItem>
                    <SelectItem value="expiresAt">
                      <div className="flex items-center gap-2">
                        <Clock className="h-4 w-4" />
                        Expiry Date
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>

                <Select value={sortOrder} onValueChange={(v: 'asc' | 'desc') => setSortOrder(v)}>
                  <SelectTrigger className="h-11">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="desc">Newest First</SelectItem>
                    <SelectItem value="asc">Oldest First</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardHeader>

            <CardContent>
              {loading ? (
                <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                  <RefreshCw className="h-8 w-8 animate-spin mb-3" />
                  <p className="text-sm">Loading enrollments...</p>
                </div>
              ) : enrollments.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                  <Users className="h-12 w-12 mb-3 opacity-50" />
                  <p className="text-lg font-medium">No enrollments found</p>
                  <p className="text-sm">Try adjusting your search or filters</p>
                </div>
              ) : (
                <>
                  <div className="relative overflow-x-auto rounded-lg border">
                    <Table>
                      <TableHeader>
                        <TableRow className="bg-muted/50 hover:bg-muted/50">
                          <TableHead className="w-12">
                            <Checkbox
                              checked={selectAll}
                              onCheckedChange={handleSelectAll}
                            />
                          </TableHead>
                          <TableHead className="font-semibold">Student</TableHead>
                          <TableHead className="font-semibold">Contact</TableHead>
                          <TableHead className="font-semibold">Amount Paid</TableHead>
                          <TableHead className="font-semibold">Duration</TableHead>
                          <TableHead className="font-semibold">Enrolled Date</TableHead>
                          <TableHead className="font-semibold">Expires At</TableHead>
                          <TableHead className="font-semibold text-center">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {enrollments.map((enrollment) => (
                          <TableRow 
                            key={enrollment.id}
                            className="hover:bg-muted/30 transition-colors"
                          >
                            <TableCell>
                              <Checkbox
                                checked={selectedEnrollments.includes(enrollment.id)}
                                onCheckedChange={(checked) =>
                                  handleSelectEnrollment(enrollment.id, checked as boolean)
                                }
                              />
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center gap-3">
                                <Avatar className="h-9 w-9 border-2">
                                  <AvatarImage src={enrollment.user.profileImageUrl || ''} />
                                  <AvatarFallback className="bg-primary/10 text-primary font-semibold">
                                    {enrollment.user.name?.charAt(0).toUpperCase() || 'U'}
                                  </AvatarFallback>
                                </Avatar>
                                <div>
                                  <p className="font-medium">{enrollment.user.name || 'N/A'}</p>
                                </div>
                              </div>
                            </TableCell>
                            <TableCell>
                              <p className="text-sm text-muted-foreground">{enrollment.user.email}</p>
                            </TableCell>
                            <TableCell>
                              <div className="flex flex-col gap-1">
                                <div className="flex items-center gap-1 font-semibold text-green-600">
                                  <IndianRupee className="h-4 w-4" />
                                  {enrollment.amountPaid 
                                    ? enrollment.amountPaid.toFixed(2)
                                    : (enrollment.session?.price || 0).toFixed(2)}
                                </div>
                                {enrollment.couponCode && (
                                  <Badge variant="secondary" className="w-fit text-xs">
                                    <Tag className="h-3 w-3 mr-1" />
                                    {enrollment.couponCode}
                                  </Badge>
                                )}
                              </div>
                            </TableCell>
                            <TableCell>
                              <Badge variant="outline">
                                {enrollment.session?.duration || 0} mins
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center gap-2">
                                <Calendar className="h-4 w-4 text-muted-foreground" />
                                <span className="text-sm">
                                  {format(new Date(enrollment.enrolledAt), 'MMM dd, yyyy')}
                                </span>
                              </div>
                            </TableCell>
                            <TableCell>
                              {enrollment.completedAt ? (
                                <div className="flex items-center gap-2">
                                  <Clock className="h-4 w-4 text-green-600" />
                                  <span className="text-sm text-green-600">
                                    Completed: {format(new Date(enrollment.completedAt), 'MMM dd, yyyy')}
                                  </span>
                                </div>
                              ) : enrollment.session?.expiryDate ? (
                                <div className="flex items-center gap-2">
                                  <Clock className="h-4 w-4 text-orange-600" />
                                  <span className="text-sm">
                                    {format(new Date(enrollment.session.expiryDate), 'MMM dd, yyyy')}
                                  </span>
                                </div>
                              ) : (
                                <span className="text-sm text-muted-foreground">No Expiry</span>
                              )}
                            </TableCell>
                            <TableCell className="text-center">
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button 
                                    variant="ghost" 
                                    size="sm" 
                                    className="h-8 w-8 p-0 hover:bg-muted relative z-10"
                                    aria-label="Actions menu"
                                    type="button"
                                  >
                                    <MoreVertical className="h-4 w-4" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end" className="w-48 z-50" sideOffset={5}>
                                  <DropdownMenuItem
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleViewSubscriptions(enrollment);
                                    }}
                                    className="cursor-pointer gap-2"
                                  >
                                    <Eye className="h-4 w-4" />
                                    View Subscriptions
                                  </DropdownMenuItem>
                                  <DropdownMenuItem
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleDeleteEnrollment(enrollment);
                                    }}
                                    className="cursor-pointer gap-2 text-destructive focus:text-destructive"
                                  >
                                    <Trash2 className="h-4 w-4" />
                                    Delete Subscription
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>

                  {/* Pagination */}
                  {pagination.pages > 1 && (
                    <div className="flex items-center justify-between mt-6 pt-4 border-t">
                      <p className="text-sm text-muted-foreground">
                        Page {pagination.page} of {pagination.pages}
                      </p>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setPage(Math.max(1, page - 1))}
                          disabled={page <= 1}
                          className="gap-2"
                        >
                          <ChevronLeft className="h-4 w-4" />
                          Previous
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setPage(Math.min(pagination.pages, page + 1))}
                          disabled={page >= pagination.pages}
                          className="gap-2"
                        >
                          Next
                          <ChevronRight className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  )}
                </>
              )}
            </CardContent>
          </Card>
        </>
      )}

      {/* Email Dialog */}
      <Dialog open={emailDialogOpen} onOpenChange={setEmailDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-xl">
              <Mail className="h-5 w-5 text-primary" />
              Send Email to Selected Students
            </DialogTitle>
            <DialogDescription>
              Compose a personalized email for {selectedEnrollments.length} selected student(s) from <strong>{selectedSessionName}</strong>
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-5 mt-4">
            <div className="space-y-2">
              <Label htmlFor="subject" className="text-base font-medium">Email Subject</Label>
              <Input
                id="subject"
                placeholder="e.g., Important Update About Your Course"
                value={emailSubject}
                onChange={(e) => setEmailSubject(e.target.value)}
                className="h-11"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="message" className="text-base font-medium">Message</Label>
              <Textarea
                id="message"
                placeholder="Write your message here..."
                rows={12}
                value={emailMessage}
                onChange={(e) => setEmailMessage(e.target.value)}
                className="resize-none"
              />
              <p className="text-xs text-muted-foreground">
                Your message will be sent in a professional email template with student name and course details.
              </p>
            </div>
            <div className="flex justify-end gap-3 pt-4 border-t">
              <Button 
                variant="outline" 
                onClick={() => setEmailDialogOpen(false)}
                disabled={sending}
              >
                Cancel
              </Button>
              <Button 
                onClick={sendEmails} 
                disabled={sending}
                className="gap-2"
              >
                {sending ? (
                  <>
                    <RefreshCw className="h-4 w-4 animate-spin" />
                    Sending...
                  </>
                ) : (
                  <>
                    <Send className="h-4 w-4" />
                    Send Emails
                  </>
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Add Mocks Dialog */}
      <Dialog open={addMocksDialogOpen} onOpenChange={setAddMocksDialogOpen}>
        <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-xl">
              <Gift className="h-5 w-5 text-primary" />
              Add Mock Tests to Selected Students
            </DialogTitle>
            <DialogDescription>
              Grant free access to mock tests for {selectedEnrollments.length} selected student(s). They will receive an automated email notification.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 mt-4">
            {loadingMocks ? (
              <div className="flex items-center justify-center py-12">
                <RefreshCw className="h-8 w-8 animate-spin text-primary" />
                <span className="ml-3">Loading mocks...</span>
              </div>
            ) : availableMocks.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <Users className="h-12 w-12 mx-auto mb-3 opacity-50" />
                <p>No published mocks available</p>
              </div>
            ) : (
              <>
                <div className="bg-blue-50 dark:bg-blue-950 p-4 rounded-lg border-2 border-blue-200 dark:border-blue-800">
                  <p className="text-sm font-medium flex items-center gap-2">
                    <Gift className="h-4 w-4 text-blue-600" />
                    Select mock tests to grant for free (actualAmountPaid = ₹0)
                  </p>
                </div>

                <div className="grid gap-3">
                  {availableMocks.map((mock) => (
                    <Card 
                      key={mock.id} 
                      className={`cursor-pointer transition-all hover:shadow-md ${
                        selectedMocks.includes(mock.id) ? 'border-2 border-primary bg-primary/5' : ''
                      }`}
                      onClick={() => handleMockSelection(mock.id, !selectedMocks.includes(mock.id))}
                    >
                      <CardContent className="pt-4">
                        <div className="flex items-start gap-4">
                          <Checkbox
                            checked={selectedMocks.includes(mock.id)}
                            onCheckedChange={(checked) => handleMockSelection(mock.id, checked as boolean)}
                            onClick={(e) => e.stopPropagation()}
                          />
                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between gap-2">
                              <div className="flex-1">
                                <h4 className="font-semibold text-base mb-1">{mock.title}</h4>
                                {mock.description && (
                                  <p className="text-sm text-muted-foreground line-clamp-2 mb-2">
                                    {mock.description}
                                  </p>
                                )}
                                <div className="flex flex-wrap items-center gap-2">
                                  <Badge variant="outline" className="text-xs">
                                    {mock.difficulty}
                                  </Badge>
                                  {mock.duration && (
                                    <Badge variant="secondary" className="text-xs">
                                      <Clock className="h-3 w-3 mr-1" />
                                      {mock.duration} min
                                    </Badge>
                                  )}
                                  {mock.tags.length > 0 && (
                                    <div className="flex gap-1">
                                      {mock.tags.slice(0, 3).map((tag, idx) => (
                                        <Badge key={idx} variant="secondary" className="text-xs">
                                          {tag}
                                        </Badge>
                                      ))}
                                    </div>
                                  )}
                                </div>
                              </div>
                              <div className="text-right">
                                <div className="flex items-center gap-1 text-green-600 font-semibold">
                                  <IndianRupee className="h-4 w-4" />
                                  {mock.actualPrice || mock.price}
                                </div>
                                <p className="text-xs text-muted-foreground">Original Price</p>
                              </div>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>

                {selectedMocks.length > 0 && (
                  <div className="bg-primary/10 p-4 rounded-lg border-2 border-primary/20">
                    <p className="text-sm font-medium">
                      <strong>{selectedMocks.length}</strong> mock{selectedMocks.length > 1 ? 's' : ''} selected for{' '}
                      <strong>{selectedEnrollments.length}</strong> student{selectedEnrollments.length > 1 ? 's' : ''}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Students will receive email with access links to dashboard and mocks page
                    </p>
                  </div>
                )}
              </>
            )}

            <div className="flex justify-end gap-3 pt-4 border-t">
              <Button 
                variant="outline" 
                onClick={() => {
                  setAddMocksDialogOpen(false);
                  setSelectedMocks([]);
                }}
                disabled={addingMocks}
              >
                Cancel
              </Button>
              <Button 
                onClick={addMocksToStudents} 
                disabled={addingMocks || selectedMocks.length === 0}
                className="gap-2"
              >
                {addingMocks ? (
                  <>
                    <RefreshCw className="h-4 w-4 animate-spin" />
                    Adding Mocks...
                  </>
                ) : (
                  <>
                    <Plus className="h-4 w-4" />
                    Add {selectedMocks.length} Mock{selectedMocks.length !== 1 ? 's' : ''}
                  </>
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* View Subscriptions Dialog */}
      <Dialog 
        open={viewSubscriptionsDialogOpen} 
        onOpenChange={(open) => {
          setViewSubscriptionsDialogOpen(open);
          if (!open) {
            // Cleanup when dialog closes
            setTimeout(() => {
              setSelectedEnrollmentForView(null);
              setUserSubscriptions([]);
            }, 100);
          }
        }}
      >
        <DialogContent 
          className="max-w-4xl max-h-[80vh] overflow-y-auto"
          onOpenAutoFocus={(e) => e.preventDefault()}
        >
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-xl">
              <Eye className="h-5 w-5 text-primary" />
              User Subscriptions
            </DialogTitle>
            <DialogDescription asChild>
              {selectedEnrollmentForView ? (
                <div className="mt-2 space-y-1">
                  <span className="font-semibold text-foreground block">
                    {selectedEnrollmentForView.user.name || 'N/A'}
                  </span>
                  <span className="text-sm block">{selectedEnrollmentForView.user.email}</span>
                  <span className="text-xs text-muted-foreground block">
                    Enrolled in: {selectedEnrollmentForView.session?.title || 'N/A'}
                  </span>
                </div>
              ) : (
                <span>Loading user information...</span>
              )}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 mt-4">
            {loadingSubscriptions ? (
              <div className="flex items-center justify-center py-12">
                <RefreshCw className="h-8 w-8 animate-spin text-primary" />
                <span className="ml-3">Loading subscriptions...</span>
              </div>
            ) : userSubscriptions.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <Users className="h-12 w-12 mx-auto mb-3 opacity-50" />
                <p>No subscriptions found for this user</p>
              </div>
            ) : (
              <div className="grid gap-3">
                {userSubscriptions.map((subscription) => (
                  <Card key={subscription.id} className="hover:shadow-md transition-shadow">
                    <CardContent className="pt-4">
                      <div className="space-y-3">
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <Badge variant="outline" className="text-xs">
                                {subscription.type}
                              </Badge>
                              {subscription.difficulty && (
                                <Badge variant="secondary" className="text-xs">
                                  {subscription.difficulty}
                                </Badge>
                              )}
                              <Badge variant={subscription.paid ? 'default' : 'destructive'} className="text-xs">
                                {subscription.paid ? 'Paid' : 'Unpaid'}
                              </Badge>
                            </div>
                            <h4 className="font-semibold text-base mb-1">{subscription.title}</h4>
                            {subscription.description && (
                              <p className="text-sm text-muted-foreground line-clamp-2">
                                {subscription.description}
                              </p>
                            )}
                          </div>
                          <div className="text-right">
                            <div className="flex items-center gap-1 text-green-600 font-semibold">
                              <IndianRupee className="h-4 w-4" />
                              {subscription.actualAmountPaid.toFixed(2)}
                            </div>
                            <p className="text-xs text-muted-foreground">Paid Amount</p>
                          </div>
                        </div>

                        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 pt-3 border-t text-sm">
                          <div>
                            <p className="text-xs text-muted-foreground mb-1">Original Price</p>
                            <div className="flex items-center gap-1 font-medium">
                              <IndianRupee className="h-3 w-3" />
                              {subscription.originalPrice.toFixed(2)}
                            </div>
                          </div>
                          <div>
                            <p className="text-xs text-muted-foreground mb-1">Discount</p>
                            <div className="flex items-center gap-1 font-medium text-orange-600">
                              <IndianRupee className="h-3 w-3" />
                              {subscription.discountApplied.toFixed(2)}
                            </div>
                          </div>
                          <div>
                            <p className="text-xs text-muted-foreground mb-1">Coupon Code</p>
                            <p className="font-medium">
                              {subscription.couponCode ? (
                                <Badge variant="secondary" className="text-xs">
                                  <Tag className="h-3 w-3 mr-1" />
                                  {subscription.couponCode}
                                </Badge>
                              ) : (
                                'N/A'
                              )}
                            </p>
                          </div>
                          <div>
                            <p className="text-xs text-muted-foreground mb-1">Paid At</p>
                            <div className="flex items-center gap-1">
                              <Calendar className="h-3 w-3" />
                              <span className="text-xs">
                                {format(new Date(subscription.paidAt), 'MMM dd, yyyy')}
                              </span>
                            </div>
                          </div>
                        </div>

                        {subscription.expiresAt && (
                          <div className="pt-2 border-t">
                            <p className="text-xs text-muted-foreground mb-1">Expires At</p>
                            <div className="flex items-center gap-1 text-sm">
                              <Clock className="h-3 w-3" />
                              <span>{format(new Date(subscription.expiresAt), 'MMM dd, yyyy')}</span>
                            </div>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>

          <div className="flex justify-end pt-4 border-t">
            <Button onClick={() => setViewSubscriptionsDialogOpen(false)}>
              Close
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Enrollment Dialog */}
      <Dialog 
        open={deleteDialogOpen} 
        onOpenChange={(open) => {
          setDeleteDialogOpen(open);
          if (!open) {
            // Cleanup when dialog closes
            setTimeout(() => {
              setSelectedEnrollmentForDelete(null);
              setSecurityPassword('');
            }, 100);
          }
        }}
      >
        <DialogContent 
          className="max-w-md"
          onOpenAutoFocus={(e) => e.preventDefault()}
        >
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-xl text-destructive">
              <AlertTriangle className="h-5 w-5" />
              Delete Session Enrollment
            </DialogTitle>
            <DialogDescription className="pt-2" asChild>
              {selectedEnrollmentForDelete ? (
                <div className="space-y-3">
                  <div className="bg-destructive/10 p-4 rounded-lg border-2 border-destructive/20">
                    <span className="font-semibold text-destructive mb-2 block">⚠️ Warning: This action is irreversible!</span>
                    <span className="text-sm text-foreground block">
                      This will permanently delete:
                    </span>
                    <ul className="text-sm text-foreground list-disc list-inside mt-2 space-y-1">
                      <li>The enrollment record</li>
                      <li>User&apos;s access to the session</li>
                    </ul>
                  </div>

                  <div className="space-y-2">
                    <span className="text-sm font-medium text-foreground block">Student Details:</span>
                    <div className="bg-muted p-3 rounded-md text-sm">
                      <span className="font-semibold block">{selectedEnrollmentForDelete.user.name || 'N/A'}</span>
                      <span className="text-muted-foreground block">{selectedEnrollmentForDelete.user.email}</span>
                      <span className="text-xs text-muted-foreground mt-1 block">
                        Session: {selectedEnrollmentForDelete.session?.title || 'N/A'}
                      </span>
                    </div>
                  </div>
                </div>
              ) : (
                <span>Loading enrollment information...</span>
              )}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 mt-4">
            <div className="space-y-2">
              <Label htmlFor="security-password" className="flex items-center gap-2 text-base font-medium">
                <Lock className="h-4 w-4" />
                Security Password
              </Label>
              <Input
                id="security-password"
                type="password"
                placeholder="Enter security password to confirm"
                value={securityPassword}
                onChange={(e) => setSecurityPassword(e.target.value)}
                className="h-11"
              />
              <p className="text-xs text-muted-foreground">
                Enter the security password to enable the delete button
              </p>
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t">
              <Button 
                variant="outline" 
                onClick={() => {
                  setDeleteDialogOpen(false);
                  setSecurityPassword('');
                  setSelectedEnrollmentForDelete(null);
                }}
                disabled={deletingEnrollment}
              >
                Cancel
              </Button>
              <Button 
                variant="destructive"
                onClick={confirmDeleteEnrollment} 
                disabled={deletingEnrollment || !securityPassword}
                className="gap-2"
              >
                {deletingEnrollment ? (
                  <>
                    <RefreshCw className="h-4 w-4 animate-spin" />
                    Deleting...
                  </>
                ) : (
                  <>
                    <Trash2 className="h-4 w-4" />
                    Delete Permanently
                  </>
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
