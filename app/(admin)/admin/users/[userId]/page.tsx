"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { ArrowLeft, User, Mail, Phone, GraduationCap, Calendar, Shield, TrendingUp, BookOpen, Target } from "lucide-react"
import { toast } from "sonner"

interface UserDetail {
  id: string
  name: string
  email: string
  role: string
  phoneNumber?: string
  fieldOfStudy?: string
  isSubscribed: boolean
  createdAt: string
  enrollments: Array<{
    id: string
    enrolledAt: string
    course: {
      id: string
      title: string
      price: number
    }
  }>
  mockAttempts: Array<{
    id: string
    score: number
    percentage: number
    startedAt: string
    submittedAt: string
    mockTest: {
      id: string
      title: string
    }
  }>
  subscriptions: Array<{
    id: string
    paid: boolean
    createdAt: string
    actualAmountPaid?: number | null
    course?: {
      id: string
      title: string
      price: number
    }
    mockTest?: {
      id: string
      title: string
      price: number
    }
    mockBundle?: {
      id: string
      title: string
      basePrice: number
    }
  }>
}

export default function UserDetailsPage() {
  const params = useParams()
  const router = useRouter()
  const [user, setUser] = useState<UserDetail | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchUser() {
      try {
        const response = await fetch(`/api/admin/users/${params.userId}?userId=${params.userId}`)
        const data = await response.json()
        
        if (response.ok) {
          setUser(data.user)
        } else {
          toast.error(data.error || "Failed to load user details")
        }
      } catch (error) {
        console.error("Error fetching user:", error)
        toast.error("Failed to load user details")
      } finally {
        setLoading(false)
      }
    }

    if (params.userId) {
      fetchUser()
    }
  }, [params.userId])

  const handleRemoveEnrollment = async (enrollmentId: string, courseName: string) => {
    if (!confirm(`Are you sure you want to remove enrollment for "${courseName}"? This action cannot be undone.`)) {
      return
    }

    try {
      const response = await fetch(`/api/admin/enrollments/${enrollmentId}`, {
        method: 'DELETE',
      })

      if (response.ok) {
        toast.success(`Successfully removed enrollment for ${courseName}`)
        // Refresh user data
        window.location.reload()
      } else {
        toast.error("Failed to remove enrollment")
      }
    } catch (error) {
      console.error("Error removing enrollment:", error)
      toast.error("Failed to remove enrollment")
    }
  }

  if (loading) {
    return <div className="p-6">Loading user details...</div>
  }

  if (!user) {
    return <div className="p-6">User not found</div>
  }

  const totalRevenue = user.subscriptions
    .filter(sub => sub.paid)
    .reduce((sum, sub) => {
      // Use actualAmountPaid if available (handles bundles correctly)
      if (sub.actualAmountPaid !== null && sub.actualAmountPaid !== undefined) {
        return sum + (sub.actualAmountPaid / 100); // Convert paise to rupees
      }
      // Fallback for old records
      return sum + (sub.course?.price || sub.mockTest?.price || sub.mockBundle?.basePrice || 0);
    }, 0)

  const avgMockScore = user.mockAttempts.length > 0
    ? Math.round(user.mockAttempts.reduce((sum, attempt) => sum + (attempt.percentage || 0), 0) / user.mockAttempts.length)
    : 0

  const getScoreColorClass = (score: number) => {
    if (score >= 80) return "text-green-600"
    if (score >= 60) return "text-yellow-600"
    return "text-red-600"
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="outline" size="sm" onClick={() => router.back()}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </Button>
        <div>
          <h1 className="text-3xl font-bold">User Details</h1>
          <p className="text-gray-600">Detailed information and analytics</p>
        </div>
      </div>

      {/* User Info Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Basic Info */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              Basic Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center gap-2">
              <User className="h-4 w-4 text-gray-500" />
              <span className="font-medium">{user.name}</span>
            </div>
            <div className="flex items-center gap-2">
              <Mail className="h-4 w-4 text-gray-500" />
              <span className="text-sm">{user.email}</span>
            </div>
            <div className="flex items-center gap-2">
              <Shield className="h-4 w-4 text-gray-500" />
              <Badge variant={user.role === "ADMIN" ? "destructive" : "secondary"}>
                {user.role}
              </Badge>
            </div>
            {user.phoneNumber && (
              <div className="flex items-center gap-2">
                <Phone className="h-4 w-4 text-gray-500" />
                <span className="text-sm">{user.phoneNumber}</span>
              </div>
            )}
            {user.fieldOfStudy && (
              <div className="flex items-center gap-2">
                <GraduationCap className="h-4 w-4 text-gray-500" />
                <span className="text-sm">{user.fieldOfStudy}</span>
              </div>
            )}
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-gray-500" />
              <span className="text-sm">Joined {new Date(user.createdAt).toLocaleDateString()}</span>
            </div>
          </CardContent>
        </Card>

        {/* Stats */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Statistics
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex justify-between">
              <span className="text-gray-600">Status:</span>
              <Badge variant={user.isSubscribed ? "default" : "secondary"}>
                {user.isSubscribed ? "Premium" : "Free"}
              </Badge>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Enrollments:</span>
              <span className="font-medium">{user.enrollments.length}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Mock Attempts:</span>
              <span className="font-medium">{user.mockAttempts.length}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Avg Mock Score:</span>
              <Badge 
                variant="outline" 
                className={getScoreColorClass(avgMockScore)}
              >
                {avgMockScore}%
              </Badge>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Total Revenue:</span>
              <span className="font-medium text-green-600">₹{totalRevenue.toLocaleString()}</span>
            </div>
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
            <CardDescription>Manage user account</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            <Button variant="outline" className="w-full" size="sm">
              Send Message
            </Button>
            <Button variant="outline" className="w-full" size="sm">
              Update Role
            </Button>
            <Button variant="outline" className="w-full" size="sm">
              Reset Password
            </Button>
            <Separator />
            <Button variant="destructive" className="w-full" size="sm">
              Delete Account
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Enrollments */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BookOpen className="h-5 w-5" />
            Course Enrollments ({user.enrollments.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {user.enrollments.length > 0 ? (
            <div className="space-y-3">
              {user.enrollments.map((enrollment) => (
                <div key={enrollment.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div>
                    <h4 className="font-medium">{enrollment.course.title}</h4>
                    <p className="text-sm text-gray-600">
                      Enrolled on {new Date(enrollment.enrolledAt).toLocaleDateString()}
                    </p>
                    <p className="text-sm text-green-600">₹{enrollment.course.price}</p>
                  </div>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => handleRemoveEnrollment(enrollment.id, enrollment.course.title)}
                  >
                    Remove
                  </Button>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-600">No course enrollments found.</p>
          )}
        </CardContent>
      </Card>

      {/* Mock Attempts */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="h-5 w-5" />
            Mock Test Attempts ({user.mockAttempts.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {user.mockAttempts.length > 0 ? (
            <div className="space-y-3">
              {user.mockAttempts.slice(0, 10).map((attempt) => (
                <div key={attempt.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div>
                    <h4 className="font-medium">{attempt.mockTest.title}</h4>
                    <p className="text-sm text-gray-600">
                      Attempted on {new Date(attempt.startedAt).toLocaleDateString()}
                    </p>
                    {attempt.submittedAt && (
                      <p className="text-sm text-gray-500">
                        Submitted: {new Date(attempt.submittedAt).toLocaleDateString()}
                      </p>
                    )}
                  </div>
                  <div className="text-right">
                    <Badge
                      variant="outline"
                      className={getScoreColorClass(attempt.percentage || 0)}
                    >
                      {attempt.percentage || 0}%
                    </Badge>
                    <p className="text-sm text-gray-600 mt-1">
                      Score: {attempt.score || 0}
                    </p>
                  </div>
                </div>
              ))}
              {user.mockAttempts.length > 10 && (
                <p className="text-sm text-gray-600 text-center">
                  ... and {user.mockAttempts.length - 10} more attempts
                </p>
              )}
            </div>
          ) : (
            <p className="text-gray-600">No mock attempts found.</p>
          )}
        </CardContent>
      </Card>

      {/* Subscriptions */}
      <Card>
        <CardHeader>
          <CardTitle>Subscriptions ({user.subscriptions.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {user.subscriptions.length > 0 ? (
            <div className="space-y-3">
              {user.subscriptions.map((subscription) => (
                <div key={subscription.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div>
                    <h4 className="font-medium">
                      {subscription.course?.title || 
                       subscription.mockTest?.title || 
                       subscription.mockBundle?.title || 
                       "Unknown"}
                    </h4>
                    <p className="text-sm text-gray-600">
                      Subscribed on {new Date(subscription.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="text-right">
                    <Badge variant={subscription.paid ? "default" : "destructive"}>
                      {subscription.paid ? "Paid" : "Unpaid"}
                    </Badge>
                    <p className="text-sm text-gray-600 mt-1">
                      ₹{subscription.course?.price || 
                        subscription.mockTest?.price || 
                        subscription.mockBundle?.basePrice || 0}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-600">No subscriptions found.</p>
          )}
        </CardContent>
      </Card>
    </div>
  )
}