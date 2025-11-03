"use client"

import { useState, useEffect } from "react"
import { useAuth } from "@clerk/nextjs"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select"
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table"
import { 
  Download,
  Search,
  Filter,
  TrendingUp,
  TrendingDown,
  IndianRupee,
  Users,
  Package,
  BookOpen,
  Target,
  Trophy,
  ChevronLeft,
  ChevronRight,
  RefreshCw,
  CheckCircle,
  Trash2
} from "lucide-react"
import { toast } from "sonner"
import { format } from "date-fns"

interface Transaction {
  id: string
  type: "course" | "mock" | "bundle" | "session"
  itemId: string
  itemTitle: string
  user: {
    id: string
    name: string | null
    email: string
    profileImageUrl: string | null
  }
  originalPrice: number
  actualAmountPaid: number
  discountApplied: number
  couponCode: string | null
  status: "success" | "pending" | "failed"
  paymentId: string | null
  orderId: string
  transactionDate: string
  createdAt: string
}

interface StatsOverview {
  totalRevenue: number
  totalTransactions: number
  totalDiscounts: number
  avgTransactionValue: number
  pendingTransactions: number
  categoryBreakdown: {
    courses: { revenue: number; count: number; percentage: number }
    mockTests: { revenue: number; count: number; percentage: number }
    mockBundles: { revenue: number; count: number; percentage: number }
    sessions: { revenue: number; count: number; percentage: number }
  }
}

export function AdminStatsContainer() {
  const { getToken } = useAuth()
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [statsOverview, setStatsOverview] = useState<StatsOverview | null>(null)
  const [loading, setLoading] = useState(true)
  const [overviewLoading, setOverviewLoading] = useState(true)

  // Filters
  const [search, setSearch] = useState("")
  const [dateFrom, setDateFrom] = useState("")
  const [dateTo, setDateTo] = useState("")
  const [typeFilter, setTypeFilter] = useState("all")
  const [statusFilter, setStatusFilter] = useState("success") // ✅ Default to success
  const [page, setPage] = useState(1)
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 50,
    total: 0,
    pages: 0
  })

  // Selection for delete functionality
  const [selectedTransactions, setSelectedTransactions] = useState<string[]>([])
  const [deleting, setDeleting] = useState(false)

  const fetchTransactions = async () => {
    try {
      setLoading(true)
      const token = await getToken()
      
      const params = new URLSearchParams({
        page: page.toString(),
        limit: "50",
        ...(search && { search }),
        ...(dateFrom && { dateFrom }),
        ...(dateTo && { dateTo }),
        ...(typeFilter !== "all" && { type: typeFilter }),
        ...(statusFilter !== "all" && { status: statusFilter })
      })

      const response = await fetch(`/api/admin/transaction-analytics?${params}`, {
        headers: { Authorization: `Bearer ${token}` }
      })

      if (!response.ok) throw new Error("Failed to fetch transactions")

      const data = await response.json()
      setTransactions(data.transactions)
      setPagination(data.pagination)
    } catch (error) {
      console.error("Error fetching transactions:", error)
      toast.error("Failed to load transactions")
    } finally {
      setLoading(false)
    }
  }

  const fetchStatsOverview = async () => {
    try {
      setOverviewLoading(true)
      const token = await getToken()
      
      const params = new URLSearchParams({
        ...(dateFrom && { dateFrom }),
        ...(dateTo && { dateTo })
      })
      
      const response = await fetch(`/api/admin/transaction-stats?${params}`, {
        headers: { Authorization: `Bearer ${token}` }
      })

      if (!response.ok) throw new Error("Failed to fetch stats overview")

      const data = await response.json()
      setStatsOverview(data)
    } catch (error) {
      console.error("Error fetching stats overview:", error)
      toast.error("Failed to load stats overview")
    } finally {
      setOverviewLoading(false)
    }
  }

  const exportToCSV = async () => {
    try {
      const token = await getToken()
      
      const params = new URLSearchParams({
        format: "csv",
        ...(search && { search }),
        ...(dateFrom && { dateFrom }),
        ...(dateTo && { dateTo }),
        ...(typeFilter !== "all" && { type: typeFilter }),
        ...(statusFilter !== "all" && { status: statusFilter })
      })

      const response = await fetch(`/api/admin/export-transactions?${params}`, {
        headers: { Authorization: `Bearer ${token}` }
      })

      if (!response.ok) throw new Error("Failed to export data")

      // Get the blob data
      const blob = await response.blob()
      
      // Create download link
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = `transactions-${format(new Date(), "yyyy-MM-dd")}.csv`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      window.URL.revokeObjectURL(url)
      
      toast.success("Transactions exported successfully")
    } catch (error) {
      console.error("Error exporting data:", error)
      toast.error("Failed to export data")
    }
  }

  const deleteTransactions = async (transactionIds: string[]) => {
    try {
      setDeleting(true)
      const token = await getToken()
      
      const response = await fetch('/api/admin/delete-transactions', {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ transactionIds }),
      })

      if (!response.ok) throw new Error('Failed to delete transactions')

      toast.success(`Successfully deleted ${transactionIds.length} transaction(s)`)
      setSelectedTransactions([])
      fetchTransactions() // Refresh the list
    } catch (error) {
      console.error('Error deleting transactions:', error)
      toast.error('Failed to delete transactions')
    } finally {
      setDeleting(false)
    }
  }

  const getTypeIcon = (type: string) => {
    switch (type) {
      case "course": return <BookOpen className="h-4 w-4" />
      case "mock": return <Target className="h-4 w-4" />
      case "bundle": return <Package className="h-4 w-4" />
      case "session": return <Users className="h-4 w-4" />
      default: return <Trophy className="h-4 w-4" />
    }
  }

  const getTypeColor = (type: string) => {
    switch (type) {
      case "course": return "bg-blue-100 text-blue-800"
      case "mock": return "bg-green-100 text-green-800"
      case "bundle": return "bg-purple-100 text-purple-800"
      case "session": return "bg-orange-100 text-orange-800"
      default: return "bg-gray-100 text-gray-800"
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "success": return "bg-green-100 text-green-800"
      case "pending": return "bg-yellow-100 text-yellow-800"
      case "failed": return "bg-red-100 text-red-800"
      default: return "bg-gray-100 text-gray-800"
    }
  }

  useEffect(() => {
    fetchTransactions()
  }, [page, search, dateFrom, dateTo, typeFilter, statusFilter])

  useEffect(() => {
    fetchStatsOverview()
  }, [dateFrom, dateTo])

  useEffect(() => {
    fetchStatsOverview()
  }, [])

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Transaction Analytics</h1>
          <p className="text-muted-foreground">
            Comprehensive revenue and transaction insights across all products
          </p>
        </div>
        <div className="flex gap-2">
          <Button onClick={fetchTransactions} variant="outline" size="sm">
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
          <Button onClick={exportToCSV} variant="outline" size="sm">
            <Download className="h-4 w-4 mr-2" />
            Export CSV
          </Button>
        </div>
      </div>

      {/* Comprehensive Stats Overview - 5 Mini Cards */}
      {!overviewLoading && statsOverview && (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
          <Card className="p-4 min-w-0">
            <div className="flex items-center space-x-2 min-w-0">
              <IndianRupee className="h-5 w-5 text-blue-600" />
              <div className="min-w-0">
                <p className="text-xs text-muted-foreground truncate">Total Revenue</p>
                <p className="text-lg font-bold truncate">₹{statsOverview.totalRevenue.toLocaleString()}</p>
              </div>
            </div>
          </Card>

          <Card className="p-4 min-w-0">
            <div className="flex items-center space-x-2 min-w-0">
              <Users className="h-5 w-5 text-green-600" />
              <div className="min-w-0">
                <p className="text-xs text-muted-foreground truncate">Transactions</p>
                <p className="text-lg font-bold truncate">{statsOverview.totalTransactions}</p>
              </div>
            </div>
          </Card>

          <Card className="p-4 min-w-0">
            <div className="flex items-center space-x-2 min-w-0">
              <TrendingUp className="h-5 w-5 text-purple-600" />
              <div className="min-w-0">
                <p className="text-xs text-muted-foreground truncate">Avg Value</p>
                <p className="text-lg font-bold truncate">₹{Math.round(statsOverview.avgTransactionValue)}</p>
              </div>
            </div>
          </Card>

          <Card className="p-4 min-w-0">
            <div className="flex items-center space-x-2 min-w-0">
              <TrendingDown className="h-5 w-5 text-orange-600" />
              <div className="min-w-0">
                <p className="text-xs text-muted-foreground truncate">Discounts</p>
                <p className="text-lg font-bold truncate">₹{statsOverview.totalDiscounts.toLocaleString()}</p>
              </div>
            </div>
          </Card>

          <Card className="p-4 min-w-0">
            <div className="flex items-center space-x-2 min-w-0">
              <CheckCircle className="h-5 w-5 text-emerald-600" />
              <div className="min-w-0">
                <p className="text-xs text-muted-foreground truncate">Success Rate</p>
                <p className="text-lg font-bold truncate">
                  {statsOverview.totalTransactions > 0 
                    ? Math.round((statsOverview.totalTransactions / (statsOverview.totalTransactions + statsOverview.pendingTransactions)) * 100)
                    : 0}%
                </p>
              </div>
            </div>
          </Card>
        </div>
      )}

      {overviewLoading && (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
          {[...Array(5)].map((_, i) => (
            <Card key={`loading-${i}`} className="p-4 min-w-0">
              <div className="flex items-center space-x-2 min-w-0">
                <div className="h-5 w-5 bg-muted animate-pulse rounded" />
                <div className="flex-1 min-w-0">
                  <div className="h-3 bg-muted animate-pulse rounded mb-1" />
                  <div className="h-4 bg-muted animate-pulse rounded" />
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Category Revenue Breakdown */}
      {!overviewLoading && statsOverview && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Courses</CardTitle>
              <BookOpen className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">₹{statsOverview.categoryBreakdown.courses.revenue.toLocaleString()}</div>
              <p className="text-xs text-muted-foreground">
                {statsOverview.categoryBreakdown.courses.count} sales • {statsOverview.categoryBreakdown.courses.percentage}%
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Mock Tests</CardTitle>
              <Target className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">₹{statsOverview.categoryBreakdown.mockTests.revenue.toLocaleString()}</div>
              <p className="text-xs text-muted-foreground">
                {statsOverview.categoryBreakdown.mockTests.count} sales • {statsOverview.categoryBreakdown.mockTests.percentage}%
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Mock Bundles</CardTitle>
              <Package className="h-4 w-4 text-purple-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">₹{statsOverview.categoryBreakdown.mockBundles.revenue.toLocaleString()}</div>
              <p className="text-xs text-muted-foreground">
                {statsOverview.categoryBreakdown.mockBundles.count} sales • {statsOverview.categoryBreakdown.mockBundles.percentage}%
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Sessions</CardTitle>
              <Users className="h-4 w-4 text-orange-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">₹{statsOverview.categoryBreakdown.sessions.revenue.toLocaleString()}</div>
              <p className="text-xs text-muted-foreground">
                {statsOverview.categoryBreakdown.sessions.count} sales • {statsOverview.categoryBreakdown.sessions.percentage}%
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Transaction Filters
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Search</label>
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search transactions..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-9"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">From Date</label>
              <Input
                type="date"
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">To Date</label>
              <Input
                type="date"
                value={dateTo}
                onChange={(e) => setDateTo(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Type</label>
              <Select value={typeFilter} onValueChange={setTypeFilter}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="course">Courses</SelectItem>
                  <SelectItem value="mock">Mock Tests</SelectItem>
                  <SelectItem value="bundle">Mock Bundles</SelectItem>
                  <SelectItem value="session">Sessions</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Status</label>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="success">Success</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="failed">Failed</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Actions</label>
              <Button 
                variant="outline" 
                onClick={() => {
                  setSearch("")
                  setDateFrom("")
                  setDateTo("")
                  setTypeFilter("all")
                  setStatusFilter("success") // ✅ Reset to success, not all
                  setPage(1)
                }}
                className="w-full"
              >
                Clear Filters
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Transactions Table */}
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle>Recent Transactions</CardTitle>
              {statusFilter === 'success' && (
                <p className="text-sm text-muted-foreground mt-1">
                  Successful transactions cannot be deleted. Switch to &quot;Pending&quot; or &quot;All&quot; status to manage failed transactions.
                </p>
              )}
              {statusFilter !== 'success' && transactions.length > 0 && (
                <p className="text-sm text-muted-foreground mt-1">
                  {transactions.filter(t => t.actualAmountPaid > 0 && t.status !== 'success').length} transactions available for deletion
                </p>
              )}
            </div>
            {selectedTransactions.length > 0 && (
              <Button 
                variant="destructive" 
                size="sm"
                onClick={() => deleteTransactions(selectedTransactions)}
                disabled={deleting}
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Delete Selected ({selectedTransactions.length})
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <RefreshCw className="h-6 w-6 animate-spin mr-2" />
              Loading transactions...
            </div>
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-12">
                      <Checkbox
                        checked={selectedTransactions.length > 0 && selectedTransactions.length === transactions.filter(t => t.actualAmountPaid > 0 && t.status !== 'success').length}
                        onCheckedChange={(checked) => {
                          const selectableTransactions = transactions
                            .filter(t => t.actualAmountPaid > 0 && t.status !== 'success')
                          
                          if (checked) {
                            setSelectedTransactions(selectableTransactions.map(t => t.id))
                          } else {
                            setSelectedTransactions([])
                          }
                        }}
                      />
                    </TableHead>
                    <TableHead>Transaction</TableHead>
                    <TableHead>User</TableHead>
                    <TableHead>Item</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Date</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {transactions
                    .filter(transaction => transaction.actualAmountPaid > 0) // ✅ Filter out zero amount transactions
                    .map((transaction) => (
                    <TableRow key={transaction.id}>
                      <TableCell>
                        {/* Debug: Show checkbox for all transactions temporarily */}
                        <div className="flex items-center space-x-2">
                          {transaction.status !== 'success' ? (
                            <Checkbox
                              checked={selectedTransactions.includes(transaction.id)}
                              onCheckedChange={(checked) => {
                                if (checked) {
                                  setSelectedTransactions(prev => [...prev, transaction.id])
                                } else {
                                  setSelectedTransactions(prev => prev.filter(id => id !== transaction.id))
                                }
                              }}
                            />
                          ) : (
                            <div className="w-4 h-4 border rounded border-muted bg-muted/20 flex items-center justify-center">
                              <span className="text-xs text-muted-foreground">✓</span>
                            </div>
                          )}
                          <span className="text-xs text-muted-foreground">
                            {transaction.status}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            {getTypeIcon(transaction.type)}
                            <Badge className={getTypeColor(transaction.type)}>
                              {transaction.type}
                            </Badge>
                          </div>
                          <div className="text-xs text-muted-foreground font-mono">
                            {transaction.orderId}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="space-y-1">
                          <div className="font-medium">{transaction.user.name || "Unknown"}</div>
                          <div className="text-xs text-muted-foreground">{transaction.user.email}</div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="space-y-1">
                          <div className="font-medium">{transaction.itemTitle}</div>
                          {transaction.couponCode && (
                            <Badge variant="outline" className="text-xs">
                              {transaction.couponCode}
                            </Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="space-y-1">
                          <div className="font-medium">₹{transaction.actualAmountPaid.toLocaleString()}</div>
                          {transaction.discountApplied > 0 && (
                            <div className="text-xs text-green-600">
                              -₹{transaction.discountApplied.toLocaleString()} discount
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge className={getStatusColor(transaction.status)}>
                          {transaction.status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="space-y-1">
                          <div>{format(new Date(transaction.transactionDate), "MMM dd, yyyy")}</div>
                          <div className="text-xs text-muted-foreground">
                            {format(new Date(transaction.transactionDate), "hh:mm a")}
                          </div>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

              {/* Pagination */}
              <div className="flex items-center justify-between mt-4">
                <div className="text-sm text-muted-foreground">
                  Showing {((pagination.page - 1) * pagination.limit) + 1} to {Math.min(pagination.page * pagination.limit, pagination.total)} of {pagination.total} transactions
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPage(Math.max(1, page - 1))}
                    disabled={page <= 1}
                  >
                    <ChevronLeft className="h-4 w-4" />
                    Previous
                  </Button>
                  <div className="text-sm">
                    Page {pagination.page} of {pagination.pages}
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPage(Math.min(pagination.pages, page + 1))}
                    disabled={page >= pagination.pages}
                  >
                    Next
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  )
}