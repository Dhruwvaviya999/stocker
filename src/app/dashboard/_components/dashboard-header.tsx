"use client";

import { usePathname } from "next/navigation";
import type { UserRole } from "@prisma/client";
import { Bell } from "lucide-react";

import { ThemeToggle } from "@/components/theme-toggle";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { getPageTitle } from "@/lib/navigation";
import { UserDropdown, type DropdownUser } from "./user-dropdown";

interface HeaderUser extends DropdownUser {
  role: UserRole;
}

/* ─────────────────────────────────────────────────────────────
   NotificationBell — empty-ready placeholder.
   Wire to a real source once the notifications feature lands.
───────────────────────────────────────────────────────────── */
function NotificationBell() {
  const unreadCount = 0;
  const hasUnread = unreadCount > 0;

  return (
    <Popover>
      <PopoverTrigger
        render={
          <Button
            variant="ghost"
            size="icon"
            className="relative rounded-full text-muted-foreground hover:text-foreground"
            aria-label="Notifications"
          />
        }
      >
        <Bell className="size-5" />
        {hasUnread && (
          <span className="absolute right-1.5 top-1.5 flex size-2 rounded-full bg-destructive ring-2 ring-background" />
        )}
      </PopoverTrigger>

      <PopoverContent align="end" sideOffset={8} className="w-80 p-0">
        <div className="flex items-center justify-between px-4 py-3">
          <span className="text-sm font-semibold text-foreground">
            Notifications
          </span>
          {hasUnread && (
            <Badge variant="secondary" className="text-[10px]">
              {unreadCount} new
            </Badge>
          )}
        </div>

        <Separator />

        <ScrollArea className="max-h-80">
          <div className="flex flex-col items-center justify-center px-4 py-10 text-center">
            <Bell className="mb-2 size-8 text-muted-foreground/40" />
            <p className="text-sm text-muted-foreground">
              You&apos;re all caught up!
            </p>
          </div>
        </ScrollArea>
      </PopoverContent>
    </Popover>
  );
}

/* ─────────────────────────────────────────────────────────────
   DashboardHeader — sticky top bar for the dashboard shell.
   Sidebar toggle · current page title · notifications · theme · user menu.
───────────────────────────────────────────────────────────── */
export function DashboardHeader({ user }: { user: HeaderUser }) {
  const pathname = usePathname();
  const title = getPageTitle(pathname);

  return (
    <header className="sticky top-0 z-30 flex h-14 items-center gap-2 border-b bg-background/80 px-3 backdrop-blur supports-backdrop-filter:bg-background/60 sm:px-4">
      <SidebarTrigger className="text-muted-foreground" />
      <Separator orientation="vertical" className="mr-1 h-5" />

      <h1 className="truncate text-base font-semibold tracking-tight">
        {title}
      </h1>

      <div className="flex-1" />

      <div className="flex items-center gap-1">
        <NotificationBell />
        <UserDropdown user={user} />
      </div>
    </header>
  );
}
