"use client"

import { User as UserType } from "../types"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { format } from "date-fns"

type Props = { users: UserType[] }

export function UsersTable({ users }: Props) {
  return (
    <div className="bg-white dark:bg-slate-900 shadow-md rounded-xl p-6">
      <h2 className="text-2xl font-bold mb-4 text-purple-600">Users Overview</h2>
      <div className="overflow-x-auto rounded-lg border border-slate-200 dark:border-slate-800">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Enrolled Courses</TableHead>
              <TableHead>Mocks Attempted</TableHead>
              <TableHead>Joined</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {users.map((user) => (
              <TableRow key={user.id}>
                <TableCell className="font-medium">{user.name}</TableCell>
                <TableCell>{user.email}</TableCell>
                <TableCell>
                  {user.isSubscribed ? (
                    <Badge className="bg-cyan-500/20 text-cyan-600 dark:text-cyan-400">
                      Active
                    </Badge>
                  ) : (
                    <Badge variant="outline" className="text-slate-600 dark:text-slate-400">
                      Free
                    </Badge>
                  )}
                </TableCell>
                <TableCell>{user.enrollments?.length || 0}</TableCell>
                <TableCell>{user.mockAttempts?.length || 0}</TableCell>
                <TableCell>
                  {format(new Date(user.createdAt), "dd MMM yyyy")}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
