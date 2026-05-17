"use client"

import { useEffect, useState, useCallback } from "react"
import { useAuth } from "@clerk/nextjs"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { toast } from "sonner"
import { DataTable } from "@/app/(admin)/admin/users/components/data-table"
import { RoleUpdateDialog } from "@/components/admin/role-update-dialog"
import { UserData } from "@/app/(admin)/admin/users/components/types"
import { Users, Shield, CreditCard, RefreshCw, TrendingUp, AlertTriangle } from "lucide-react"

// Helper function to format date as dd/mm/yyyy
const formatDate = (dateString: string | null | undefined) => {
  if (!dateString) return ""
  const date = new Date(dateString)
  const day = String(date.getDate()).padStart(2, "0")
  const month = String(date.getMonth() + 1).padStart(2, "0")
  const year = date.getFullYear()
  return `${day}/${month}/${year}`
}

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
    lifetimeRevenue: 0,
    lastDisbursementDate: null as string | null,
    lastDisbursementAmount: null as number | null,
  })
  const [loading, setLoading] = useState(true)
  const [selectedUser, setSelectedUser] = useState<UserData | null>(null)
  const [roleDialogOpen, setRoleDialogOpen] = useState(false)

  // Delete confirmation dialog state
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [userToDelete, setUserToDelete] = useState<UserData | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)

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

  const handleDeleteUser = (user: UserData) => {
    setUserToDelete(user)
    setDeleteDialogOpen(true)
  }

  const confirmDeleteUser = async () => {
    if (!userToDelete) return

    setIsDeleting(true)
    try {
      const token = await getToken()
      const response = await fetch(`/api/admin/users/${userToDelete.id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      })

      if (!response.ok) {
        const data = await response.json().catch(() => ({}))
        throw new Error(data.error || "Failed to delete user")
      }

      toast.success(`User "${userToDelete.name || userToDelete.email}" has been permanently deleted.`)
      setDeleteDialogOpen(false)
      setUserToDelete(null)
      fetchUsers()
    } catch (error) {
      console.error("Error deleting user:", error)
      toast.error(error instanceof Error ? error.message : "Failed to delete user")
    } finally {
      setIsDeleting(false)
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
    currentRevenue: dashboardStats.totalRevenue,
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
              Current Revenue
            </CardTitle>
            <div className="p-2 bg-emerald-100 dark:bg-emerald-800 rounded-lg">
              <CreditCard className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-emerald-900 dark:text-emerald-100">
              ₹{stats.currentRevenue.toLocaleString()}
            </div>
            <p className="text-xs text-emerald-600/70 dark:text-emerald-400/70 mt-1">
              Current revenue
            </p>
            {dashboardStats.lifetimeRevenue > 0 && (
              <p className="text-xs text-emerald-500/60 dark:text-emerald-500/60 mt-0.5">
                ₹{dashboardStats.lifetimeRevenue.toLocaleString()} lifetime
              </p>
            )}
            {dashboardStats.lastDisbursementDate && (
              <p className="text-xs text-emerald-500/50 dark:text-emerald-500/50 mt-0.5">
                Last disbursement: {formatDate(dashboardStats.lastDisbursementDate)}
              </p>
            )}
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

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={(open) => {
        if (!isDeleting) {
          setDeleteDialogOpen(open)
          if (!open) setUserToDelete(null)
        }
      }}>
        <DialogContent className="sm:max-w-[460px]">
          <DialogHeader>
            <div className="flex items-center gap-3 mb-1">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-red-100 dark:bg-red-900/30">
                <AlertTriangle className="h-5 w-5 text-red-600 dark:text-red-400" />
              </div>
              <DialogTitle className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                Delete User Permanently
              </DialogTitle>
            </div>
            <DialogDescription className="text-sm text-muted-foreground pt-1">
              You are about to permanently delete{" "}
              <span className="font-semibold text-gray-900 dark:text-gray-100">
                {userToDelete?.name || userToDelete?.email}
              </span>
              {userToDelete?.name && (
                <span className="text-xs block text-muted-foreground mt-0.5">
                  {userToDelete.email}
                </span>
              )}
            </DialogDescription>
          </DialogHeader>

          <div className="rounded-lg border border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-950/20 px-4 py-3 text-sm text-red-700 dark:text-red-300 space-y-1">
            <p className="font-semibold">This action will permanently wipe:</p>
            <ul className="list-disc list-inside space-y-0.5 text-red-600 dark:text-red-400">
              <li>All enrollments and course progress</li>
              <li>All subscriptions and payment history</li>
              <li>All mock test attempts and scores</li>
              <li>All certificates and session enrollments</li>
              <li>Their platform account (Clerk login)</li>
            </ul>
          </div>

          <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
            This cannot be undone. Are you sure you want to continue?
          </p>

          <DialogFooter className="gap-2 sm:gap-2">
            <Button
              variant="outline"
              onClick={() => {
                setDeleteDialogOpen(false)
                setUserToDelete(null)
              }}
              disabled={isDeleting}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={confirmDeleteUser}
              disabled={isDeleting}
              className="gap-2"
            >
              {isDeleting ? (
                <>
                  <RefreshCw className="h-4 w-4 animate-spin" />
                  Deleting...
                </>
              ) : (
                "Delete Permanently"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
