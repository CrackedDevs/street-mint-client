"use client";

import { verifyOrder } from "@/actions/stripe-actions";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import { CheckCircle, Loader2, X } from "lucide-react";
import { useEffect, useState } from "react";

interface SuccessPaymentDialogProps {
  isOpen: boolean;
  onClose: () => void;
  sessionId: string;
}

export function PaymentStatusModal({
  isOpen,
  onClose,
  sessionId,
}: SuccessPaymentDialogProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [isSuccess, setIsSuccess] = useState(false);
  const [isError, setIsError] = useState(false);

  const confirmOrder = async () => {
    verifyOrder(sessionId).then((order) => {
      if (order?.status === "complete") {
        setIsSuccess(true);
        setIsLoading(false);
      } else if (order?.status === "expired") {
        setIsLoading(false);
        setIsError(true);
      }
    });
  };
  useEffect(() => {
    confirmOrder();
    setInterval(() => {
      confirmOrder();
    }, 5000);
  }, [sessionId]);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="bg-gray-900 border-gray-800 [&_.close-button]:outline-red-500">
        <DialogHeader>
          <div className="mx-auto rounded-full bg-green-500/20 p-3 mb-4">
            {isLoading ? (
              <Loader2 className="h-12 w-12 text-green-500 animate-spin" />
            ) : isError ? (
              <X className="h-12 w-12 text-red-500" />
            ) : (
              <CheckCircle className="h-12 w-12 text-green-500" />
            )}
          </div>
          <DialogTitle className="text-white text-center text-2xl">
            {isLoading
              ? "Processing Payment..."
              : isError
              ? "Payment Failed"
              : "Payment Successful!"}
          </DialogTitle>
          <DialogDescription className="text-gray-400 text-center">
            {isLoading
              ? "Your payment is being processed. Please wait..."
              : isError
              ? "Your payment failed. Please try again."
              : "Your payment has been processed successfully."}
          </DialogDescription>
        </DialogHeader>
      </DialogContent>
    </Dialog>
  );
}
