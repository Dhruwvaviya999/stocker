"use client";

import { Pencil, Trash2 } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export interface Brand {
  id: string;
  name: string;
  productCount: number;
}

/**
 * Presentational brand table. All state and mutations live in the parent
 * manager; this component just renders rows and surfaces edit/delete intents.
 */
export function BrandTable({
  brands,
  canManage,
  onEdit,
  onDelete,
}: {
  brands: Brand[];
  canManage: boolean;
  onEdit: (brand: Brand) => void;
  onDelete: (brand: Brand) => void;
}) {
  return (
    <div className="overflow-hidden rounded-lg border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Brand</TableHead>
            <TableHead className="text-center">Products</TableHead>
            {canManage && (
              <TableHead className="w-[1%] text-right whitespace-nowrap">
                Actions
              </TableHead>
            )}
          </TableRow>
        </TableHeader>
        <TableBody>
          {brands.map((brand) => (
            <TableRow key={brand.id}>
              <TableCell className="font-medium">{brand.name}</TableCell>
              <TableCell className="text-center">
                <Badge variant="secondary">{brand.productCount}</Badge>
              </TableCell>
              {canManage && (
                <TableCell className="text-right">
                  <div className="flex justify-end gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="size-8 text-muted-foreground hover:text-foreground"
                      aria-label={`Edit ${brand.name}`}
                      onClick={() => onEdit(brand)}
                    >
                      <Pencil className="size-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="size-8 text-muted-foreground hover:text-destructive"
                      aria-label={`Delete ${brand.name}`}
                      onClick={() => onDelete(brand)}
                    >
                      <Trash2 className="size-4" />
                    </Button>
                  </div>
                </TableCell>
              )}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
