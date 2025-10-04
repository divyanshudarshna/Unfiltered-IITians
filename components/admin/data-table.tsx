"use client"

import * as React from "react"
import {
  ColumnDef,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table"
import { ArrowUpDown, MoreHorizontal, ChevronDown, Phone, GraduationCap, User, Shield, Edit, Trash2, Eye, CheckCircle, Gift } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Input } from "@/components/ui/input"
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { RoleUpdateDialog } from "./role-update-dialog"
import { toast } from "sonner"

export type User = {
  id: string
  name: string
  email: string
  role: string
  phoneNumber: string
  fieldOfStudy: string
  isSubscribed: boolean
  joinedAt: string
  subscriptionsCount: number
  enrollmentsCount: number
  mockAttemptsCount: number
  avgMockScore: number
  totalRevenue: number
  courseProgress: number
}

export const columns: ColumnDef<User>[] = [
  {
    id: "select",
    header: ({ table }) => (
      <Checkbox
        checked={table.getIsAllPageRowsSelected()}
        onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
        aria-label="Select all"
      />
    ),
    cell: ({ row }) => (
      <Checkbox
        checked={row.getIsSelected()}
        onCheckedChange={(value) => row.toggleSelected(!!value)}
        aria-label="Select row"
      />
    ),
    enableSorting: false,
    enableHiding: false,
  },
  {
    accessorKey: "name",
    header: "Name",
    cell: ({ row }) => (
      <div className="flex items-center gap-2">
        <User className="h-4 w-4 text-gray-500" />
        {row.getValue("name")}
      </div>
    ),
  },
  {
    accessorKey: "email",
    header: ({ column }) => (
      <Button
        variant="ghost"
        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
      >
        Email <ArrowUpDown className="ml-2 h-4 w-4" />
      </Button>
    ),
    cell: ({ row }) => <div className="lowercase">{row.getValue("email")}</div>,
  },
  {
    accessorKey: "role",
    header: "Role",
    cell: ({ row }) => (
      <div className="flex items-center gap-1">
        <Shield className="h-4 w-4 text-blue-500" />
        <Badge variant={row.getValue("role") === "ADMIN" ? "destructive" : "secondary"}>
          {row.getValue("role")}
        </Badge>
      </div>
    ),
  },
  {
    accessorKey: "phoneNumber",
    header: "Phone",
    cell: ({ row }) => (
      <div className="flex items-center gap-1">
        <Phone className="h-4 w-4 text-green-600" />
        {row.getValue("phoneNumber") || "-"}
      </div>
    ),
  },
  {
    accessorKey: "fieldOfStudy",
    header: "Field of Study",
    cell: ({ row }) => (
      <div className="flex items-center gap-1">
        <GraduationCap className="h-4 w-4 text-purple-500" />
        {row.getValue("fieldOfStudy") || "-"}
      </div>
    ),
  },
  {
    accessorKey: "isSubscribed",
    header: "Status",
    cell: ({ row }) =>
      row.getValue("isSubscribed") ? (
        <Badge
          variant="outline"
          className="bg-green-100 text-green-700 border-green-300 flex items-center gap-1"
        >
          <CheckCircle className="h-3 w-3" />
          Premium
        </Badge>
      ) : (
        <Badge
          variant="outline"
          className="bg-gray-100 text-gray-600 border-gray-300 flex items-center gap-1"
        >
          <Gift className="h-3 w-3" />
          Free
        </Badge>
      ),
  },
  {
    accessorKey: "subscriptionsCount",
    header: "Subscriptions",
    cell: ({ row }) => (
      <Badge variant="outline" className="text-blue-600">
        {row.getValue("subscriptionsCount")}
      </Badge>
    ),
  },
  {
    accessorKey: "enrollmentsCount", 
    header: "Enrollments",
    cell: ({ row }) => (
      <Badge variant="outline" className="text-purple-600">
        {row.getValue("enrollmentsCount")}
      </Badge>
    ),
  },
  {
    accessorKey: "mockAttemptsCount",
    header: "Mock Attempts",
    cell: ({ row }) => (
      <Badge variant="outline" className="text-orange-600">
        {row.getValue("mockAttemptsCount")}
      </Badge>
    ),
  },
  {
    accessorKey: "avgMockScore",
    header: "Avg Score",
    cell: ({ row }) => {
      const score = row.getValue("avgMockScore")
      let colorClass = "text-red-600"
      if (typeof score === 'number') {
        if (score >= 80) colorClass = "text-green-600"
        else if (score >= 60) colorClass = "text-yellow-600"
      }
      
      return (
        <Badge 
          variant="outline" 
          className={colorClass}
        >
          {score}%
        </Badge>
      )
    },
  },
  {
    accessorKey: "totalRevenue",
    header: "Revenue",
    cell: ({ row }) => (
      <div className="font-medium text-green-600">
        ₹{row.getValue("totalRevenue")}
      </div>
    ),
  },
  {
    accessorKey: "joinedAt",
    header: "Joined",
    cell: ({ row }) => row.getValue("joinedAt"),
  },
  {
    accessorKey: "phoneNumber",
    header: "Phone",
    cell: ({ row }) => (
      <div className="flex items-center gap-1">
        <Phone className="h-4 w-4 text-green-600" />
        {row.getValue("phoneNumber") || "-"}
      </div>
    ),
  },
  {
    accessorKey: "fieldOfStudy",
    header: "Field of Study",
    cell: ({ row }) => (
      <div className="flex items-center gap-1">
        <GraduationCap className="h-4 w-4 text-purple-500" />
        {row.getValue("fieldOfStudy") || "-"}
      </div>
    ),
  },
  {
    accessorKey: "isSubscribed",
    header: "Subscribed",
    cell: ({ row }) =>
      row.getValue("isSubscribed") ? (
       <Badge
      variant="outline"
      className="bg-green-100 text-green-700 border-green-300 flex items-center gap-1"
    >
      <CheckCircle className="h-3 w-3" />
      Yes
    </Badge>
      ) : (
        <Badge
      variant="outline"
      className="bg-gray-100 text-gray-600 border-gray-300 flex items-center gap-1"
    >
      <Gift className="h-3 w-3" />
      Free
    </Badge>
      ),
  },
  {
    accessorKey: "joinedAt",
    header: "Joined",
    cell: ({ row }) => row.getValue("joinedAt"),
  },
  {
    id: "actions",
    enableHiding: false,
    cell: ({ row, table }) => {
      const user = row.original
      return (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="h-8 w-8 p-0">
              <span className="sr-only">Open menu</span>
              <MoreHorizontal />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>Actions</DropdownMenuLabel>
            <DropdownMenuItem
              onClick={() => navigator.clipboard.writeText(user.id)}
            >
              Copy user ID
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={() => {
                // @ts-expect-error - We'll add this function to the table meta
                table.options.meta?.onViewDetails(user)
              }}
            >
              <Eye className="mr-2 h-4 w-4" />
              View details
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => {
                // @ts-expect-error - We'll add this function to the table meta
                table.options.meta?.onUpdateRole(user)
              }}
            >
              <Edit className="mr-2 h-4 w-4" />
              Update role
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem 
              className="text-red-600"
              onClick={() => {
                // @ts-expect-error - We'll add this function to the table meta
                table.options.meta?.onDeleteUser(user)
              }}
            >
              <Trash2 className="mr-2 h-4 w-4" />
              Delete user
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      )
    },
  },
]

export function AdminUsersTable() {
  const [data, setData] = React.useState<User[]>([])
  const [loading, setLoading] = React.useState(true)
  const [roleDialogOpen, setRoleDialogOpen] = React.useState(false)
  const [selectedUser, setSelectedUser] = React.useState<User | null>(null)

  React.useEffect(() => {
    async function fetchUsers() {
      try {
        // Try detailed API first
        let res = await fetch("/api/admin/users/detailed")
        let json = await res.json()
        
        if (!res.ok) {
          // Fallback to basic users API
          console.warn("Detailed API failed, falling back to basic API:", json.error)
          res = await fetch("/api/admin/users")
          json = await res.json()
          
          if (!res.ok) {
            throw new Error(json.error || 'Failed to fetch users')
          }
          
          // Transform basic data to match expected format
          const basicUsers = Array.isArray(json) ? json.map((user: Partial<User>) => ({
            id: user.id || '',
            name: user.name || '',
            email: user.email || '',
            role: user.role || '',
            phoneNumber: user.phoneNumber || '',
            fieldOfStudy: user.fieldOfStudy || '',
            isSubscribed: user.isSubscribed || false,
            joinedAt: user.joinedAt || '',
            subscriptionsCount: 0,
            enrollmentsCount: 0,
            mockAttemptsCount: 0,
            avgMockScore: 0,
            totalRevenue: 0,
            courseProgress: 0
          })) : []
          
          setData(basicUsers)
        } else {
          // Ensure data is always an array
          setData(Array.isArray(json) ? json : [])
        }
      } catch (err) {
        console.error("Failed to load users:", err)
        toast.error("Failed to load users: " + (err instanceof Error ? err.message : 'Unknown error'))
        setData([]) // Set empty array on error
      } finally {
        setLoading(false)
      }
    }
    fetchUsers()
  }, [])

  const refreshData = React.useCallback(async () => {
    try {
      // Try detailed API first
      let res = await fetch("/api/admin/users/detailed")
      let json = await res.json()
      
      if (!res.ok) {
        // Fallback to basic users API
        console.warn("Detailed API failed, falling back to basic API:", json.error)
        res = await fetch("/api/admin/users")
        json = await res.json()
        
        if (!res.ok) {
          throw new Error(json.error || 'Failed to fetch users')
        }
        
        // Transform basic data to match expected format
        const basicUsers = Array.isArray(json) ? json.map((user: Partial<User>) => ({
          id: user.id || '',
          name: user.name || '',
          email: user.email || '',
          role: user.role || '',
          phoneNumber: user.phoneNumber || '',
          fieldOfStudy: user.fieldOfStudy || '',
          isSubscribed: user.isSubscribed || false,
          joinedAt: user.joinedAt || '',
          subscriptionsCount: 0,
          enrollmentsCount: 0,
          mockAttemptsCount: 0,
          avgMockScore: 0,
          totalRevenue: 0,
          courseProgress: 0
        })) : []
        
        setData(basicUsers)
      } else {
        // Ensure data is always an array
        setData(Array.isArray(json) ? json : [])
      }
    } catch (err) {
      console.error("Failed to refresh users:", err)
      toast.error("Failed to refresh users: " + (err instanceof Error ? err.message : 'Unknown error'))
      setData([]) // Set empty array on error
    }
  }, [])

  const handleUpdateRole = React.useCallback((user: User) => {
    setSelectedUser(user)
    setRoleDialogOpen(true)
  }, [])

  const handleViewDetails = React.useCallback((user: User) => {
    // Navigate to user details page or open details modal
    window.open(`/admin/users/${user.id}`, '_blank')
  }, [])

  const handleDeleteUser = React.useCallback(async (user: User) => {
    if (!confirm(`Are you sure you want to delete ${user.name}? This action cannot be undone.`)) {
      return
    }

    try {
      const response = await fetch(`/api/admin/users/${user.id}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        throw new Error('Failed to delete user')
      }

      toast.success(`Successfully deleted ${user.name}`)
      refreshData()
    } catch (error) {
      console.error('Error deleting user:', error)
      toast.error('Failed to delete user')
    }
  }, [refreshData])

  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    meta: {
      onUpdateRole: handleUpdateRole,
      onViewDetails: handleViewDetails,
      onDeleteUser: handleDeleteUser,
    }
  })

  if (loading) return <p className="p-4">Loading users...</p>

  return (
    <div className="w-full p-4">
      {/* Filters */}
      <div className="flex items-center py-4 gap-4">
        <Input
          placeholder="Filter by email..."
          value={(table.getColumn("email")?.getFilterValue() as string) ?? ""}
          onChange={(event) =>
            table.getColumn("email")?.setFilterValue(event.target.value)
          }
          className="max-w-sm"
        />
        <Input
          placeholder="Filter by name..."
          value={(table.getColumn("name")?.getFilterValue() as string) ?? ""}
          onChange={(event) =>
            table.getColumn("name")?.setFilterValue(event.target.value)
          }
          className="max-w-sm"
        />
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" className="ml-auto">
              Columns <ChevronDown />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            {table
              .getAllColumns()
              .filter((col) => col.getCanHide())
              .map((col) => (
                <DropdownMenuCheckboxItem
                  key={col.id}
                  className="capitalize"
                  checked={col.getIsVisible()}
                  onCheckedChange={(val) => col.toggleVisibility(!!val)}
                >
                  {col.id}
                </DropdownMenuCheckboxItem>
              ))}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Stats Summary */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border">
          <div className="text-sm text-gray-600 dark:text-gray-400">Total Users</div>
          <div className="text-2xl font-bold">{Array.isArray(data) ? data.length : 0}</div>
        </div>
        <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border">
          <div className="text-sm text-gray-600 dark:text-gray-400">Premium Users</div>
          <div className="text-2xl font-bold text-green-600">
            {Array.isArray(data) ? data.filter(u => u.isSubscribed).length : 0}
          </div>
        </div>
        <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border">
          <div className="text-sm text-gray-600 dark:text-gray-400">Total Revenue</div>
          <div className="text-2xl font-bold text-blue-600">
            ₹{Array.isArray(data) ? data.reduce((sum, u) => sum + (u.totalRevenue || 0), 0).toLocaleString() : "0"}
          </div>
        </div>
        <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border">
          <div className="text-sm text-gray-600 dark:text-gray-400">Avg Mock Score</div>
          <div className="text-2xl font-bold text-purple-600">
            {Array.isArray(data) && data.length > 0 
              ? Math.round(data.reduce((sum, u) => sum + (u.avgMockScore || 0), 0) / data.length)
              : 0}%
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-hidden rounded-md border">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <TableHead key={header.id}>
                    {header.isPlaceholder
                      ? null
                      : flexRender(
                          header.column.columnDef.header,
                          header.getContext()
                        )}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow key={row.id}>
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={columns.length} className="text-center">
                  No results.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-end space-x-2 py-4">
        <div className="text-sm text-muted-foreground">
          {table.getFilteredSelectedRowModel().rows.length} of{" "}
          {table.getFilteredRowModel().rows.length} row(s) selected.
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => table.previousPage()}
          disabled={!table.getCanPreviousPage()}
        >
          Previous
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => table.nextPage()}
          disabled={!table.getCanNextPage()}
        >
          Next
        </Button>
      </div>

      {/* Role Update Dialog */}
      {selectedUser && (
        <RoleUpdateDialog
          open={roleDialogOpen}
          onOpenChange={setRoleDialogOpen}
          user={selectedUser}
          onUpdate={refreshData}
        />
      )}
    </div>
  )
}
