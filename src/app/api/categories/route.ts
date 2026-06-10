import { NextRequest } from "next/server";
import { Prisma } from "@prisma/client";

import { prisma } from "@/lib/prisma";
import { requireCompanyUser, requireRole, AuthError } from "@/lib/session";
import { categorySchema } from "@/lib/validators/category";
import {
  apiSuccess,
  apiCreated,
  apiError,
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

// ── List categories for the current company (any company role) ─────────────
// Optional ?search= filters by name (case-insensitive). Always scoped to the
// session's companyId so a company only ever sees its own categories.
export async function GET(req: NextRequest) {
  try {
    const user = await requireCompanyUser();
    const search = req.nextUrl.searchParams.get("search")?.trim();

    const categories = await prisma.category.findMany({
      where: {
        companyId: user.companyId,
        ...(search ? { name: { contains: search, mode: "insensitive" } } : {}),
      },
      select: CATEGORY_SELECT,
      orderBy: { name: "asc" },
    });

    return apiSuccess(categories);
  } catch (error) {
    if (error instanceof AuthError) return apiError(error.message, error.statusCode);
    return apiCatch(error);
  }
}

// ── Create a category (ADMIN / MANAGER) ────────────────────────────────────
export async function POST(req: NextRequest) {
  try {
    const user = await requireRole("ADMIN", "MANAGER");

    const body = await req.json();
    const parsed = categorySchema.safeParse(body);
    if (!parsed.success) return apiValidationError(parsed.error);

    const category = await prisma.category.create({
      data: { name: parsed.data.name, companyId: user.companyId },
      select: CATEGORY_SELECT,
    });

    return apiCreated(category);
  } catch (error) {
    if (error instanceof AuthError) return apiError(error.message, error.statusCode);
    // Unique [companyId, name] violation → this company already has the category.
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002"
    ) {
      return apiError("A category with this name already exists", 409);
    }
    return apiCatch(error);
  }
}
