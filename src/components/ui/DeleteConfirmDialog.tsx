"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { AlertTriangle } from "lucide-react";

interface DeleteConfirmDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description: string;
  onConfirm: () => void;
  loading?: boolean;
}

export function DeleteConfirmDialog({
  open,
  onOpenChange,
  title,
  description,
  onConfirm,
  loading = false,
}: DeleteConfirmDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[380px] bg-[#111118] border-white/[0.06] text-white">
        <DialogHeader>
          <div className="mx-auto w-12 h-12 rounded-full bg-red-500/10 flex items-center justify-center mb-3">
            <AlertTriangle className="w-6 h-6 text-red-400" />
          </div>
          <DialogTitle className="font-display font-bold text-base text-white text-center">
            {title}
          </DialogTitle>
          <DialogDescription className="text-white/50 text-xs text-center mt-1">
            {description}
          </DialogDescription>
        </DialogHeader>

        <div className="pt-4 border-t border-white/[0.06] flex gap-3">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            className="flex-1 border-white/[0.08] text-white/70 hover:bg-white/[0.03]"
            disabled={loading}
          >
            Cancel
          </Button>
          <button
            onClick={() => {
              onConfirm();
              onOpenChange(false);
            }}
            disabled={loading}
            className="flex-1 px-4 py-2 rounded-lg bg-red-500/15 text-red-400 text-sm font-semibold hover:bg-red-500/25 border border-red-500/20 transition-all disabled:opacity-40"
          >
            {loading ? "Deleting..." : "Delete"}
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
