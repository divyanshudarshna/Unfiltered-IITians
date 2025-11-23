"use client"

import * as React from "react"
import {
  ColumnFiltersState,
  SortingState,
  VisibilityState,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table"
import { ChevronDown, Search, Download, Filter, Users, Crown, Target, TrendingUp, CreditCard, Mail, Send, AlertTriangle } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Input } from "@/components/ui/input"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { UserData } from "./types"
import { createColumns } from "./columns"
import { toast } from "sonner"

interface DataTableProps {
  data: UserData[]
  onViewDetails: (user: UserData) => void
  onUpdateRole: (user: UserData) => void
  onDeleteUser: (user: UserData) => void
}

export function DataTable({
  data,
  onViewDetails,
  onUpdateRole,
  onDeleteUser,
}: DataTableProps) {
  const [sorting, setSorting] = React.useState<SortingState>([])
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>([])
  const [columnVisibility, setColumnVisibility] = React.useState<VisibilityState>({})
  const [rowSelection, setRowSelection] = React.useState({})
  const [globalFilter, setGlobalFilter] = React.useState("")
  
  // Email dialog state
  const [isEmailDialogOpen, setIsEmailDialogOpen] = React.useState(false)
  const [emailSubject, setEmailSubject] = React.useState("Important Update from Unfiltered IITians")
  const [emailMessage, setEmailMessage] = React.useState("")
  const [isSendingEmail, setIsSendingEmail] = React.useState(false)
  
  // Clear mock attempts dialog state
  const [isClearMockDialogOpen, setIsClearMockDialogOpen] = React.useState(false)
  const [userToClearMocks, setUserToClearMocks] = React.useState<UserData | null>(null)
  const [isClearingMocks, setIsClearingMocks] = React.useState(false)

  // Set default column visibility: User, Email, Role, Status, Mock Attempts, Revenue
  React.useEffect(() => {
    setColumnVisibility({
      phoneNumber: false,
      subscriptionsCount: false,
      joinedAt: false,
      // Show these columns by default:
      // name (User), email, role, isPaid (Status), mockAttemptsCount, totalRevenue
    })
  }, [])

  const handleClearMockAttempts = (user: UserData) => {
    setUserToClearMocks(user)
    setIsClearMockDialogOpen(true)
  }

  const confirmClearMockAttempts = async () => {
    if (!userToClearMocks) return

    setIsClearingMocks(true)
    try {
      const response = await fetch(`/api/admin/users/${userToClearMocks.id}/clear-mocks`, {
        method: 'DELETE',
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to clear mock attempts')
      }

      toast.success(`Successfully cleared ${data.deletedCount || 'all'} mock attempt(s) for ${userToClearMocks.name || 'user'}`)
      setIsClearMockDialogOpen(false)
      setUserToClearMocks(null)
      
      // Refresh the page data
      window.location.reload()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to clear mock attempts')
    } finally {
      setIsClearingMocks(false)
    }
  }

  const columns = createColumns(onViewDetails, onUpdateRole, onDeleteUser, handleClearMockAttempts)

  const table = useReactTable({
    data,
    columns,
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    onColumnVisibilityChange: setColumnVisibility,
    onRowSelectionChange: setRowSelection,
    onGlobalFilterChange: setGlobalFilter,
    globalFilterFn: (row, columnId, filterValue) => {
      const searchValue = filterValue.toLowerCase()
      const user = row.original
      
      return (
        user.name?.toLowerCase().includes(searchValue) ||
        user.email?.toLowerCase().includes(searchValue) ||
        user.phoneNumber?.toLowerCase().includes(searchValue) ||
        user.role?.toLowerCase().includes(searchValue)
      )
    },
    state: {
      sorting,
      columnFilters,
      columnVisibility,
      rowSelection,
      globalFilter,
    },
  })

  // Calculate statistics
  const stats = React.useMemo(() => {
    const totalUsers = data.length
    const premiumUsers = data.filter(user => user.isPaid).length
    const totalRevenue = data.reduce((sum, user) => sum + user.totalRevenue, 0)
    const avgMockScore = data.length > 0 
      ? data.reduce((sum, user) => sum + user.avgMockScore, 0) / data.length 
      : 0

    return {
      totalUsers,
      premiumUsers,
      freeUsers: totalUsers - premiumUsers,
      totalRevenue,
      avgMockScore: Math.round(avgMockScore * 10) / 10,
      conversionRate: totalUsers > 0 ? (premiumUsers / totalUsers) * 100 : 0,
    }
  }, [data])

  const getColumnDisplayName = (columnId: string): string => {
    const displayNames: Record<string, string> = {
      mockAttemptsCount: "Mock Attempts",
      subscriptionsCount: "Subscriptions", 
      avgMockScore: "Avg Score",
      totalRevenue: "Revenue",
      joinedAt: "Joined Date",
      isSubscribed: "Status",
      phoneNumber: "Phone",
      role: "User Role"
    }
    return displayNames[columnId] || columnId
  }

  const exportData = () => {
    const selectedRows = table.getFilteredSelectedRowModel().rows
    const exportData = selectedRows.length > 0 
      ? selectedRows.map(row => row.original)
      : table.getFilteredRowModel().rows.map(row => row.original)
    
    const csvContent = [
      ['Name', 'Email', 'Phone', 'Role', 'Status', 'Subscriptions', 'Mock Attempts', 'Avg Score', 'Revenue', 'Joined Date'],
      ...exportData.map(user => [
        user.name || '',
        user.email || '',
        user.phoneNumber || '',
        user.role,
        user.isPaid ? 'Paid' : 'Free',
        user.subscriptionsCount.toString(),
        user.mockAttemptsCount.toString(),
        user.avgMockScore.toString(),
        user.totalRevenue.toString(),
        new Date(user.joinedAt).toLocaleDateString()
      ])
    ].map(row => row.join(',')).join('\n')

    const blob = new Blob([csvContent], { type: 'text/csv' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `users_export_${new Date().toISOString().split('T')[0]}.csv`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    window.URL.revokeObjectURL(url)
  }

  const handleOpenEmailDialog = () => {
    const selectedRows = table.getFilteredSelectedRowModel().rows
    if (selectedRows.length === 0) {
      toast.error('Please select at least one user')
      return
    }
    setIsEmailDialogOpen(true)
  }

  const handleSendEmail = async () => {
    if (!emailMessage.trim()) {
      toast.error('Please enter an email message')
      return
    }

    const selectedRows = table.getFilteredSelectedRowModel().rows
    const userIds = selectedRows.map(row => row.original.id)

    setIsSendingEmail(true)
    try {
      const response = await fetch('/api/admin/users/send-email', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userIds,
          subject: emailSubject,
          message: emailMessage,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to send emails')
      }

      toast.success(data.message || `Email sent successfully to ${userIds.length} user(s)`)
      setIsEmailDialogOpen(false)
      setEmailMessage('')
      setEmailSubject('Important Update from Unfiltered IITians')
      table.resetRowSelection()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to send emails')
    } finally {
      setIsSendingEmail(false)
    }
  }

  return (
    <div className="w-full space-y-4">
    
      {/* Main Table Card */}
      <Card className="border-0 shadow-lg bg-dark backdrop-blur-sm ">
        <CardHeader className="pb-4">
          <div className="flex  flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <div className="space-y-1">
              <CardTitle className="text-lg font-bold text-gray-900 dark:text-gray-100">
                User Management
              </CardTitle>
              <CardDescription className="text-xs">
                Manage {data.length} users, roles, and subscriptions
              </CardDescription>
            </div>
            <div className="flex flex-col sm:flex-row gap-2">
              {table.getFilteredSelectedRowModel().rows.length > 0 && (
                <Button 
                  variant="default" 
                  size="sm" 
                  onClick={handleOpenEmailDialog}
                  className="gap-2 text-xs h-9 bg-blue-600 hover:bg-blue-700"
                >
                  <Mail className="h-3 w-3" />
                  Send Email
                  <Badge variant="secondary" className="ml-1 bg-white text-blue-700 text-xs">
                    {table.getFilteredSelectedRowModel().rows.length}
                  </Badge>
                </Button>
              )}
              <Button 
                variant="outline" 
                size="sm" 
                onClick={exportData}
                className="gap-2 text-xs h-9"
              >
                <Download className="h-3 w-3" />
                Export
                <Badge variant="secondary" className="ml-1 bg-blue-100 text-blue-700 dark:bg-blue-900/20 dark:text-blue-300 text-xs">
                  {table.getFilteredSelectedRowModel().rows.length || table.getFilteredRowModel().rows.length}
                </Badge>
              </Button>
            </div>
          </div>
        </CardHeader>
        
        <CardContent className="space-y-4">
          {/* Table Controls */}
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3">
            <div className="flex flex-col sm:flex-row gap-2 flex-1">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-3 w-3 text-gray-400" />
                <Input
                  placeholder="Search users..."
                  value={globalFilter ?? ""}
                  onChange={(event) => setGlobalFilter(event.target.value)}
                  className="pl-8 h-9 text-sm"
                />
              </div>
              
              {table.getFilteredSelectedRowModel().rows.length > 0 && (
                <Badge variant="default" className="sm:self-center bg-blue-100 text-blue-700 dark:bg-blue-900/20 dark:text-blue-300 border-0 text-xs">
                  {table.getFilteredSelectedRowModel().rows.length} selected
                </Badge>
              )}
            </div>

            <div className="flex items-center gap-2">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button 
                    variant="outline" 
                    size="sm"
                    className="gap-2 h-9 text-xs"
                  >
                    <Filter className="h-3 w-3" />
                    Columns
                    <ChevronDown className="h-3 w-3" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-40">
                  {table
                    .getAllColumns()
                    .filter((column) => column.getCanHide())
                    .map((column) => {
                      return (
                        <DropdownMenuCheckboxItem
                          key={column.id}
                          checked={column.getIsVisible()}
                          onCheckedChange={(value) => column.toggleVisibility(!!value)}
                          className="capitalize text-xs"
                        >
                          {getColumnDisplayName(column.id)}
                        </DropdownMenuCheckboxItem>
                      )
                    })}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>

          {/* Data Table - Fully Responsive with Horizontal Scroll */}
          <div className="rounded-lg border border-gray-200 dark:border-gray-700 overflow-x-auto">
            <div className="min-w-max">
              <Table className="w-full">
                <TableHeader className="bg-gray-50/80 dark:bg-gray-800/80">
                  {table.getHeaderGroups().map((headerGroup) => (
                    <TableRow key={headerGroup.id} className="border-gray-200 dark:border-gray-700">
                      {headerGroup.headers.map((header) => {
                        return (
                          <TableHead 
                            key={header.id}
                            className="font-semibold text-gray-700 dark:text-gray-300 py-3 text-xs whitespace-nowrap"
                          >
                            {header.isPlaceholder
                              ? null
                              : flexRender(
                                  header.column.columnDef.header,
                                  header.getContext()
                                )}
                          </TableHead>
                        )
                      })}
                    </TableRow>
                  ))}
                </TableHeader>
                <TableBody>
                  {table.getRowModel().rows?.length ? (
                    table.getRowModel().rows.map((row) => (
                      <TableRow
                        key={row.id}
                        data-state={row.getIsSelected() && "selected"}
                        className="border-gray-100 dark:border-gray-800 hover:bg-gray-50/80 dark:hover:bg-gray-700/80"
                      >
                        {row.getVisibleCells().map((cell) => (
                          <TableCell key={cell.id} className="py-2 text-xs whitespace-nowrap">
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
                        className="h-24 text-center text-gray-500 dark:text-gray-400"
                      >
                        <div className="flex flex-col items-center justify-center space-y-2">
                          <Users className="h-6 w-6 text-gray-300" />
                          <p className="text-sm font-medium">No users found</p>
                        </div>
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </div>

          {/* Enhanced Pagination */}
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3 py-2">
            <div className="text-xs text-gray-600 dark:text-gray-400">
              Showing{" "}
              <span className="font-semibold text-gray-900 dark:text-gray-100">
                {table.getFilteredRowModel().rows.length}
              </span>{" "}
              users
              {table.getFilteredSelectedRowModel().rows.length > 0 && (
                <span>
                  {" "}(<span className="font-semibold text-blue-600 dark:text-blue-400">
                    {table.getFilteredSelectedRowModel().rows.length}
                  </span> selected)
                </span>
              )}
            </div>

            <div className="flex flex-col sm:flex-row items-center gap-3">
              <div className="flex items-center space-x-2">
                <p className="text-xs text-gray-600 dark:text-gray-400 whitespace-nowrap">Rows:</p>
                <select
                  value={table.getState().pagination.pageSize}
                  onChange={(e) => {
                    table.setPageSize(Number(e.target.value))
                  }}
                  className="h-8 rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-xs px-2"
                >
                  {[10, 20, 30, 40, 50].map((pageSize) => (
                    <option key={pageSize} value={pageSize}>
                      {pageSize}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex items-center space-x-1">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => table.previousPage()}
                  disabled={!table.getCanPreviousPage()}
                  className="h-8 w-8 p-0"
                >
                  ‹
                </Button>
                
                <div className="flex items-center text-xs font-medium px-2">
                  <span className="font-semibold text-gray-900 dark:text-gray-100">
                    {table.getState().pagination.pageIndex + 1}
                  </span>
                  <span className="mx-1">/</span>
                  <span className="font-semibold text-gray-900 dark:text-gray-100">
                    {table.getPageCount()}
                  </span>
                </div>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => table.nextPage()}
                  disabled={!table.getCanNextPage()}
                  className="h-8 w-8 p-0"
                >
                  ›
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Email Dialog */}
      <Dialog open={isEmailDialogOpen} onOpenChange={setIsEmailDialogOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Mail className="h-5 w-5 text-blue-600" />
              Send Email to Selected Users
            </DialogTitle>
            <DialogDescription>
              Compose and send an email to {table.getFilteredSelectedRowModel().rows.length} selected user(s)
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="subject">Subject</Label>
              <Input
                id="subject"
                value={emailSubject}
                onChange={(e) => setEmailSubject(e.target.value)}
                placeholder="Enter email subject"
                className="w-full"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="message">Message</Label>
              <Textarea
                id="message"
                value={emailMessage}
                onChange={(e) => setEmailMessage(e.target.value)}
                placeholder="Enter your message here..."
                className="min-h-[200px] w-full"
              />
              <p className="text-xs text-muted-foreground">
                The message will be sent with professional formatting and platform branding.
              </p>
            </div>
            
            <div className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded-lg border border-blue-200 dark:border-blue-800">
              <p className="text-xs text-blue-800 dark:text-blue-300">
                <strong>Note:</strong> Emails will be personalized with each user's name and include links to the dashboard and courses.
              </p>
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsEmailDialogOpen(false)}
              disabled={isSendingEmail}
            >
              Cancel
            </Button>
            <Button
              onClick={handleSendEmail}
              disabled={isSendingEmail || !emailMessage.trim()}
              className="gap-2"
            >
              {isSendingEmail ? (
                <>
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                  Sending...
                </>
              ) : (
                <>
                  <Send className="h-4 w-4" />
                  Send Email
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Clear Mock Attempts Confirmation Dialog */}
      <Dialog open={isClearMockDialogOpen} onOpenChange={setIsClearMockDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-red-600 dark:text-red-400">
              <AlertTriangle className="h-5 w-5" />
              Clear Mock Attempts
            </DialogTitle>
            <DialogDescription>
              This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="bg-red-50 dark:bg-red-900/20 p-4 rounded-lg border border-red-200 dark:border-red-800">
              <p className="text-sm text-red-800 dark:text-red-300">
                All mock attempts by <strong>{userToClearMocks?.name || 'this user'}</strong> will be deleted permanently.
              </p>
              <p className="text-sm text-red-800 dark:text-red-300 mt-2">
                This includes all test scores, answers, and attempt history.
              </p>
            </div>
            
            <div className="bg-yellow-50 dark:bg-yellow-900/20 p-3 rounded-lg border border-yellow-200 dark:border-yellow-800">
              <p className="text-xs text-yellow-800 dark:text-yellow-300">
                <strong>Warning:</strong> The user will still have access to take mock tests if they have active subscriptions.
              </p>
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsClearMockDialogOpen(false)}
              disabled={isClearingMocks}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={confirmClearMockAttempts}
              disabled={isClearingMocks}
              className="gap-2"
            >
              {isClearingMocks ? (
                <>
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                  Clearing...
                </>
              ) : (
                <>
                  <AlertTriangle className="h-4 w-4" />
                  Clear All Attempts
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}