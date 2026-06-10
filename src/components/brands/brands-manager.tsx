"use client";

import { useMemo, useState } from "react";
import { Info, Plus, Tag } from "lucide-react";
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
import { BrandSearch } from "./brand-search";
import { BrandForm } from "./brand-form";
import { BrandTable, type Brand } from "./brand-table";

interface ApiError {
  message?: string;
}

const byName = (a: Brand, b: Brand) =>
  a.name.localeCompare(b.name, undefined, { sensitivity: "base" });

export function BrandsManager({
  initialBrands,
  canManage,
}: {
  initialBrands: Brand[];
  canManage: boolean;
}) {
  const [brands, setBrands] = useState<Brand[]>(initialBrands);
  const [search, setSearch] = useState("");

  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Brand | null>(null);

  const [deleteTarget, setDeleteTarget] = useState<Brand | null>(null);
  const [deleting, setDeleting] = useState(false);

  // Small list → filter locally for instant search (the API also supports it).
  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    const list = q
      ? brands.filter((b) => b.name.toLowerCase().includes(q))
      : brands;
    return [...list].sort(byName);
  }, [brands, search]);

  function openCreate() {
    setEditing(null);
    setFormOpen(true);
  }

  function openEdit(brand: Brand) {
    setEditing(brand);
    setFormOpen(true);
  }

  // Insert or replace the saved brand, keeping the list sorted.
  function handleSaved(saved: Brand) {
    setBrands((prev) => {
      const exists = prev.some((b) => b.id === saved.id);
      const next = exists
        ? prev.map((b) => (b.id === saved.id ? saved : b))
        : [...prev, saved];
      return next.sort(byName);
    });
  }

  async function confirmDelete() {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await axiosInstance.delete(`/brands/${deleteTarget.id}`);
      setBrands((prev) => prev.filter((b) => b.id !== deleteTarget.id));
      toast.success("Brand deleted");
      setDeleteTarget(null);
    } catch (err) {
      toast.error((err as ApiError).message ?? "Could not delete the brand.");
    } finally {
      setDeleting(false);
    }
  }

  const hasBrands = brands.length > 0;

  return (
    <div className="space-y-4">
      {!canManage && (
        <Alert>
          <Info />
          <AlertDescription>
            You have view-only access to brands. Contact an administrator to make
            changes.
          </AlertDescription>
        </Alert>
      )}

      {/* Toolbar */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <BrandSearch value={search} onChange={setSearch} />
        {canManage && (
          <Button onClick={openCreate} className="sm:w-auto">
            <Plus className="size-4" />
            Add brand
          </Button>
        )}
      </div>

      {/* Content */}
      {!hasBrands ? (
        <Empty className="rounded-lg border border-dashed">
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <Tag />
            </EmptyMedia>
            <EmptyTitle>No brands yet</EmptyTitle>
            <EmptyDescription>
              {canManage
                ? "Add your first footwear brand to get started."
                : "No brands have been added for your company yet."}
            </EmptyDescription>
          </EmptyHeader>
          {canManage && (
            <EmptyContent>
              <Button onClick={openCreate}>
                <Plus className="size-4" />
                Add brand
              </Button>
            </EmptyContent>
          )}
        </Empty>
      ) : filtered.length === 0 ? (
        <div className="rounded-lg border border-dashed p-10 text-center text-sm text-muted-foreground">
          No brands match “{search}”.
        </div>
      ) : (
        <BrandTable
          brands={filtered}
          canManage={canManage}
          onEdit={openEdit}
          onDelete={setDeleteTarget}
        />
      )}

      {/* Create / edit dialog */}
      {canManage && (
        <BrandForm
          open={formOpen}
          onOpenChange={setFormOpen}
          brand={editing}
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
            <AlertDialogTitle>Delete brand?</AlertDialogTitle>
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
