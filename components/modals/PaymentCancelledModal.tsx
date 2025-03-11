"use client";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { X } from "lucide-react";

interface PaymentCancelledDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onRetry: () => void;
}

export function PaymentCancelledModal({
  isOpen,
  onClose,
  onRetry,
}: PaymentCancelledDialogProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="bg-gray-900 border-gray-800 [&_.close-button]:outline-red-500">
        <DialogHeader>
          <div className="mx-auto rounded-full bg-red-500/20 p-3 mb-4">
            <X className="h-12 w-12 text-red-500" />
          </div>
          <DialogTitle className="text-white text-center text-2xl">
            Payment Cancelled
          </DialogTitle>
          <DialogDescription className="text-gray-400 text-center">
            Your payment was cancelled. Would you like to try again?
          </DialogDescription>
        </DialogHeader>
        <div className="flex justify-center gap-4 mt-4">
          <Button
            variant="outline"
            className="bg-transparent text-white border-gray-700 hover:bg-gray-800"
            onClick={onClose}
          >
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
