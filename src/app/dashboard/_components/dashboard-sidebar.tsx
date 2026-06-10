"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { UserRole } from "@prisma/client";

import { BrandLogo } from "@/components/brand-logo";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";
import { isNavItemActive, navGroupsForRole } from "@/lib/navigation";

/**
 * Company dashboard sidebar.
 *
 * The shadcn <Sidebar> renders as a fixed rail on desktop and as a slide-in
 * Sheet (drawer) on mobile automatically, so this one component serves both
 * the desktop and mobile navigation. Items are driven by the shared nav config
 * and filtered to the current user's role.
 */
export function DashboardSidebar({ role }: { role: UserRole }) {
  const pathname = usePathname();
  const { setOpenMobile, isMobile } = useSidebar();
  const groups = navGroupsForRole(role);

  // Close the mobile drawer after a navigation tap; a no-op on desktop.
  const handleNavigate = () => {
    if (isMobile) setOpenMobile(false);
  };

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader>
        <Link
          href="/dashboard"
          onClick={handleNavigate}
          className="flex items-center px-1 py-1.5 group-data-[collapsible=icon]:justify-center"
        >
          {/* Full logo when expanded, just the mark when collapsed to icons. */}
          <BrandLogo className="group-data-[collapsible=icon]:hidden" />
          <BrandLogo
            className="hidden group-data-[collapsible=icon]:flex"
            markClassName="size-6"
          />
        </Link>
      </SidebarHeader>

      <SidebarContent>
        {groups.map((group) => (
          <SidebarGroup key={group.label}>
            <SidebarGroupLabel>{group.label}</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {group.items.map(({ href, label, icon: Icon, exact }) => (
                  <SidebarMenuItem key={href}>
                    <SidebarMenuButton
                      isActive={isNavItemActive(pathname, href, exact)}
                      tooltip={label}
                      render={<Link href={href} onClick={handleNavigate} />}
                    >
                      <Icon />
                      <span>{label}</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        ))}
      </SidebarContent>

      <SidebarFooter>
        <p className="px-2 py-1 text-[11px] text-muted-foreground group-data-[collapsible=icon]:hidden">
          Stocker · {role.charAt(0) + role.slice(1).toLowerCase()}
        </p>
      </SidebarFooter>
    </Sidebar>
  );
}
