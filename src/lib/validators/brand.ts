import { z } from "zod";

// ── Brand create / update (company users) ──────────────────────────────────
// A brand only carries a name; companyId comes from the session, never the
// client. Uniqueness is per-company (@@unique([companyId, name])) and enforced
// at the database level — the API maps that violation to a friendly 409.
export const brandSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, "Brand name is required")
    .max(50, "Brand name is too long"),
});

export type BrandInput = z.infer<typeof brandSchema>;
