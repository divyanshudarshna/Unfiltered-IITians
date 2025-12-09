"use client"

import { useEffect, useState, useCallback } from "react"
import { useAuth } from "@clerk/nextjs"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { toast } from "sonner"
import { DataTable } from "@/app/(admin)/admin/users/components/data-table"
import { RoleUpdateDialog } from "@/components/admin/role-update-dialog"
import { UserData } from "@/app/(admin)/admin/users/components/types"
import { Users, Shield, CreditCard, RefreshCw, TrendingUp } from "lucide-react"

interface UserManagementProps {
  showEnrollmentStats?: boolean
  containerClassName?: string
}

export function UserManagement({ showEnrollmentStats = false, containerClassName }: UserManagementProps) {
  const { getToken } = useAuth()
  const [users, setUsers] = useState<UserData[]>([])
  const [dashboardStats, setDashboardStats] = useState({
    totalUsers: 0,
    totalSubscribers: 0,
    totalEnrollments: 0,
    totalRevenue: 0,
  })
  const [loading, setLoading] = useState(true)
  const [selectedUser, setSelectedUser] = useState<UserData | null>(null)
  const [roleDialogOpen, setRoleDialogOpen] = useState(false)

  const fetchUsers = useCallback(async () => {
    try {
      setLoading(true)
      const token = await getToken()
      
      // Fetch both users and dashboard stats
      const [usersResponse, dashboardResponse] = await Promise.all([
        fetch("/api/admin/users", {
          headers: { Authorization: `Bearer ${token}` },
        }),
        fetch("/api/admin/users/dashboard-data", {
          headers: { Authorization: `Bearer ${token}` },
        })
      ])

      if (!usersResponse.ok) throw new Error("Failed to fetch users")
      if (!dashboardResponse.ok) throw new Error("Failed to fetch dashboard stats")

      const usersData = await usersResponse.json()
      const dashboardData = await dashboardResponse.json()
      
      setUsers(usersData)
      setDashboardStats(dashboardData.stats)
    } catch (error) {
      console.error("Error fetching users:", error)
      toast.error("Failed to load users")
    } finally {
      setLoading(false)
    }
  }, [getToken])

  const handleDeleteUser = async (user: UserData) => {
    if (!confirm(`Delete user "${user.name}"? This cannot be undone.`)) return

    try {
      const token = await getToken()
      const response = await fetch(`/api/admin/users/${user.id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      })

      if (!response.ok) throw new Error("Failed to delete user")

      toast.success("User deleted successfully")
      fetchUsers()
    } catch (error) {
      console.error("Error deleting user:", error)
      toast.error("Failed to delete user")
    }
  }

  const handleViewDetails = (user: UserData) => {
    setSelectedUser(user)
    // Details dialog implementation can be added here
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
    totalUsers: dashboardStats.totalUsers,
    roleBreakdown: {
      admin: users.filter(u => u.role === "ADMIN").length,
      instructor: users.filter(u => u.role === "INSTRUCTOR").length,
      student: users.filter(u => u.role === "STUDENT").length,
    },
    premiumUsers: dashboardStats.totalSubscribers,
    totalRevenue: dashboardStats.totalRevenue,
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="flex items-center space-x-2 text-muted-foreground">
          <RefreshCw className="h-5 w-5 animate-spin" />
          <span>Loading users...</span>
        </div>
      </div>
    )
  }

  return (
    <div className={containerClassName || "w-full space-y-6"}>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="space-y-2">
          <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-gray-900 dark:text-gray-100">
            User Management
          </h2>
          <p className="text-sm text-muted-foreground max-w-2xl">
            Manage users, roles, subscriptions, and monitor platform performance metrics
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
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3">
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

      {/* Data Table - Fixed Responsive Container */}
      <div className="w-full overflow-hidden">
        <DataTable
          data={users}
          onViewDetails={handleViewDetails}
          onUpdateRole={handleUpdateRole}
          onDeleteUser={handleDeleteUser}
        />
      </div>

      {/* Enrollment Statistics - Only show on /admin/users page */}
      {showEnrollmentStats && (
        <div className="w-full">
          {/* EnrollmentStats component would go here if needed */}
        </div>
      )}

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
  )
}
