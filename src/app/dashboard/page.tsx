import Link from "next/link";
import { ArrowRight } from "lucide-react";

import { getCurrentUser } from "@/lib/session";
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { navGroupsForRole } from "@/lib/navigation";

export default async function DashboardPage() {
  // The layout guarantees a user, but we read it here for the greeting + role.
  const user = await getCurrentUser();
  const label = user?.name || user?.username || "there";

  // Quick links to every module the role can access (skip the dashboard root).
  const modules = user
    ? navGroupsForRole(user.role)
        .flatMap((g) => g.items)
        .filter((i) => i.href !== "/dashboard")
    : [];

  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <h1 className="text-2xl font-semibold tracking-tight">
          Welcome, {label}
        </h1>
        <p className="text-sm text-muted-foreground">
          You&apos;re signed in to your company workspace. Pick a module to get
          started.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {modules.map(({ href, label: title, icon: Icon }) => (
          <Link key={href} href={href} className="group">
            <Card className="h-full transition-colors group-hover:border-foreground/20 group-hover:bg-accent/40">
              <CardHeader>
                <div className="flex items-start justify-between gap-3">
                  <span className="flex size-10 items-center justify-center rounded-lg bg-muted text-foreground">
                    <Icon className="size-5" />
                  </span>
                  <ArrowRight className="size-4 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100" />
                </div>
                <CardTitle className="pt-2 text-base">{title}</CardTitle>
                <CardDescription>
                  Coming soon — this module will be built in a later step.
                </CardDescription>
              </CardHeader>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
