"use client"

import { useEffect, useState, useCallback } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { toast } from "sonner"
import { DataTable } from "./components/data-table"
import { EnrollmentStats } from "@/components/admin/enrollment-stats"
import { PasswordProtection } from "@/components/auth/password-protection"

import { RoleUpdateDialog } from "@/components/admin/role-update-dialog"
import { UserData } from "./components/types"
import { Users, Shield, CreditCard, RefreshCw, TrendingUp } from "lucide-react"

export default function StatsUsersPage() {
  const [users, setUsers] = useState<UserData[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedUser, setSelectedUser] = useState<UserData | null>(null)
  const [roleDialogOpen, setRoleDialogOpen] = useState(false)

  const fetchUsers = useCallback(async () => {
    try {
      setLoading(true)
      // Use the same API as admin users but without auth token since this is password protected
      const response = await fetch("/api/admin/users", {
        headers: { 
          'Content-Type': 'application/json',
        },
      })

      if (!response.ok) {
        // Create mock data if API fails for demonstration
        const mockUsers: UserData[] = [
          {
            id: "1",
            name: "John Doe",
            email: "john@example.com",
            role: "STUDENT",
            phoneNumber: "+91 9876543210",
            isSubscribed: true,
            createdAt: new Date().toISOString(),
            joinedAt: new Date().toISOString(),
            subscriptionsCount: 2,
            enrollmentsCount: 3,
            totalRevenue: 5000,
            mockAttemptsCount: 15,
            avgMockScore: 85.5
          },
          {
            id: "2", 
            name: "Jane Smith",
            email: "jane@example.com",
            role: "INSTRUCTOR",
            phoneNumber: "+91 9876543211",
            isSubscribed: false,
            createdAt: new Date().toISOString(),
            joinedAt: new Date().toISOString(),
            subscriptionsCount: 0,
            enrollmentsCount: 1,
            totalRevenue: 0,
            mockAttemptsCount: 5,
            avgMockScore: 75.0
          }
        ]
        setUsers(mockUsers)
        toast.warning("Using demo data - API connection not available")
        return
      }

      const data = await response.json()
      setUsers(data)
    } catch (error) {
      console.error("Error fetching users:", error)
      toast.error("Failed to load users")
      // Set empty array on error
      setUsers([])
    } finally {
      setLoading(false)
    }
  }, [])

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const handleDeleteUser = async (user: UserData) => {
    toast.warning("Delete functionality is disabled in stats view")
  }

  const handleViewDetails = (user: UserData) => {
    setSelectedUser(user)
    toast.info(`Viewing details for ${user.name}`)
  }

  const handleUpdateRole = (user: UserData) => {
    setSelectedUser(user)
    setRoleDialogOpen(true)
  }

  const handleRoleUpdate = () => {
    setRoleDialogOpen(false)
    fetchUsers()
    toast.success("User role updated successfully")
  }

  useEffect(() => {
    fetchUsers()
  }, [fetchUsers])

  const stats = {
    totalUsers: users.length,
    roleBreakdown: {
      admin: users.filter(u => u.role === "ADMIN").length,
      instructor: users.filter(u => u.role === "INSTRUCTOR").length,
      student: users.filter(u => u.role === "STUDENT").length,
    },
    premiumUsers: users.filter(u => u.isSubscribed).length,
    totalRevenue: users.reduce((sum, u) => sum + (u.totalRevenue || 0), 0),
  }

  if (loading) {
    return (
      <PasswordProtection>
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="flex items-center space-x-2 text-muted-foreground">
            <RefreshCw className="h-5 w-5 animate-spin" />
            <span>Loading users...</span>
          </div>
        </div>
      </PasswordProtection>
    )
  }

  return (
    <PasswordProtection>
      <div className="w-full min-h-screen bg-background">
        <div className="w-full px-4 lg:px-6 py-6 space-y-6">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 w-full">
            <div className="space-y-2">
              <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-gray-900 dark:text-gray-100">
                Developer Statistics Dashboard
              </h1>
              <p className="text-sm text-muted-foreground max-w-2xl">
                Protected developer view - User management & enrollment analytics
                <br />
                <span className="text-xs font-mono bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded mt-1 inline-block">
                  Route: /(course)/stats/users
                </span>
              </p>
            </div>
          <Button 
            onClick={fetchUsers} 
            variant="outline" 
            size="sm" 
            className="gap-2 w-full sm:w-auto"
          >
            <RefreshCw className="h-4 w-4" />
            Refresh Data
          </Button>
        </div>

        {/* Statistics Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 w-full">
          <Card className="relative overflow-hidden border-0 shadow-sm bg-gradient-to-br from-blue-50 to-blue-100/50 dark:from-blue-950/20 dark:to-blue-900/20">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-blue-900 dark:text-blue-100">
                Total Users
              </CardTitle>
              <div className="p-2 bg-blue-100 dark:bg-blue-800 rounded-lg">
                <Users className="h-4 w-4 text-blue-600 dark:text-blue-400" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-900 dark:text-blue-100">
                {stats.totalUsers.toLocaleString()}
              </div>
              <p className="text-xs text-blue-600/70 dark:text-blue-400/70 mt-1">
                All platform users
              </p>
            </CardContent>
          </Card>

          <Card className="relative overflow-hidden border-0 shadow-sm bg-gradient-to-br from-purple-50 to-purple-100/50 dark:from-purple-950/20 dark:to-purple-900/20">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-purple-900 dark:text-purple-100">
                User Roles
              </CardTitle>
              <div className="p-2 bg-purple-100 dark:bg-purple-800 rounded-lg">
                <Shield className="h-4 w-4 text-purple-600 dark:text-purple-400" />
              </div>
            </CardHeader>
            <CardContent className="space-y-1.5 text-sm">
              <div className="flex justify-between items-center">
                <span className="text-purple-700/80 dark:text-purple-300/80 text-xs">Admins</span>
                <span className="font-semibold text-purple-900 dark:text-purple-100">
                  {stats.roleBreakdown.admin}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-purple-700/80 dark:text-purple-300/80 text-xs">Instructors</span>
                <span className="font-semibold text-purple-900 dark:text-purple-100">
                  {stats.roleBreakdown.instructor}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-purple-700/80 dark:text-purple-300/80 text-xs">Students</span>
                <span className="font-semibold text-purple-900 dark:text-purple-100">
                  {stats.roleBreakdown.student}
                </span>
              </div>
            </CardContent>
          </Card>

          <Card className="relative overflow-hidden border-0 shadow-sm bg-gradient-to-br from-amber-50 to-amber-100/50 dark:from-amber-950/20 dark:to-amber-900/20">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-amber-900 dark:text-amber-100">
                Premium Users
              </CardTitle>
              <div className="p-2 bg-amber-100 dark:bg-amber-800 rounded-lg">
                <TrendingUp className="h-4 w-4 text-amber-600 dark:text-amber-400" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-amber-900 dark:text-amber-100">
                {stats.premiumUsers}
              </div>
              <p className="text-xs text-amber-600/70 dark:text-amber-400/70 mt-1">
                {stats.totalUsers > 0
                  ? ((stats.premiumUsers / stats.totalUsers) * 100).toFixed(1)
                  : 0}% conversion rate
              </p>
            </CardContent>
          </Card>

          <Card className="relative overflow-hidden border-0 shadow-sm bg-gradient-to-br from-emerald-50 to-emerald-100/50 dark:from-emerald-950/20 dark:to-emerald-900/20">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-emerald-900 dark:text-emerald-100">
                Total Revenue
              </CardTitle>
              <div className="p-2 bg-emerald-100 dark:bg-emerald-800 rounded-lg">
                <CreditCard className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-emerald-900 dark:text-emerald-100">
                ₹{stats.totalRevenue.toLocaleString()}
              </div>
              <p className="text-xs text-emerald-600/70 dark:text-emerald-400/70 mt-1">
                Lifetime revenue
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Data Table - Full Width Container */}
        <div className="w-full">
          <DataTable
            data={users}
            onViewDetails={handleViewDetails}
            onUpdateRole={handleUpdateRole}
            onDeleteUser={handleDeleteUser}
          />
        </div>

        {/* Enrollment Statistics - Full Width */}
        <div className="w-full">
          <EnrollmentStats />
        </div>

        {/* Role Update Dialog */}
        {selectedUser && (
          <RoleUpdateDialog
            open={roleDialogOpen}
            onOpenChange={setRoleDialogOpen}
            user={{
              id: selectedUser.id,
              name: selectedUser.name || "Unknown User",
              email: selectedUser.email,
              role: selectedUser.role,
            }}
            onUpdate={handleRoleUpdate}
          />
        )}
        </div>
      </div>
    </PasswordProtection>
  )
}