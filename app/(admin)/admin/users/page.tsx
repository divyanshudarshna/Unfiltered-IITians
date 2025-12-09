import { UserManagement } from "@/components/admin/user-management"

export default function AdminUsersPage() {
  return (
    <div className="container mx-auto py-6 px-3 sm:px-4 lg:px-6 space-y-6 w-full max-w-full overflow-x-hidden">
      <UserManagement showEnrollmentStats={true} />
      
      {/* Enrollment Statistics can be added here if needed */}
    </div>
  )
}