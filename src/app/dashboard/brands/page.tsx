import { TriangleAlert } from "lucide-react";

import { getCurrentUser } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { BrandsManager } from "@/components/brands/brands-manager";
import type { Brand } from "@/components/brands/brand-table";

export const metadata = { title: "Brands" };

const MANAGE_ROLES = ["ADMIN", "MANAGER"] as const;

export default async function BrandsPage() {
  // The dashboard layout guarantees an authenticated company user; we read the
  // session here to scope the query to THIS company only (never company code).
  const user = await getCurrentUser();

  if (!user?.companyId) {
    return (
      <div className="mx-auto max-w-5xl">
        <Alert variant="destructive">
          <TriangleAlert />
          <AlertTitle>No company associated</AlertTitle>
          <AlertDescription>
            Your account isn&apos;t linked to a company, so there are no brands to
            manage.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  const rows = await prisma.brand.findMany({
    where: { companyId: user.companyId },
    select: { id: true, name: true, _count: { select: { products: true } } },
    orderBy: { name: "asc" },
  });

  const initialBrands: Brand[] = rows.map((b) => ({
    id: b.id,
    name: b.name,
    productCount: b._count.products,
  }));

  const canManage = (MANAGE_ROLES as readonly string[]).includes(user.role);

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <div className="space-y-1">
        <h1 className="text-2xl font-semibold tracking-tight">Brands</h1>
        <p className="text-sm text-muted-foreground">
          Manage the footwear brands your company stocks.
        </p>
      </div>

      <BrandsManager initialBrands={initialBrands} canManage={canManage} />
    </div>
  );
}
