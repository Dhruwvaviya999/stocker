import { NextRequest } from "next/server";
import { Prisma } from "@prisma/client";

import { prisma } from "@/lib/prisma";
import { requireRole, AuthError } from "@/lib/session";
import { categorySchema } from "@/lib/validators/category";
import {
  apiSuccess,
  apiError,
  apiNotFound,
  apiValidationError,
  apiCatch,
} from "@/lib/api-response";

const CATEGORY_SELECT = {
  id: true,
  name: true,
  createdAt: true,
  updatedAt: true,
  _count: { select: { products: true } },
} as const;

// ── Update a category (ADMIN / MANAGER) ────────────────────────────────────
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const user = await requireRole("ADMIN", "MANAGER");

    const body = await req.json();
    const parsed = categorySchema.safeParse(body);
    if (!parsed.success) return apiValidationError(parsed.error);

    // Guard ownership first so a wrong/foreign id returns 404, not a leak.
    const existing = await prisma.category.findFirst({
      where: { id, companyId: user.companyId },
      select: { id: true },
    });
    if (!existing) return apiNotFound("Category not found");

    const category = await prisma.category.update({
      where: { id },
      data: { name: parsed.data.name },
      select: CATEGORY_SELECT,
    });

    return apiSuccess(category);
  } catch (error) {
    if (error instanceof AuthError) return apiError(error.message, error.statusCode);
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002"
    ) {
      return apiError("A category with this name already exists", 409);
    }
    return apiCatch(error);
  }
}

// ── Delete a category (ADMIN / MANAGER) ────────────────────────────────────
export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const user = await requireRole("ADMIN", "MANAGER");

    const existing = await prisma.category.findFirst({
      where: { id, companyId: user.companyId },
      select: { id: true, _count: { select: { products: true } } },
    });
    if (!existing) return apiNotFound("Category not found");

    // Don't orphan products that still reference this category.
    if (existing._count.products > 0) {
      return apiError(
        "This category is used by one or more products and can't be deleted.",
        409,
      );
    }

    await prisma.category.delete({ where: { id } });

    return apiSuccess({ id });
  } catch (error) {
    if (error instanceof AuthError) return apiError(error.message, error.statusCode);
    return apiCatch(error);
  }
}
