"use client"

import * as React from "react"
import { useAuth } from "@clerk/nextjs"
import { toast } from "sonner"
import { Check, LockKeyhole, Plus, Shield, Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Switch } from "@/components/ui/switch"
import { ADMIN_PERMISSION_DEFINITIONS, ADMIN_PERMISSION_GROUPS, type PermissionKey } from "@/lib/roleConfig"

type RoleDefinition = {
  key: string
  name: string
  permissions: PermissionKey[]
  readOnly: boolean
  canDelete: boolean
  isBuiltIn?: boolean
}

type Props = {
  open: boolean
  onOpenChange: (open: boolean) => void
  user: { id: string; name: string; email: string; role: string }
  onUpdate: () => void
}

export function RolePermissionDialog({ open, onOpenChange, user, onUpdate }: Props) {
  const { getToken } = useAuth()
  const [roles, setRoles] = React.useState<RoleDefinition[]>([])
  const [selectedRole, setSelectedRole] = React.useState(user.role)
  const [permissions, setPermissions] = React.useState<PermissionKey[]>([])
  const [readOnly, setReadOnly] = React.useState(false)
  const [canDelete, setCanDelete] = React.useState(false)
  const [newRoleName, setNewRoleName] = React.useState("")
  const [creating, setCreating] = React.useState(false)
  const [saving, setSaving] = React.useState(false)

  const loadRoles = React.useCallback(async () => {
    const response = await fetch("/api/admin/roles")
    const data = await response.json()
    if (!response.ok) throw new Error(data.error || "Unable to load roles")
    setRoles(data.roles)
    return data.roles as RoleDefinition[]
  }, [])

  const selectRole = React.useCallback((key: string, availableRoles: RoleDefinition[]) => {
    const role = availableRoles.find((item) => item.key === key)
    setSelectedRole(key)
    setPermissions(role?.permissions ?? [])
    setReadOnly(role?.readOnly ?? false)
    setCanDelete(role?.canDelete ?? false)
  }, [])

  React.useEffect(() => {
    if (!open) return
    loadRoles().then((availableRoles) => selectRole(user.role, availableRoles)).catch((error) => toast.error(error.message))
  }, [open, user.role, loadRoles, selectRole])

  const togglePermission = (permission: PermissionKey, checked: boolean) => {
    setPermissions((current) => checked ? [...new Set([...current, permission])] : current.filter((item) => item !== permission))
  }

  const toggleGroup = (groupPermissions: readonly PermissionKey[], checked: boolean) => {
    setPermissions((current) => checked
      ? [...new Set([...current, ...groupPermissions])]
      : current.filter((item) => !groupPermissions.includes(item)))
  }

  const saveRole = async (roleKey: string, roleName?: string) => {
    const token = await getToken()
    if (roleKey !== "ADMIN") {
      const roleResponse = await fetch(`/api/admin/roles/${encodeURIComponent(roleKey)}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ name: roleName, permissions, readOnly, canDelete }),
      })
      const roleData = await roleResponse.json()
      if (!roleResponse.ok) throw new Error(roleData.error || "Unable to save role permissions")
    }

    const userResponse = await fetch(`/api/admin/users/${user.id}/role`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({ role: roleKey }),
    })
    const userData = await userResponse.json()
    if (!userResponse.ok) throw new Error(userData.error || "Unable to assign role")
    return userData.warning as string | undefined
  }

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()
    setSaving(true)
    try {
      const warning = await saveRole(selectedRole)
      if (warning) toast.warning(warning)
      else toast.success(`Updated ${user.name || user.email}'s access profile`)
      onUpdate()
      onOpenChange(false)
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Unable to update role")
    } finally {
      setSaving(false)
    }
  }

  const handleCreateAndAssign = async () => {
    if (newRoleName.trim().length < 2) {
      toast.error("Enter a role name first")
      return
    }
    setCreating(true)
    try {
      const token = await getToken()
      const response = await fetch("/api/admin/roles", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ name: newRoleName, permissions, readOnly, canDelete }),
      })
      const data = await response.json()
      if (!response.ok) throw new Error(data.error || "Unable to create role")
      const warning = await saveRole(data.role.key, data.role.name)
      if (warning) toast.warning(`${data.role.name} created and assigned. ${warning}`)
      else toast.success(`Created and assigned ${data.role.name}`)
      onUpdate()
      onOpenChange(false)
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Unable to create role")
    } finally {
      setCreating(false)
    }
  }

  const isAdmin = selectedRole === "ADMIN"

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2"><Shield className="h-5 w-5 text-primary" />Manage access profile</DialogTitle>
          <DialogDescription>Configure sidebar access and operation limits for {user.name || user.email}. Changes are enforced by the server.</DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="grid gap-4 sm:grid-cols-[minmax(0,1fr)_auto]">
            <div className="space-y-2">
              <Label htmlFor="role-select">Assigned role</Label>
              <select id="role-select" value={selectedRole} onChange={(event) => selectRole(event.target.value, roles)} className="h-9 w-full rounded-md border bg-background px-3 text-sm">
                {roles.map((role) => <option key={role.key} value={role.key}>{role.name}{role.isBuiltIn ? " (built-in)" : ""}</option>)}
              </select>
              <p className="text-xs text-muted-foreground">Current: {user.role}</p>
            </div>
            <div className="flex items-end">
              <Button type="button" variant="outline" onClick={() => { setNewRoleName(""); setSelectedRole("__new__"); setPermissions([]); setReadOnly(false); setCanDelete(false) }} className="gap-2"><Plus className="h-4 w-4" />Create role</Button>
            </div>
          </div>

          {selectedRole === "__new__" && (
            <div className="rounded-lg border border-dashed p-4 space-y-2">
              <Label htmlFor="new-role-name">New role name</Label>
              <Input id="new-role-name" value={newRoleName} onChange={(event) => setNewRoleName(event.target.value)} placeholder="Content Manager" maxLength={60} />
              <p className="text-xs text-muted-foreground">The new profile will be created with the access selected below and assigned to this user.</p>
            </div>
          )}

          <div className="grid gap-3 sm:grid-cols-2">
            <div className="flex items-center justify-between rounded-lg border p-3">
              <div className="flex items-center gap-2"><LockKeyhole className="h-4 w-4 text-muted-foreground" /><div><Label>Read only</Label><p className="text-xs text-muted-foreground">Block create, edit, and send actions</p></div></div>
              <Switch checked={isAdmin ? false : readOnly} disabled={isAdmin} onCheckedChange={setReadOnly} aria-label="Read only" />
            </div>
            <div className="flex items-center justify-between rounded-lg border p-3">
              <div className="flex items-center gap-2"><Trash2 className="h-4 w-4 text-muted-foreground" /><div><Label>Delete enabled</Label><p className="text-xs text-muted-foreground">Allow destructive actions</p></div></div>
              <Switch checked={isAdmin || canDelete} disabled={isAdmin} onCheckedChange={setCanDelete} aria-label="Delete enabled" />
            </div>
          </div>

          <div className="space-y-2">
            <div><Label>Sidebar access</Label><p className="text-xs text-muted-foreground">Select a section to grant all routes beneath that sidebar link.</p></div>
            <ScrollArea className="h-64 rounded-lg border p-4">
              <div className="space-y-5">
                {ADMIN_PERMISSION_GROUPS.map((group) => {
                  const allChecked = group.permissions.every((permission) => permissions.includes(permission))
                  return <div key={group.label} className="space-y-2">
                    <label className="flex items-center gap-2 text-sm font-semibold"><Checkbox checked={isAdmin || allChecked} disabled={isAdmin} onCheckedChange={(checked) => toggleGroup(group.permissions, checked === true)} /><span>{group.label}</span></label>
                    <div className="grid gap-2 pl-6 sm:grid-cols-2">
                      {group.permissions.map((permission) => <label key={permission} className="flex items-center gap-2 text-sm text-muted-foreground"><Checkbox checked={isAdmin || permissions.includes(permission)} disabled={isAdmin} onCheckedChange={(checked) => togglePermission(permission, checked === true)} /><span>{ADMIN_PERMISSION_DEFINITIONS[permission].label}</span></label>)}
                    </div>
                  </div>
                })}
              </div>
            </ScrollArea>
          </div>

          {isAdmin && <p className="rounded-md bg-primary/10 px-3 py-2 text-sm text-primary"><Check className="mr-1 inline h-4 w-4" />Admin has unrestricted access and cannot be narrowed by this editor.</p>}
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={saving || creating}>Cancel</Button>
            {selectedRole === "__new__" ? <Button type="button" onClick={handleCreateAndAssign} disabled={saving || creating}>{creating ? "Creating..." : "Create and assign"}</Button> : <Button type="submit" disabled={saving || creating}>{saving ? "Saving..." : "Save access"}</Button>}
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
