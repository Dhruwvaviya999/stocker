import { Prisma } from "@prisma/client";
import bcrypt from "bcryptjs";

import { prisma } from "@/lib/prisma";
import {
  createUserSchema,
  updateUserSchema,
  type CreateUserInput,
  type UpdateUserInput,
} from "@/lib/validators/user";

// Business-rule failures (not-found, last-admin, self-action, email taken, …).
export class UserError extends Error {
  constructor(
    message: string,
    public statusCode = 400,
  ) {
    super(message);
    this.name = "UserError";
  }
}

const USER_SELECT = {
  id: true,
  name: true,
  username: true,
  email: true,
  role: true,
  isActive: true,
  createdAt: true,
} as const;

type UserRecord = Prisma.UserGetPayload<{ select: typeof USER_SELECT }>;

export function mapUser(u: UserRecord) {
  return {
    id: u.id,
    name: u.name,
    username: u.username,
    email: u.email,
    role: u.role,
    isActive: u.isActive,
    createdAt: u.createdAt.toISOString(),
  };
}

export type UserDTO = ReturnType<typeof mapUser>;

// ── Helpers ────────────────────────────────────────────────────────────────

// Usernames are unique only *within* a company (@@unique([companyId, username])).
async function assertUsernameFree(companyId: string, username: string) {
  const existing = await prisma.user.findFirst({
    where: { companyId, username },
    select: { id: true },
  });
  if (existing) {
    throw new UserError("That username is already taken", 409);
  }
}

// Email is globally unique; make sure it isn't already used by someone else.
async function assertEmailFree(email: string, excludeUserId?: string) {
  const existing = await prisma.user.findUnique({
    where: { email },
    select: { id: true },
  });
  if (existing && existing.id !== excludeUserId) {
    throw new UserError("That email is already in use", 409);
  }
}

// Guard against locking the company out: at least one active ADMIN must remain.
async function assertNotLastActiveAdmin(companyId: string, targetUserId: string) {
  const others = await prisma.user.count({
    where: { companyId, role: "ADMIN", isActive: true, id: { not: targetUserId } },
  });
  if (others === 0) {
    throw new UserError(
      "This is the last active admin — assign another admin first.",
      409,
    );
  }
}

// ── Queries ────────────────────────────────────────────────────────────────
export async function listUsers(companyId: string): Promise<UserDTO[]> {
  const users = await prisma.user.findMany({
    where: { companyId, role: { not: "SUPER_ADMIN" } },
    select: USER_SELECT,
    orderBy: [{ isActive: "desc" }, { createdAt: "asc" }],
  });
  return users.map(mapUser);
}

// ── Create ───────────────────────────────────────────────────────────────--
export async function createUser(args: {
  companyId: string;
  input: CreateUserInput;
}): Promise<UserDTO> {
  const parsed = createUserSchema.safeParse(args.input);
  if (!parsed.success) {
    throw new UserError(parsed.error.issues[0]?.message ?? "Invalid data", 422);
  }
  const data = parsed.data;
  const { companyId } = args;

  await assertUsernameFree(companyId, data.username);

  const email = data.email?.trim() || null;
  if (email) await assertEmailFree(email);

  const passwordHash = await bcrypt.hash(data.password, 12);

  const user = await prisma.user.create({
    data: {
      companyId,
      name: data.name,
      email,
      username: data.username,
      password: passwordHash,
      role: data.role,
      isActive: data.isActive,
    },
    select: USER_SELECT,
  });

  return mapUser(user);
}

// ── Update ───────────────────────────────────────────────────────────────--
export async function updateUser(args: {
  companyId: string;
  actingUserId: string;
  id: string;
  input: UpdateUserInput;
}): Promise<UserDTO> {
  const parsed = updateUserSchema.safeParse(args.input);
  if (!parsed.success) {
    throw new UserError(parsed.error.issues[0]?.message ?? "Invalid data", 422);
  }
  const data = parsed.data;
  const { companyId, actingUserId, id } = args;

  const target = await prisma.user.findFirst({
    where: { id, companyId, role: { not: "SUPER_ADMIN" } },
    select: { id: true, role: true, isActive: true },
  });
  if (!target) throw new UserError("User not found", 404);

  const isSelf = id === actingUserId;
  const losingAdmin =
    target.role === "ADMIN" &&
    target.isActive &&
    (data.role !== "ADMIN" || !data.isActive);

  if (isSelf && !data.isActive) {
    throw new UserError("You can't deactivate your own account", 409);
  }
  // Demoting/deactivating an admin must leave another active admin behind.
  if (losingAdmin) await assertNotLastActiveAdmin(companyId, id);

  const email = data.email?.trim() || null;
  if (email) await assertEmailFree(email, id);

  const user = await prisma.user.update({
    where: { id },
    data: {
      name: data.name,
      email,
      role: data.role,
      isActive: data.isActive,
      // Only touch the password when a new one was supplied.
      ...(data.password ? { password: await bcrypt.hash(data.password, 12) } : {}),
    },
    select: USER_SELECT,
  });

  return mapUser(user);
}

// ── Delete ───────────────────────────────────────────────────────────────--
export async function deleteUser(args: {
  companyId: string;
  actingUserId: string;
  id: string;
}): Promise<{ id: string }> {
  const { companyId, actingUserId, id } = args;

  if (id === actingUserId) {
    throw new UserError("You can't delete your own account", 409);
  }

  const target = await prisma.user.findFirst({
    where: { id, companyId, role: { not: "SUPER_ADMIN" } },
    select: { id: true, role: true, isActive: true },
  });
  if (!target) throw new UserError("User not found", 404);

  if (target.role === "ADMIN" && target.isActive) {
    await assertNotLastActiveAdmin(companyId, id);
  }

  // History (created POs/sales/transfers/movements) uses onDelete: SetNull, so
  // those records are preserved with a null creator.
  await prisma.user.delete({ where: { id } });
  return { id };
}
