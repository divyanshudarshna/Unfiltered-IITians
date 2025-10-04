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
import { ChevronDown, Search, Download, Filter, Users, Crown, Target, TrendingUp, CreditCard } from "lucide-react"

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
import { UserData } from "./types"
import { createColumns } from "./columns"

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

  // Hide less important columns on mobile by default
  React.useEffect(() => {
    setColumnVisibility({
      phoneNumber: false,
      mockAttemptsCount: false,
      subscriptionsCount: false,
      totalRevenue: false,
      joinedAt: false,
    })
  }, [])

  const columns = createColumns(onViewDetails, onUpdateRole, onDeleteUser)

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
    const premiumUsers = data.filter(user => user.isSubscribed).length
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
        user.isSubscribed ? 'Premium' : 'Free',
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

  return (
    <div className="w-full space-y-4">
      {/* Enhanced Statistics Cards - Responsive */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
        <Card className="col-span-2 lg:col-span-1 border-0 shadow-sm bg-gradient-to-br from-blue-500 to-blue-600 text-white">
          <CardContent className="p-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium opacity-90">Total Users</p>
                <p className="text-lg font-bold mt-1">{stats.totalUsers.toLocaleString()}</p>
              </div>
              <div className="p-1 bg-white/20 rounded-lg">
                <Users className="h-4 w-4" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-sm bg-gradient-to-br from-amber-500 to-orange-500 text-white">
          <CardContent className="p-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium opacity-90">Premium</p>
                <p className="text-lg font-bold mt-1">{stats.premiumUsers}</p>
              </div>
              <div className="p-1 bg-white/20 rounded-lg">
                <Crown className="h-4 w-4" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-sm bg-gradient-to-br from-purple-500 to-pink-500 text-white">
          <CardContent className="p-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium opacity-90">Free</p>
                <p className="text-lg font-bold mt-1">{stats.freeUsers}</p>
              </div>
              <div className="p-1 bg-white/20 rounded-lg">
                <Users className="h-4 w-4" />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* <Card className="border-0 shadow-sm bg-gradient-to-br from-green-500 to-emerald-500 text-white">
          <CardContent className="p-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium opacity-90">Avg Score</p>
                <p className="text-lg font-bold mt-1">{stats.avgMockScore}%</p>
              </div>
              <div className="p-1 bg-white/20 rounded-lg">
                <Target className="h-4 w-4" />
              </div>
            </div>
          </CardContent>
        </Card> */}

        <Card className="border-0 shadow-sm bg-gradient-to-br from-emerald-500 to-teal-500 text-white">
          <CardContent className="p-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium opacity-90">Revenue</p>
                <p className="text-lg font-bold mt-1">₹{stats.totalRevenue.toLocaleString()}</p>
              </div>
              <div className="p-1 bg-white/20 rounded-lg">
                <CreditCard className="h-4 w-4" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Table Card */}
      <Card className="border-0 shadow-lg  bg-slate-950 backdrop-blur-sm px-4">
        <CardHeader className="pb-4">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <div className="space-y-1">
              <CardTitle className="text-lg font-bold text-gray-900 dark:text-gray-100">
                User Management
              </CardTitle>
              <CardDescription className="text-xs">
                Manage {data.length} users, roles, and subscriptions
              </CardDescription>
            </div>
            <div className="flex flex-col sm:flex-row gap-2">
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

          {/* Data Table - Fully Responsive */}
          <div className="rounded-lg border border-gray-200 dark:border-gray-700 overflow-x-auto">
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
    </div>
  )
}