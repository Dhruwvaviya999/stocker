"use client";

import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";

import { categorySchema, type CategoryInput } from "@/lib/validators/category";
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
import type { Category } from "./category-table";

interface ApiError {
  status?: number;
  message?: string;
  data?: { errors?: Record<string, string[]> } | null;
}

/**
 * Create/edit category dialog. `category` null → create, otherwise edit. On
 * success it hands the saved category back to the parent via `onSaved`.
 */
export function CategoryForm({
  open,
  onOpenChange,
  category,
  onSaved,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  category: Category | null;
  onSaved: (category: Category) => void;
}) {
  const isEdit = !!category;

  const {
    register,
    handleSubmit,
    reset,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<CategoryInput>({
    resolver: zodResolver(categorySchema),
    defaultValues: { name: "" },
  });

  // Re-seed the field whenever the dialog opens for a different category.
  useEffect(() => {
    if (open) reset({ name: category?.name ?? "" });
  }, [open, category, reset]);

  async function onSubmit(values: CategoryInput) {
    try {
      const res = isEdit
        ? await axiosInstance.patch<{ data: CategoryApi }>(
            `/categories/${category!.id}`,
            values,
          )
        : await axiosInstance.post<{ data: CategoryApi }>("/categories", values);

      onSaved(toCategory(res.data.data));
      toast.success(isEdit ? "Category updated" : "Category created");
      onOpenChange(false);
    } catch (err) {
      const error = err as ApiError;
      const fieldErrors = error.data?.errors;
      if (fieldErrors?.name?.[0]) {
        setError("name", { message: fieldErrors.name[0] });
        return;
      }
      toast.error(error.message ?? "Could not save the category.");
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <form onSubmit={handleSubmit(onSubmit)} noValidate>
          <DialogHeader>
            <DialogTitle>{isEdit ? "Edit category" : "Add category"}</DialogTitle>
            <DialogDescription>
              {isEdit
                ? "Rename this category for your company."
                : "Add a footwear category, e.g. Sandals, Sports Shoes or Slippers."}
            </DialogDescription>
          </DialogHeader>

          <div className="py-4">
            <Field data-invalid={!!errors.name}>
              <FieldLabel htmlFor="category-name">Category name</FieldLabel>
              <Input
                id="category-name"
                placeholder="Sports Shoes"
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
              {isEdit ? "Save changes" : "Add category"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

// API returns the category with a nested _count; the table works with a flat shape.
interface CategoryApi {
  id: string;
  name: string;
  _count?: { products: number };
}

function toCategory(c: CategoryApi): Category {
  return { id: c.id, name: c.name, productCount: c._count?.products ?? 0 };
}
