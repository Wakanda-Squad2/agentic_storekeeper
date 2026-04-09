"use client";

import { useEffect, useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  patchTransactionViaBridge,
  type LedgerTransactionRow,
} from "@/lib/api/transactions.service";
import { isApiError } from "@/lib/api/errors";
import { useToastStore } from "@/stores/toast-store";
import { cn } from "@/lib/utils";

const selectClass = cn(
  "h-8 w-full min-w-0 rounded-lg border border-input bg-transparent px-2.5 py-1 text-sm transition-colors outline-none",
  "focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50",
  "disabled:pointer-events-none disabled:opacity-50 dark:bg-input/30",
);

type Props = {
  row: LedgerTransactionRow | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  currencyCode: string;
  onSaved: () => void;
};

export function TransactionEditModal({
  row,
  open,
  onOpenChange,
  currencyCode,
  onSaved,
}: Props) {
  const [date, setDate] = useState("");
  const [description, setDescription] = useState("");
  const [amountStr, setAmountStr] = useState("");
  const [type, setType] = useState<"income" | "expense">("expense");
  const [category, setCategory] = useState("");
  const [vendor, setVendor] = useState("");
  const [currency, setCurrency] = useState(currencyCode);
  const [formError, setFormError] = useState<string | null>(null);
  const pushErrorToast = useToastStore((s) => s.pushError);

  useEffect(() => {
    if (!row || !open) return;
    setDate(row.postedAt.slice(0, 10));
    setDescription(row.description);
    setAmountStr(String(row.amount));
    setType(row.direction);
    setCategory(row.category === "—" ? "" : row.category);
    setVendor(row.vendor === "—" ? "" : row.vendor);
    setCurrency(currencyCode);
    setFormError(null);
  }, [row, open, currencyCode]);

  const save = useMutation({
    mutationFn: () => {
      if (!row) throw new Error("No row");
      const amount = Number(amountStr);
      if (!Number.isFinite(amount) || amount < 0) {
        throw new Error("Enter a valid non-negative amount.");
      }
      return patchTransactionViaBridge(row.id, {
        // date: date || null,
        description: description.trim() || null,
        amount,
        currency: currency.trim() || null,
        type,
        category: category.trim() || null,
        vendor: vendor.trim() || null,
      });
    },
    onSuccess: () => {
      onSaved();
      onOpenChange(false);
    },
    onError: (e) => {
      const msg = isApiError(e)
        ? e.message
        : e instanceof Error
          ? e.message
          : "Save failed";
      setFormError(msg);
      pushErrorToast("Could not update transaction", msg);
    },
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="gap-0 p-0 sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Edit transaction</DialogTitle>
          <DialogDescription>
            Updates{" "}
            <code className="rounded bg-muted px-1">PATCH /api/v1/transactions/{"{id}"}</code> via
            the bridge. Id:{" "}
            <span className="font-mono text-foreground">{row?.id}</span>
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="h-[min(55vh,420px)] max-h-[min(55vh,420px)] px-4">
          <div className="grid gap-4 py-2 pe-2 pb-4">
            <div className="space-y-2">
              <Label htmlFor="tx-date">Date</Label>
              <Input
                id="tx-date"
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="tx-desc">Description</Label>
              <Input
                id="tx-desc"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="tx-type">Type</Label>
              <select
                id="tx-type"
                className={selectClass}
                value={type}
                onChange={(e) =>
                  setType(e.target.value === "income" ? "income" : "expense")
                }
              >
                <option value="expense">Expense</option>
                <option value="income">Income</option>
              </select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="tx-amount">Amount</Label>
              <Input
                id="tx-amount"
                type="number"
                min={0}
                step="0.01"
                value={amountStr}
                onChange={(e) => setAmountStr(e.target.value)}
              />
              <p className="text-muted-foreground text-xs">
                Positive number; type above sets income vs expense.
              </p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="tx-currency">Currency</Label>
              <Input
                id="tx-currency"
                value={currency}
                onChange={(e) => setCurrency(e.target.value)}
                maxLength={8}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="tx-cat">Category</Label>
              <Input
                id="tx-cat"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="tx-vendor">Vendor</Label>
              <Input
                id="tx-vendor"
                value={vendor}
                onChange={(e) => setVendor(e.target.value)}
              />
            </div>
            {formError ? (
              <p className="text-destructive text-sm" role="alert">
                {formError}
              </p>
            ) : null}
          </div>
        </ScrollArea>

        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            type="button"
            disabled={save.isPending || !row}
            onClick={() => {
              setFormError(null);
              save.mutate();
            }}
          >
            {save.isPending && <Loader2 className="me-2 size-4 animate-spin" />}
            Save changes
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
