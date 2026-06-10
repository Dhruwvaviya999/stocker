"use client";

import { useMemo, useState } from "react";
import { Info, Plus, Layers } from "lucide-react";
import { toast } from "sonner";

import axiosInstance from "@/lib/axios";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Spinner } from "@/components/ui/spinner";
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { CategorySearch } from "./category-search";
import { CategoryForm } from "./category-form";
import { CategoryTable, type Category } from "./category-table";

interface ApiError {
  message?: string;
}

const byName = (a: Category, b: Category) =>
  a.name.localeCompare(b.name, undefined, { sensitivity: "base" });

export function CategoriesManager({
  initialCategories,
  canManage,
}: {
  initialCategories: Category[];
  canManage: boolean;
}) {
  const [categories, setCategories] = useState<Category[]>(initialCategories);
  const [search, setSearch] = useState("");

  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Category | null>(null);

  const [deleteTarget, setDeleteTarget] = useState<Category | null>(null);
  const [deleting, setDeleting] = useState(false);

  // Small list → filter locally for instant search (the API also supports it).
  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    const list = q
      ? categories.filter((c) => c.name.toLowerCase().includes(q))
      : categories;
    return [...list].sort(byName);
  }, [categories, search]);

  function openCreate() {
    setEditing(null);
    setFormOpen(true);
  }

  function openEdit(category: Category) {
    setEditing(category);
    setFormOpen(true);
  }

  // Insert or replace the saved category, keeping the list sorted.
  function handleSaved(saved: Category) {
    setCategories((prev) => {
      const exists = prev.some((c) => c.id === saved.id);
      const next = exists
        ? prev.map((c) => (c.id === saved.id ? saved : c))
        : [...prev, saved];
      return next.sort(byName);
    });
  }

  async function confirmDelete() {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await axiosInstance.delete(`/categories/${deleteTarget.id}`);
      setCategories((prev) => prev.filter((c) => c.id !== deleteTarget.id));
      toast.success("Category deleted");
      setDeleteTarget(null);
    } catch (err) {
      toast.error((err as ApiError).message ?? "Could not delete the category.");
    } finally {
      setDeleting(false);
    }
  }

  const hasCategories = categories.length > 0;

  return (
    <div className="space-y-4">
      {!canManage && (
        <Alert>
          <Info />
          <AlertDescription>
            You have view-only access to categories. Contact an administrator to
            make changes.
          </AlertDescription>
        </Alert>
      )}

      {/* Toolbar */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <CategorySearch value={search} onChange={setSearch} />
        {canManage && (
          <Button onClick={openCreate} className="sm:w-auto">
            <Plus className="size-4" />
            Add category
          </Button>
        )}
      </div>

      {/* Content */}
      {!hasCategories ? (
        <Empty className="rounded-lg border border-dashed">
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <Layers />
            </EmptyMedia>
            <EmptyTitle>No categories yet</EmptyTitle>
            <EmptyDescription>
              {canManage
                ? "Add your first footwear category to get started."
                : "No categories have been added for your company yet."}
            </EmptyDescription>
          </EmptyHeader>
          {canManage && (
            <EmptyContent>
              <Button onClick={openCreate}>
                <Plus className="size-4" />
                Add category
              </Button>
            </EmptyContent>
          )}
        </Empty>
      ) : filtered.length === 0 ? (
        <div className="rounded-lg border border-dashed p-10 text-center text-sm text-muted-foreground">
          No categories match “{search}”.
        </div>
      ) : (
        <CategoryTable
          categories={filtered}
          canManage={canManage}
          onEdit={openEdit}
          onDelete={setDeleteTarget}
        />
      )}

      {/* Create / edit dialog */}
      {canManage && (
        <CategoryForm
          open={formOpen}
          onOpenChange={setFormOpen}
          category={editing}
          onSaved={handleSaved}
        />
      )}

      {/* Delete confirmation */}
      <AlertDialog
        open={!!deleteTarget}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete category?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete{" "}
              <span className="font-medium text-foreground">
                {deleteTarget?.name}
              </span>
              . This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              variant="destructive"
              disabled={deleting}
              onClick={confirmDelete}
            >
              {deleting && <Spinner />}
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
