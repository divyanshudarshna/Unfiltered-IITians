import { SectionCards } from "@/components/admin/section-cards"
import { ChartAreaInteractive } from "@/components/admin/chart-area-interactive"
import { UserManagement } from "@/components/admin/user-management"

export default function Page() {
  return (
        <div className="flex flex-1 flex-col">
          <div className="@container/main flex flex-1 flex-col gap-2">
            <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
              <SectionCards />
              <div className="px-4 lg:px-6">
                <ChartAreaInteractive />
              </div>
              <div className="px-4 lg:px-6">
                <UserManagement />
              </div>
            </div>
          </div>
        </div>
  )
}
