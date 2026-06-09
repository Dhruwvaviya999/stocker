import NextAuth from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { PrismaAdapter } from "@auth/prisma-adapter";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import {
  companyLoginSchema,
  superAdminLoginSchema,
} from "@/lib/validators/auth";
import type { UserRole } from "@prisma/client";

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: PrismaAdapter(prisma),
  session: { strategy: "jwt" },
  pages: {
    signIn: "/login",
    error: "/login",
  },
  providers: [
    // ── Company user login ────────────────────────────────────────────────
    CredentialsProvider({
      id: "company-login",
      name: "Company Login",
      credentials: {
        companyId: { label: "Company", type: "text" },
        identifier: { label: "Username or Email", type: "text" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        const parsed = companyLoginSchema.safeParse(credentials);
        if (!parsed.success) throw new Error("Invalid credentials");

        const { companyId, identifier, password } = parsed.data;

        const user = await prisma.user.findFirst({
          where: {
            companyId,
            role: { not: "SUPER_ADMIN" },
            OR: [{ username: identifier }, { email: identifier }],
          },
          include: { company: true },
        });

        if (!user || !user.password) {
          throw new Error("Invalid credentials");
        }

        const valid = await bcrypt.compare(password, user.password);
        if (!valid) throw new Error("Invalid credentials");

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          username: user.username,
          image: user.image,
          role: user.role,
          companyId: user.companyId,
        };
      },
    }),

    // ── Super Admin login ─────────────────────────────────────────────────
    CredentialsProvider({
      id: "super-admin-login",
      name: "Super Admin Login",
      credentials: {
        identifier: { label: "Username or Email", type: "text" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        const parsed = superAdminLoginSchema.safeParse(credentials);
        if (!parsed.success) throw new Error("Invalid credentials");

        const { identifier, password } = parsed.data;

        const user = await prisma.user.findFirst({
          where: {
            companyId: null,
            role: "SUPER_ADMIN",
            OR: [{ username: identifier }, { email: identifier }],
          },
        });

        if (!user || !user.password) {
          throw new Error("Invalid credentials");
        }

        const valid = await bcrypt.compare(password, user.password);
        if (!valid) throw new Error("Invalid credentials");

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          username: user.username,
          image: user.image,
          role: user.role,
          companyId: null,
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = (user as any).role as UserRole;
        token.companyId = (user as any).companyId as string | null;
        token.username = (user as any).username as string | null;
      }
      return token;
    },
    async session({ session, token }) {
      if (token && session.user) {
        session.user.id = token.id as string;
        session.user.role = token.role as UserRole;
        session.user.companyId = token.companyId as string | null;
        session.user.username = token.username as string | null;
      }
      return session;
    },
  },
});