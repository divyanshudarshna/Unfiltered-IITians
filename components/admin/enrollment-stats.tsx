"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { 
  BookOpen, 
  FileText, 
  Users, 
  Calendar,
  TrendingUp,
  DollarSign,
  User
} from "lucide-react"
import { toast } from "sonner"

interface CourseEnrollment {
  id: string
  title: string
  totalEnrollments: number
  activeEnrollments: number
  revenue: number
  averageRating: number | null
  enrollments: {
    id: string
    user: {
      name: string | null
      email: string
    }
    enrolledAt: string
    expiresAt: string | null
    isActive: boolean
  }[]
}

interface MockBundleSubscription {
  id: string
  title: string
  totalSubscriptions: number
  activeSubscriptions?: number
  revenue: number
  subscriptions: {
    id: string
    user: {
      name: string | null
      email: string
    }
    actualAmountPaid?: number | null
    amount: number
    createdAt?: string
    purchasedAt: string
    expiresAt: string | null
    paid: boolean
  }[]
}

interface SessionEnrollment {
  id: string
  title: string
  type: string
  price: number
  totalEnrollments: number
  maxEnrollment: number | null
  revenue: number
  enrollments: {
    id: string
    user: {
      name: string | null
      email: string
    }
    enrolledAt: string
    paymentStatus: string
    studentName: string | null
    studentPhone: string | null
  }[]
}

interface DashboardStats {
  totalUsers: number
  totalSubscribers: number
  totalEnrollments: number
  totalRevenue: number
}

interface EnrollmentStatsProps {
  readonly dashboardStats?: DashboardStats
}

export function EnrollmentStats({ dashboardStats }: EnrollmentStatsProps) {
  const [courseEnrollments, setCourseEnrollments] = useState<CourseEnrollment[]>([])
  const [mockBundleSubscriptions, setMockBundleSubscriptions] = useState<MockBundleSubscription[]>([])
  const [sessionEnrollments, setSessionEnrollments] = useState<SessionEnrollment[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchEnrollmentStats()
  }, [])

  const fetchEnrollmentStats = async () => {
    try {
      setLoading(true)
      
      const [coursesRes, mockBundlesRes, sessionsRes] = await Promise.all([
        fetch('/api/admin/stats/course-enrollments'),
        fetch('/api/admin/stats/mockbundle-subscriptions'),
        fetch('/api/admin/stats/session-enrollments')
      ])

      if (coursesRes.ok) {
        const coursesData = await coursesRes.json()
        setCourseEnrollments(coursesData)
      }

      if (mockBundlesRes.ok) {
        const mockBundlesData = await mockBundlesRes.json()
        setMockBundleSubscriptions(mockBundlesData)
      }

      if (sessionsRes.ok) {
        const sessionsData = await sessionsRes.json()
        setSessionEnrollments(sessionsData)
      }

    } catch (error) {
      console.error('Error fetching enrollment stats:', error)
      toast.error('Failed to load enrollment statistics')
    } finally {
      setLoading(false)
    }
  }

  const formatCurrency = (amount: number) => {
    // Handle NaN, null, undefined values
    const safeAmount = Number.isNaN(amount) || amount === null || amount === undefined ? 0 : amount
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR'
    }).format(safeAmount)
  }

  if (loading) {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Enrollment Statistics
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        </CardContent>
      </Card>
    )
  }

  // Calculate revenue breakdown by segment with NaN protection
  const courseRevenue = courseEnrollments.reduce((sum, course) => sum + (course.revenue || 0), 0)
  const mockBundleRevenue = mockBundleSubscriptions.reduce((sum, bundle) => sum + (bundle.revenue || 0), 0)  
  const sessionRevenue = sessionEnrollments.reduce((sum, session) => sum + (session.revenue || 0), 0)

  return (
    <div className="w-full space-y-6">
      {/* Revenue Overview Section */}
      {dashboardStats && (
        <Card className="w-full">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <DollarSign className="h-5 w-5 text-green-600" />
              Revenue Overview
            </CardTitle>
            <p className="text-sm text-muted-foreground">
              Total revenue breakdown across all segments
            </p>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <Card className="border-green-200 bg-green-50/50 dark:border-green-800 dark:bg-green-950/20">
                <CardContent className="p-4">
                  <div className="flex items-center gap-2">
                    <DollarSign className="h-4 w-4 text-green-600" />
                    <span className="text-sm font-medium text-green-800 dark:text-green-200">Total Revenue</span>
                  </div>
                  <p className="text-2xl font-bold mt-2 text-green-900 dark:text-green-100">
                    {formatCurrency(dashboardStats.totalRevenue)}
                  </p>
                  <p className="text-xs text-green-600/70 dark:text-green-400/70 mt-1">
                    From all sources
                  </p>
                </CardContent>
              </Card>
              <Card className="border-blue-200 bg-blue-50/50 dark:border-blue-800 dark:bg-blue-950/20">
                <CardContent className="p-4">
                  <div className="flex items-center gap-2">
                    <BookOpen className="h-4 w-4 text-blue-600" />
                    <span className="text-sm font-medium text-blue-800 dark:text-blue-200">Course Revenue</span>
                  </div>
                  <p className="text-2xl font-bold mt-2 text-blue-900 dark:text-blue-100">
                    {formatCurrency(courseRevenue)}
                  </p>
                  <p className="text-xs text-blue-600/70 dark:text-blue-400/70 mt-1">
                    {dashboardStats.totalRevenue > 0 ? ((courseRevenue / dashboardStats.totalRevenue) * 100).toFixed(1) : 0}% of total
                  </p>
                </CardContent>
              </Card>
              <Card className="border-purple-200 bg-purple-50/50 dark:border-purple-800 dark:bg-purple-950/20">
                <CardContent className="p-4">
                  <div className="flex items-center gap-2">
                    <FileText className="h-4 w-4 text-purple-600" />
                    <span className="text-sm font-medium text-purple-800 dark:text-purple-200">Mock Bundle Revenue</span>
                  </div>
                  <p className="text-2xl font-bold mt-2 text-purple-900 dark:text-purple-100">
                    {formatCurrency(mockBundleRevenue)}
                  </p>
                  <p className="text-xs text-purple-600/70 dark:text-purple-400/70 mt-1">
                    {dashboardStats.totalRevenue > 0 ? ((mockBundleRevenue / dashboardStats.totalRevenue) * 100).toFixed(1) : 0}% of total
                  </p>
                </CardContent>
              </Card>
              <Card className="border-orange-200 bg-orange-50/50 dark:border-orange-800 dark:bg-orange-950/20">
                <CardContent className="p-4">
                  <div className="flex items-center gap-2">
                    <Users className="h-4 w-4 text-orange-600" />
                    <span className="text-sm font-medium text-orange-800 dark:text-orange-200">Session Revenue</span>
                  </div>
                  <p className="text-2xl font-bold mt-2 text-orange-900 dark:text-orange-100">
                    {formatCurrency(sessionRevenue)}
                  </p>
                  <p className="text-xs text-orange-600/70 dark:text-orange-400/70 mt-1">
                    {dashboardStats.totalRevenue > 0 ? ((sessionRevenue / dashboardStats.totalRevenue) * 100).toFixed(1) : 0}% of total
                  </p>
                </CardContent>
              </Card>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Detailed Enrollment Statistics */}
      <Card className="w-full">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Enrollment Statistics
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            Track student enrollments across courses, mock bundles, and guidance sessions
          </p>
        </CardHeader>
        <CardContent>
        <Tabs defaultValue="courses" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="courses" className="flex items-center gap-2">
              <BookOpen className="h-4 w-4" />
              Courses ({courseEnrollments.length})
            </TabsTrigger>
            <TabsTrigger value="mockbundles" className="flex items-center gap-2">
              <FileText className="h-4 w-4" />
              Mock Bundles ({mockBundleSubscriptions.length})
            </TabsTrigger>
            <TabsTrigger value="sessions" className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              Sessions ({sessionEnrollments.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="courses" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center gap-2">
                    <BookOpen className="h-4 w-4 text-blue-500" />
                    <span className="text-sm font-medium">Total Courses</span>
                  </div>
                  <p className="text-2xl font-bold mt-2">{courseEnrollments.length}</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center gap-2">
                    <User className="h-4 w-4 text-green-500" />
                    <span className="text-sm font-medium">Total Enrollments</span>
                  </div>
                  <p className="text-2xl font-bold mt-2">
                    {courseEnrollments.reduce((sum, course) => sum + course.totalEnrollments, 0)}
                  </p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center gap-2">
                    <DollarSign className="h-4 w-4 text-emerald-500" />
                    <span className="text-sm font-medium">Total Revenue</span>
                  </div>
                  <p className="text-2xl font-bold mt-2">
                    {formatCurrency(courseEnrollments.reduce((sum, course) => sum + (course.revenue || 0), 0))}
                  </p>
                </CardContent>
              </Card>
            </div>

            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Course</TableHead>
                    <TableHead>Enrollments</TableHead>
                    <TableHead>Active</TableHead>
                    <TableHead>Revenue</TableHead>
                    <TableHead>Avg Rating</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {courseEnrollments.map((course) => (
                    <TableRow key={course.id}>
                      <TableCell className="font-medium">{course.title}</TableCell>
                      <TableCell>{course.totalEnrollments}</TableCell>
                      <TableCell>
                        <Badge variant={course.activeEnrollments > 0 ? "default" : "secondary"}>
                          {course.activeEnrollments}
                        </Badge>
                      </TableCell>
                      <TableCell>{formatCurrency(course.revenue || 0)}</TableCell>
                      <TableCell>
                        {course.averageRating ? (
                          <Badge variant="outline">
                            ⭐ {course.averageRating.toFixed(1)}
                          </Badge>
                        ) : (
                          <span className="text-muted-foreground">No ratings</span>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </TabsContent>

          <TabsContent value="mockbundles" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center gap-2">
                    <FileText className="h-4 w-4 text-orange-500" />
                    <span className="text-sm font-medium">Total Mock Bundles</span>
                  </div>
                  <p className="text-2xl font-bold mt-2">{mockBundleSubscriptions.length}</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center gap-2">
                    <User className="h-4 w-4 text-purple-500" />
                    <span className="text-sm font-medium">Total Subscriptions</span>
                  </div>
                  <p className="text-2xl font-bold mt-2">
                    {mockBundleSubscriptions.reduce((sum, bundle) => sum + bundle.totalSubscriptions, 0)}
                  </p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center gap-2">
                    <DollarSign className="h-4 w-4 text-emerald-500" />
                    <span className="text-sm font-medium">Total Revenue</span>
                  </div>
                  <p className="text-2xl font-bold mt-2">
                    {formatCurrency(mockBundleSubscriptions.reduce((sum, bundle) => sum + (bundle.revenue || 0), 0))}
                  </p>
                </CardContent>
              </Card>
            </div>

            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Mock Bundle</TableHead>
                    <TableHead>Paid Enrollments</TableHead>
                    <TableHead>Avg Amount</TableHead>
                    <TableHead>Total Revenue</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {mockBundleSubscriptions.map((bundle) => (
                    <TableRow key={bundle.id}>
                      <TableCell className="font-medium">
                        <div>
                          <div className="font-medium">{bundle.title}</div>
                          <div className="text-sm text-muted-foreground">
                            Excludes ₹0 individual mock subscriptions
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant={bundle.totalSubscriptions > 0 ? "default" : "secondary"}>
                          {bundle.totalSubscriptions}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {bundle.totalSubscriptions > 0 ? 
                          formatCurrency((bundle.revenue || 0) / bundle.totalSubscriptions) : 
                          formatCurrency(0)
                        }
                      </TableCell>
                      <TableCell className="font-medium">{formatCurrency(bundle.revenue || 0)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </TabsContent>

          <TabsContent value="sessions" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-indigo-500" />
                    <span className="text-sm font-medium">Total Sessions</span>
                  </div>
                  <p className="text-2xl font-bold mt-2">{sessionEnrollments.length}</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center gap-2">
                    <User className="h-4 w-4 text-pink-500" />
                    <span className="text-sm font-medium">Total Enrollments</span>
                  </div>
                  <p className="text-2xl font-bold mt-2">
                    {sessionEnrollments.reduce((sum, session) => sum + session.totalEnrollments, 0)}
                  </p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center gap-2">
                    <DollarSign className="h-4 w-4 text-emerald-500" />
                    <span className="text-sm font-medium">Total Revenue</span>
                  </div>
                  <p className="text-2xl font-bold mt-2">
                    {formatCurrency(sessionEnrollments.reduce((sum, session) => sum + (session.revenue || 0), 0))}
                  </p>
                </CardContent>
              </Card>
            </div>

            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Session</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Price</TableHead>
                    <TableHead>Enrollments</TableHead>
                    <TableHead>Capacity</TableHead>
                    <TableHead>Revenue</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {sessionEnrollments.map((session) => (
                    <TableRow key={session.id}>
                      <TableCell className="font-medium">{session.title}</TableCell>
                      <TableCell>
                        <Badge variant="outline">
                          {session.type === 'ONE_ON_ONE' ? '1-on-1' : 'Group'}
                        </Badge>
                      </TableCell>
                      <TableCell>{formatCurrency(session.price)}</TableCell>
                      <TableCell>{session.totalEnrollments}</TableCell>
                      <TableCell>
                        {session.maxEnrollment ? (
                          <span className={session.totalEnrollments >= session.maxEnrollment ? 'text-red-500 font-semibold' : ''}>
                            {session.totalEnrollments}/{session.maxEnrollment}
                          </span>
                        ) : (
                          <span className="text-muted-foreground">Unlimited</span>
                        )}
                      </TableCell>
                      <TableCell>{formatCurrency(session.revenue || 0)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </TabsContent>
        </Tabs>
        </CardContent>
      </Card>
    </div>
  )
}