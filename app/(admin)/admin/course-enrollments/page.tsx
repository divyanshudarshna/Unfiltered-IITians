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
  Plus
} from 'lucide-react';
import { format } from 'date-fns';

interface Enrollment {
  id: string;
  enrolledAt: string;
  expiresAt: string | null;
  actualAmountPaid: number | null;
  couponCode: string | null;
  user: {
    id: string;
    name: string | null;
    email: string;
    profileImageUrl: string | null;
  };
  course: {
    id: string;
    title: string;
    price: number;
    durationMonths: number;
  };
}

interface Course {
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

export default function CourseEnrollmentsPage() {
  const { getToken } = useAuth();
  const [enrollments, setEnrollments] = useState<Enrollment[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);

  // Filters
  const [selectedCourse, setSelectedCourse] = useState('');
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

  // Fetch courses with enrollments
  useEffect(() => {
    const fetchCourses = async () => {
      try {
        const token = await getToken();
        const response = await fetch('/api/admin/enrollments/courses', {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (response.ok) {
          const data = await response.json();
          setCourses(data.courses || []);
          if (data.courses && data.courses.length > 0) {
            setSelectedCourse(data.courses[0].id);
          }
        }
      } catch (error) {
        console.error('Error fetching courses:', error);
      }
    };
    fetchCourses();
  }, [getToken]);

  // Fetch enrollments
  const fetchEnrollments = async () => {
    if (!selectedCourse) return;
    
    try {
      setLoading(true);
      const token = await getToken();

      const params = new URLSearchParams({
        page: page.toString(),
        limit: '50',
        sortBy,
        sortOrder,
        courseId: selectedCourse,
        ...(search && { search }),
      });

      const response = await fetch(`/api/admin/enrollments?${params}`, {
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
    if (selectedCourse) {
      fetchEnrollments();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, selectedCourse, sortBy, sortOrder]);

  // Handle search with debounce
  useEffect(() => {
    if (!selectedCourse) return;
    
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

  // Reset page when course changes
  useEffect(() => {
    setPage(1);
    setSelectedEnrollments([]);
    setSelectAll(false);
  }, [selectedCourse]);

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
      const response = await fetch('/api/admin/enrollments/send-email', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          enrollmentIds: selectedEnrollments,
          courseId: selectedCourse,
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
      const response = await fetch('/api/admin/enrollments/add-mocks', {
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

  const selectedCourseName = courses.find(c => c.id === selectedCourse)?.title || '';

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
              Course Enrollments
            </h1>
            <p className="text-muted-foreground text-sm lg:text-base">
              Manage student enrollments and send personalized emails
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

        {/* Course Selector Card */}
        <Card className="border-2 shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <GraduationCap className="h-5 w-5 text-primary" />
              Select Course
            </CardTitle>
            <CardDescription>
              Choose a course to view and manage its enrollments
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Select value={selectedCourse} onValueChange={setSelectedCourse}>
              <SelectTrigger className="w-full h-12 text-base">
                <SelectValue placeholder="Select a course..." />
              </SelectTrigger>
              <SelectContent>
                {courses.map((course) => (
                  <SelectItem key={course.id} value={course.id} className="cursor-pointer">
                    <div className="flex items-center justify-between w-full gap-4">
                      <span className="font-medium">{course.title}</span>
                      <Badge variant="secondary" className="ml-auto">
                        <Users className="h-3 w-3 mr-1" />
                        {course._count.enrollments}
                      </Badge>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </CardContent>
        </Card>
      </div>

      {selectedCourse && (
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
                  <div className="overflow-x-auto rounded-lg border">
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
                                  {enrollment.actualAmountPaid 
                                    ? (enrollment.actualAmountPaid / 100).toFixed(2)
                                    : (enrollment.course.price).toFixed(2)}
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
                                {enrollment.course.durationMonths} months
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
                              {enrollment.expiresAt ? (
                                <div className="flex items-center gap-2">
                                  <Clock className="h-4 w-4 text-muted-foreground" />
                                  <span className="text-sm">
                                    {format(new Date(enrollment.expiresAt), 'MMM dd, yyyy')}
                                  </span>
                                </div>
                              ) : (
                                <span className="text-sm text-muted-foreground">N/A</span>
                              )}
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
              Compose a personalized email for {selectedEnrollments.length} selected student(s) from <strong>{selectedCourseName}</strong>
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
    </div>
  );
}
