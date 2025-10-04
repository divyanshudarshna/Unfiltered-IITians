"use client"

import { ColumnDef } from "@tanstack/react-table"
import { ArrowUpDown, MoreHorizontal, Eye, Edit, Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { UserData } from "./types"

export const createColumns = (
  onViewDetails: (user: UserData) => void,
  onUpdateRole: (user: UserData) => void,
  onDeleteUser: (user: UserData) => void
): ColumnDef<UserData>[] => [
  {
    id: "select",
    header: ({ table }) => (
      <Checkbox
        checked={table.getIsAllPageRowsSelected()}
        onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
        aria-label="Select all"
        className="border-gray-300 dark:border-gray-600"
      />
    ),
    cell: ({ row }) => (
      <Checkbox
        checked={row.getIsSelected()}
        onCheckedChange={(value) => row.toggleSelected(!!value)}
        aria-label="Select row"
        className="border-gray-300 dark:border-gray-600"
      />
    ),
    enableSorting: false,
    enableHiding: false,
  },
  {
    accessorKey: "name",
    header: ({ column }) => (
      <Button
        variant="ghost"
        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        className="hover:bg-gray-100 dark:hover:bg-gray-800"
      >
        User
        <ArrowUpDown className="ml-2 h-4 w-4" />
      </Button>
    ),
    cell: ({ row }) => {
      const user = row.original
      return (
        <div className="flex items-center space-x-3">
          <Avatar className="h-8 w-8">
            <AvatarImage src={user.profileImageUrl || ""} alt={user.name || ""} />
            <AvatarFallback className="bg-gradient-to-r from-blue-500 to-purple-600 text-white text-xs">
              {user.name?.slice(0, 2).toUpperCase() || "UN"}
            </AvatarFallback>
          </Avatar>
          <div>
            <div className="font-medium text-gray-900 dark:text-gray-100">
              {user.name || "Unnamed User"}
            </div>
            {user.phoneNumber && (
              <div className="text-sm text-gray-500 dark:text-gray-400">
                {user.phoneNumber}
              </div>
            )}
          </div>
        </div>
      )
    },
  },
  {
    accessorKey: "email",
    header: ({ column }) => (
      <Button
        variant="ghost"
        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        className="hover:bg-gray-100 dark:hover:bg-gray-800"
      >
        Email
        <ArrowUpDown className="ml-2 h-4 w-4" />
      </Button>
    ),
    cell: ({ row }) => (
      <div className="text-sm text-gray-900 dark:text-gray-100">
        {row.getValue("email")}
      </div>
    ),
  },
  {
    accessorKey: "role",
    header: "Role",
    cell: ({ row }) => {
      const role = row.getValue("role") as string
      let variant: "destructive" | "default" | "secondary"
      
      if (role === "ADMIN") {
        variant = "destructive"
      } else if (role === "INSTRUCTOR") {
        variant = "default"
      } else {
        variant = "secondary"
      }
      
      return (
        <Badge variant={variant} className="font-medium">
          {role}
        </Badge>
      )
    },
  },
  {
    accessorKey: "isSubscribed",
    header: "Status",
    cell: ({ row }) => {
      const isSubscribed = row.getValue("isSubscribed") as boolean
      return (
        <Badge
          variant={isSubscribed ? "default" : "outline"}
          className={isSubscribed 
            ? "bg-green-100 text-green-800 border-green-300 dark:bg-green-900 dark:text-green-100" 
            : "bg-gray-100 text-gray-800 border-gray-300 dark:bg-gray-800 dark:text-gray-300"
          }
        >
          {isSubscribed ? "Premium" : "Free"}
        </Badge>
      )
    },
  },
  {
    accessorKey: "subscriptionsCount",
    header: ({ column }) => (
      <Button
        variant="ghost"
        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        className="hover:bg-gray-100 dark:hover:bg-gray-800"
      >
        Subscriptions
        <ArrowUpDown className="ml-2 h-4 w-4" />
      </Button>
    ),
    cell: ({ row }) => (
      <div className="text-center">
        <Badge variant="outline" className="font-mono">
          {row.getValue("subscriptionsCount")}
        </Badge>
      </div>
    ),
  },
  {
    accessorKey: "mockAttemptsCount",
    header: ({ column }) => (
      <Button
        variant="ghost"
        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        className="hover:bg-gray-100 dark:hover:bg-gray-800"
      >
        Mock Attempts
        <ArrowUpDown className="ml-2 h-4 w-4" />
      </Button>
    ),
    cell: ({ row }) => (
      <div className="text-center">
        <Badge variant="outline" className="font-mono text-orange-600 dark:text-orange-400">
          {row.getValue("mockAttemptsCount")}
        </Badge>
      </div>
    ),
  },
  {
    accessorKey: "totalRevenue",
    header: ({ column }) => (
      <Button
        variant="ghost"
        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        className="hover:bg-gray-100 dark:hover:bg-gray-800"
      >
        Revenue
        <ArrowUpDown className="ml-2 h-4 w-4" />
      </Button>
    ),
    cell: ({ row }) => {
      const revenue = row.getValue("totalRevenue") as number
      return (
        <div className="text-right font-mono font-medium text-green-600 dark:text-green-400">
          ₹{revenue.toLocaleString()}
        </div>
      )
    },
  },
  {
    accessorKey: "joinedAt",
    header: ({ column }) => (
      <Button
        variant="ghost"
        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        className="hover:bg-gray-100 dark:hover:bg-gray-800"
      >
        Joined
        <ArrowUpDown className="ml-2 h-4 w-4" />
      </Button>
    ),
    cell: ({ row }) => (
      <div className="text-sm text-gray-600 dark:text-gray-400">
        {new Date(row.getValue("joinedAt")).toLocaleDateString()}
      </div>
    ),
  },
  {
    id: "actions",
    enableHiding: false,
    cell: ({ row }) => {
      const user = row.original

      return (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button 
              variant="ghost" 
              className="h-8 w-8 p-0 hover:bg-gray-100 dark:hover:bg-gray-800"
            >
              <span className="sr-only">Open menu</span>
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent 
            align="end" 
            className="w-[200px] bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700"
          >
            <DropdownMenuLabel className="text-gray-900 dark:text-gray-100">
              Actions
            </DropdownMenuLabel>
            <DropdownMenuItem
              onClick={() => navigator.clipboard.writeText(user.id)}
              className="hover:bg-gray-100 dark:hover:bg-gray-700"
            >
              Copy ID
            </DropdownMenuItem>
            <DropdownMenuSeparator className="bg-gray-200 dark:bg-gray-600" />
            <DropdownMenuItem
              onClick={() => onViewDetails(user)}
              className="hover:bg-gray-100 dark:hover:bg-gray-700"
            >
              <Eye className="mr-2 h-4 w-4" />
              View Details
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => onUpdateRole(user)}
              className="hover:bg-gray-100 dark:hover:bg-gray-700"
            >
              <Edit className="mr-2 h-4 w-4" />
              Update Role
            </DropdownMenuItem>
            <DropdownMenuSeparator className="bg-gray-200 dark:bg-gray-600" />
            <DropdownMenuItem
              onClick={() => onDeleteUser(user)}
              className="text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20"
            >
              <Trash2 className="mr-2 h-4 w-4" />
              Delete User
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      )
    },
  },
]