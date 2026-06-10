import { NextRequest } from "next/server";
import { Prisma } from "@prisma/client";

import { prisma } from "@/lib/prisma";
import { requireCompanyUser, requireRole, AuthError } from "@/lib/session";
import { brandSchema } from "@/lib/validators/brand";
import {
  apiSuccess,
  apiCreated,
  apiError,
  apiValidationError,
  apiCatch,
} from "@/lib/api-response";

const BRAND_SELECT = {
  id: true,
  name: true,
  createdAt: true,
  updatedAt: true,
  _count: { select: { products: true } },
} as const;

// ── List brands for the current company (any company role) ─────────────────
// Optional ?search= filters by name (case-insensitive). Always scoped to the
// session's companyId so a company only ever sees its own brands.
export async function GET(req: NextRequest) {
  try {
    const user = await requireCompanyUser();
    const search = req.nextUrl.searchParams.get("search")?.trim();

    const brands = await prisma.brand.findMany({
      where: {
        companyId: user.companyId,
        ...(search ? { name: { contains: search, mode: "insensitive" } } : {}),
      },
      select: BRAND_SELECT,
      orderBy: { name: "asc" },
    });

    return apiSuccess(brands);
  } catch (error) {
    if (error instanceof AuthError) return apiError(error.message, error.statusCode);
    return apiCatch(error);
  }
}

// ── Create a brand (ADMIN / MANAGER) ───────────────────────────────────────
export async function POST(req: NextRequest) {
  try {
    const user = await requireRole("ADMIN", "MANAGER");

    const body = await req.json();
    const parsed = brandSchema.safeParse(body);
    if (!parsed.success) return apiValidationError(parsed.error);

    const brand = await prisma.brand.create({
      data: { name: parsed.data.name, companyId: user.companyId },
      select: BRAND_SELECT,
    });

    return apiCreated(brand);
  } catch (error) {
    if (error instanceof AuthError) return apiError(error.message, error.statusCode);
    // Unique [companyId, name] violation → this company already has the brand.
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002"
    ) {
      return apiError("A brand with this name already exists", 409);
    }
    return apiCatch(error);
  }
}
