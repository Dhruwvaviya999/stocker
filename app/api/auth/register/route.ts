import { NextRequest } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { registerSchema } from "@/lib/validators/auth";
import {
  apiCreated,
  apiCatch,
  apiValidationError,
  apiError,
} from "@/lib/api-response";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    const parsed = registerSchema.safeParse(body);
    if (!parsed.success) return apiValidationError(parsed.error);

    const { companyName, name, email, password } = parsed.data;

    // Check if email already exists
    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      return apiError("An account with this email already exists", 409);
    }

    const hashedPassword = await bcrypt.hash(password, 12);

    // Create company + SUPER_ADMIN in a transaction
    const result = await prisma.$transaction(async (tx) => {
      const company = await tx.company.create({
        data: { name: companyName },
      });

      const user = await tx.user.create({
        data: {
          name,
          email,
          password: hashedPassword,
          role: "SUPER_ADMIN",
          companyId: company.id,
        },
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          companyId: true,
        },
      });

      return { company, user };
    });

    return apiCreated({
      user: result.user,
      company: { id: result.company.id, name: result.company.name },
    });
  } catch (error) {
    return apiCatch(error);
  }
}
