"use client"

import * as React from "react"
import { useAuth } from "@clerk/nextjs"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { toast } from "sonner"
import { Shield, Lock } from "lucide-react"

interface RoleUpdateDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  user: {
    id: string
    name: string
    email: string
    role: string
  }
  onUpdate: () => void
}

export function RoleUpdateDialog({
  open,
  onOpenChange,
  user,
  onUpdate,
}: RoleUpdateDialogProps) {
  const { getToken } = useAuth()
  const [newRole, setNewRole] = React.useState(user.role)
  const [password, setPassword] = React.useState("")
  const [loading, setLoading] = React.useState(false)

  // Reset form when dialog opens with a new user
  React.useEffect(() => {
    if (open) {
      setNewRole(user.role)
      setPassword("")
    }
  }, [open, user.role])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (password !== "RAJ64") {
      toast.error("Incorrect password! Failed to update role.")
      return
    }

    if (newRole === user.role) {
      toast.error("Please select a different role.")
      return
    }

    setLoading(true)
    try {
      const token = await getToken()
      const response = await fetch(`/api/admin/users/${user.id}/role`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`,
        },
        body: JSON.stringify({ role: newRole, password }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Failed to update role")
      }

      toast.success(`Successfully updated ${user.name}'s role to ${newRole}`)
      onUpdate()
      onOpenChange(false)
      setPassword("")
    } catch (error) {
      console.error("Error updating role:", error)
      const errorMessage = error instanceof Error ? error.message : "Failed to update role. Please try again."
      toast.error(errorMessage)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-orange-500" />
            Update User Role
          </DialogTitle>
          <DialogDescription>
            Update the role for {user.name} ({user.email}). This action requires admin password confirmation.
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="current-role">Current Role</Label>
            <div className="p-2 bg-gray-50 rounded-md text-sm text-gray-600">
              {user.role}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="new-role">New Role</Label>
            <Select value={newRole} onValueChange={setNewRole}>
              <SelectTrigger>
                <SelectValue placeholder="Select a role" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="STUDENT">Student</SelectItem>
                <SelectItem value="INSTRUCTOR">Instructor</SelectItem>
                <SelectItem value="ADMIN">Admin</SelectItem>
              </SelectContent>
            </Select>
            {newRole !== user.role && (
              <p className="text-sm text-amber-600 dark:text-amber-400">
                Role will be changed from {user.role} to {newRole}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="password" className="flex items-center gap-2">
              <Lock className="h-4 w-4" />
              Admin Password
            </Label>
            <Input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter admin password"
              required
            />
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Updating..." : "Update Role"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}