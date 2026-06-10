import { TriangleAlert } from "lucide-react";

import { getCurrentUser } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { CategoriesManager } from "@/components/categories/categories-manager";
import type { Category } from "@/components/categories/category-table";

export const metadata = { title: "Categories" };

const MANAGE_ROLES = ["ADMIN", "MANAGER"] as const;

export default async function CategoriesPage() {
  // The dashboard layout guarantees an authenticated company user; we read the
  // session here to scope the query to THIS company only (never company code).
  const user = await getCurrentUser();

  if (!user?.companyId) {
    return (
      <div className="mx-auto max-w-6xl">
        <Alert variant="destructive">
          <TriangleAlert />
          <AlertTitle>No company associated</AlertTitle>
          <AlertDescription>
            Your account isn&apos;t linked to a company, so there are no
            categories to manage.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  const rows = await prisma.category.findMany({
    where: { companyId: user.companyId },
    select: { id: true, name: true, _count: { select: { products: true } } },
    orderBy: { name: "asc" },
  });

  const initialCategories: Category[] = rows.map((c) => ({
    id: c.id,
    name: c.name,
    productCount: c._count.products,
  }));

  const canManage = (MANAGE_ROLES as readonly string[]).includes(user.role);

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <div className="space-y-1">
        <h1 className="text-2xl font-semibold tracking-tight">Categories</h1>
        <p className="text-sm text-muted-foreground">
          Manage the footwear categories your company stocks.
        </p>
      </div>

      <CategoriesManager
        initialCategories={initialCategories}
        canManage={canManage}
      />
    </div>
  );
}
