import type { UserRole, StockLocation, PurchaseOrderStatus, SalesOrderStatus, InventoryMovementType } from "@prisma/client";

// ── Re-export Prisma enums for convenience ────────────────────────────────
export type { UserRole, StockLocation, PurchaseOrderStatus, SalesOrderStatus, InventoryMovementType };

// ── API wrapper types ──────────────────────────────────────────────────────
export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  message?: string;
  errors?: Record<string, string[]>;
}

// ── Pagination ─────────────────────────────────────────────────────────────
export interface PaginationMeta {
  page: number;
  pageSize: number;  
  total: number;
  totalPages: number;
}

export interface PaginatedResponse<T> {
  items: T[];
  meta: PaginationMeta;
}

// ── Common query params ────────────────────────────────────────────────────
export interface ListQueryParams {
  page?: number;
  pageSize?: number;
  search?: string;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
}

// ── Session user (mirrors next-auth.d.ts) ─────────────────────────────────
export interface SessionUser {
  id: string;
  name?: string | null;
  email?: string | null;
  image?: string | null;
  role: UserRole;
  companyId: string | null;
}

// ── Sidebar nav ────────────────────────────────────────────────────────────
export interface NavItem {
  title: string;
  href: string;
  icon?: string;
  badge?: number;
  children?: NavItem[];
  roles?: UserRole[]; // hide from certain roles
}