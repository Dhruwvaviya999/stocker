import { z } from "zod";

// ── Category create / update (company users) ───────────────────────────────
// A category only carries a name; companyId comes from the session, never the
// client. Uniqueness is per-company (@@unique([companyId, name])) and enforced
// at the database level — the API maps that violation to a friendly 409.
export const categorySchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, "Category name is required")
    .max(50, "Category name is too long"),
});

export type CategoryInput = z.infer<typeof categorySchema>;
