import { AdminStatsContainer } from "@/components/admin/admin-stats-container"

export const metadata = {
  title: "Transaction Analytics | Admin Dashboard",
  description: "Detailed transaction analytics and revenue insights across all products",
}

export default function AdminStatsPage() {
  return (
    <div className="flex flex-1 flex-col">
      <div className="@container/main flex flex-1 flex-col gap-2">
        <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
          <AdminStatsContainer />
        </div>
      </div>
    </div>
  )
}