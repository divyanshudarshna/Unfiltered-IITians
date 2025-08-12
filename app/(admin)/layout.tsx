import { ReactNode } from "react";
import { currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
// import { AdminSidebar } from "@/components/admin/sidebar";

export default async function AdminLayout({ children }: { children: ReactNode }) {
  const user = await currentUser();
  if (!user || user.publicMetadata.role !== "ADMIN") {
    redirect("/");
  }
  return (
    <div >


      <main className="p-6">{children}</main>

    </div>
  );
}
