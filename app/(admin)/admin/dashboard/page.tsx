// app/(admin)/dashboard/page.tsx
import { ChartAreaInteractive } from "@/components/admin/chart-area-interactive"
import { DataTable } from "@/components/admin/data-table"
import { SectionCards } from "@/components/admin/section-cards"
import data from "./data.json"

export default function Page() {
  return (
    <div className="space-y-6">
      <SectionCards />
      <div className="grid gap-6">
        <div className="rounded-lg border p-4">
          <ChartAreaInteractive />
        </div>
        <div className="rounded-lg border p-4">
          <DataTable data={data} />
        </div>
      </div>
    </div>
  )
}