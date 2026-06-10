import { redirect } from "next/navigation";
import type { UserRole } from "@prisma/client";

import { getCurrentUser } from "@/lib/session";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { DashboardHeader } from "./_components/dashboard-header";
import { DashboardSidebar } from "./_components/dashboard-sidebar";

// Only company users may reach the dashboard. (Super Admin has its own area.)
const ALLOWED_ROLES: UserRole[] = ["ADMIN", "MANAGER", "STAFF"];

export default async function DashboardLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  // Defense in depth: proxy.ts already blocks unauthenticated access, but we
  // re-check here so the layout can rely on a real user and enforce role.
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  if (!ALLOWED_ROLES.includes(user.role)) redirect("/login");

  return (
    <SidebarProvider>
      <DashboardSidebar role={user.role} />
      <SidebarInset>
        <DashboardHeader user={user} />
        <main className="flex-1 p-4 sm:p-6 lg:p-8">{children}</main>
      </SidebarInset>
    </SidebarProvider>
  );
}
