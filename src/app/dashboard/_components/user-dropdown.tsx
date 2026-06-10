"use client";

import Link from "next/link";
import { signOut } from "next-auth/react";
import { useTheme } from "next-themes";
import type { UserRole } from "@prisma/client";
import { LogOut, Settings, Users } from "lucide-react";

import { ThemeToggle } from "@/components/theme-toggle";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export interface DropdownUser {
  name?: string | null;
  username?: string | null;
  email?: string | null;
  image?: string | null;
  role: UserRole;
}

function getInitials(user: DropdownUser) {
  const source = user.name || user.username || "?";
  const initials = source
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((p) => p[0])
    .join("");
  return initials.toUpperCase() || "?";
}

/**
 * Avatar-triggered account menu shown in the header. Holds the profile info
 * placeholder, admin-only account links, the theme toggle, and sign out.
 */
export function UserDropdown({ user }: { user: DropdownUser }) {
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === "dark";
  const label = user.name || user.username || "User";
  const isAdmin = user.role === "ADMIN";

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <Button
            variant="ghost"
            size="icon"
            className="rounded-full"
            aria-label="Account menu"
          />
        }
      >
        <Avatar className="size-8">
          {user.image ? <AvatarImage src={user.image} alt={label} /> : null}
          <AvatarFallback className="bg-secondary text-secondary-foreground text-xs font-semibold">
            {getInitials(user)}
          </AvatarFallback>
        </Avatar>
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end" sideOffset={8} className="w-60">
        {/* Profile info placeholder */}
        <div className="flex items-center gap-3 px-2 py-2">
          <Avatar className="size-9">
            {user.image ? <AvatarImage src={user.image} alt={label} /> : null}
            <AvatarFallback className="bg-secondary text-secondary-foreground text-sm font-semibold">
              {getInitials(user)}
            </AvatarFallback>
          </Avatar>
          <div className="flex min-w-0 flex-col leading-tight">
            <span className="truncate text-sm font-semibold text-foreground">
              {label}
            </span>
            <span className="truncate text-xs text-muted-foreground">
              {user.email || user.role}
            </span>
          </div>
        </div>

        {isAdmin && (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuItem render={<Link href="/dashboard/users" />}>
              <Users className="size-4 text-muted-foreground" /> Users
            </DropdownMenuItem>
            <DropdownMenuItem render={<Link href="/dashboard/settings" />}>
              <Settings className="size-4 text-muted-foreground" /> Settings
            </DropdownMenuItem>
          </>
        )}

        <DropdownMenuSeparator />

        {/* Theme row — plain element so the menu stays open on toggle. */}
        <div className="flex items-center justify-between px-2 py-1.5 text-sm">
          <span className="flex items-center gap-2 text-foreground">
            Theme
            <span className="font-medium">{isDark ? "Dark" : "Light"}</span>
          </span>
          <ThemeToggle className="size-8" />
        </div>

        <DropdownMenuSeparator />

        <DropdownMenuItem
          variant="destructive"
          onClick={() => signOut({ callbackUrl: "/login" })}
        >
          <LogOut className="size-4" /> Sign out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
