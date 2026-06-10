"use client";

import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";

import { brandSchema, type BrandInput } from "@/lib/validators/brand";
import axiosInstance from "@/lib/axios";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Spinner } from "@/components/ui/spinner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Field, FieldError, FieldLabel } from "@/components/ui/field";
import type { Brand } from "./brand-table";

interface ApiError {
  status?: number;
  message?: string;
  data?: { errors?: Record<string, string[]> } | null;
}

/**
 * Create/edit brand dialog. `brand` null → create, otherwise edit. On success
 * it hands the saved brand back to the parent via `onSaved`.
 */
export function BrandForm({
  open,
  onOpenChange,
  brand,
  onSaved,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  brand: Brand | null;
  onSaved: (brand: Brand) => void;
}) {
  const isEdit = !!brand;

  const {
    register,
    handleSubmit,
    reset,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<BrandInput>({
    resolver: zodResolver(brandSchema),
    defaultValues: { name: "" },
  });

  // Re-seed the field whenever the dialog opens for a different brand.
  useEffect(() => {
    if (open) reset({ name: brand?.name ?? "" });
  }, [open, brand, reset]);

  async function onSubmit(values: BrandInput) {
    try {
      const res = isEdit
        ? await axiosInstance.patch<{ data: BrandApi }>(
            `/brands/${brand!.id}`,
            values,
          )
        : await axiosInstance.post<{ data: BrandApi }>("/brands", values);

      onSaved(toBrand(res.data.data));
      toast.success(isEdit ? "Brand updated" : "Brand created");
      onOpenChange(false);
    } catch (err) {
      const error = err as ApiError;
      const fieldErrors = error.data?.errors;
      if (fieldErrors?.name?.[0]) {
        setError("name", { message: fieldErrors.name[0] });
        return;
      }
      toast.error(error.message ?? "Could not save the brand.");
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <form onSubmit={handleSubmit(onSubmit)} noValidate>
          <DialogHeader>
            <DialogTitle>{isEdit ? "Edit brand" : "Add brand"}</DialogTitle>
            <DialogDescription>
              {isEdit
                ? "Rename this brand for your company."
                : "Add a footwear brand, e.g. Nike, Adidas or Crocs."}
            </DialogDescription>
          </DialogHeader>

          <div className="py-4">
            <Field data-invalid={!!errors.name}>
              <FieldLabel htmlFor="brand-name">Brand name</FieldLabel>
              <Input
                id="brand-name"
                placeholder="Nike"
                autoFocus
                disabled={isSubmitting}
                aria-invalid={!!errors.name}
                {...register("name")}
              />
              <FieldError errors={errors.name ? [errors.name] : undefined} />
            </Field>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              disabled={isSubmitting}
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting && <Spinner />}
              {isEdit ? "Save changes" : "Add brand"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

// API returns the brand with a nested _count; the table works with a flat shape.
interface BrandApi {
  id: string;
  name: string;
  _count?: { products: number };
}

function toBrand(b: BrandApi): Brand {
  return { id: b.id, name: b.name, productCount: b._count?.products ?? 0 };
}
