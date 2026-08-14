"use client";

import { useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { toast } from "sonner";
import { api } from "@/convex/_generated/api";
import { Doc } from "@/convex/_generated/dataModel";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/shared/empty-state";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { LoanProductForm } from "@/components/loan-products/loan-product-form";
import { Layers, Plus, Pencil } from "lucide-react";

export function LoanProductsPageClient() {
  const products = useQuery(api.loanProducts.queries.list);
  const setActive = useMutation(api.loanProducts.mutations.setActive);

  const [dialogState, setDialogState] = useState<
    { mode: "create" } | { mode: "edit"; product: Doc<"loanProducts"> } | null
  >(null);

  async function handleToggleActive(product: Doc<"loanProducts">) {
    try {
      await setActive({ productId: product._id, isActive: !product.isActive });
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Could not update product"
      );
    }
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-heading text-2xl font-bold tracking-tight">
            Loan products
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Configure the loan types members can apply for.
          </p>
        </div>
        <Button onClick={() => setDialogState({ mode: "create" })}>
          <Plus className="size-4" />
          New product
        </Button>
      </div>

      <div className="mt-6">
        {products === undefined ? (
          <div className="space-y-2">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-14 w-full rounded-lg" />
            ))}
          </div>
        ) : products.length === 0 ? (
          <EmptyState
            icon={Layers}
            title="No loan products yet"
            description="Create your first loan product to let members start applying."
            action={
              <Button onClick={() => setDialogState({ mode: "create" })}>
                <Plus className="size-4" />
                New product
              </Button>
            }
          />
        ) : (
          <div className="overflow-x-auto rounded-xl border border-border">
            <Table>
              <TableHeader>
                <TableRow className="[&>th]:bg-muted/50">
                  <TableHead>Name</TableHead>
                  <TableHead>Code</TableHead>
                  <TableHead>Rate</TableHead>
                  <TableHead>Method</TableHead>
                  <TableHead>Amount range</TableHead>
                  <TableHead>Term range</TableHead>
                  <TableHead>Guarantors</TableHead>
                  <TableHead>Active</TableHead>
                  <TableHead />
                </TableRow>
              </TableHeader>
              <TableBody>
                {products.map((p, i) => (
                  <TableRow
                    key={p._id}
                    className={i % 2 === 1 ? "bg-muted/20" : undefined}
                  >
                    <TableCell className="font-medium">{p.name}</TableCell>
                    <TableCell className="font-mono text-xs">{p.code}</TableCell>
                    <TableCell>{p.interestRate}% p.a.</TableCell>
                    <TableCell className="capitalize">
                      {p.interestMethod.replace("_", " ")}
                    </TableCell>
                    <TableCell className="font-mono text-xs">
                      {p.minimumAmount.toLocaleString()} –{" "}
                      {p.maximumAmount.toLocaleString()}
                    </TableCell>
                    <TableCell className="font-mono text-xs">
                      {String(p.minimumTermMonths)}–{String(p.maximumTermMonths)} mo
                    </TableCell>
                    <TableCell>{String(p.requiredGuarantors)}</TableCell>
                    <TableCell>
                      <Switch
                        checked={p.isActive}
                        onCheckedChange={() => handleToggleActive(p)}
                      />
                    </TableCell>
                    <TableCell>
                      <Button
                        size="icon-sm"
                        variant="ghost"
                        onClick={() => setDialogState({ mode: "edit", product: p })}
                      >
                        <Pencil className="size-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </div>

      <Dialog
        open={dialogState !== null}
        onOpenChange={(open) => !open && setDialogState(null)}
      >
        <DialogContent className="max-h-[90vh] w-full max-w-2xl overflow-y-auto sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {dialogState?.mode === "edit" ? "Edit loan product" : "New loan product"}
            </DialogTitle>
            <DialogDescription>
              These terms apply to every new application for this product.
            </DialogDescription>
          </DialogHeader>
          <LoanProductForm
            product={dialogState?.mode === "edit" ? dialogState.product : undefined}
            onSuccess={() => setDialogState(null)}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}
