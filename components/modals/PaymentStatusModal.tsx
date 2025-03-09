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
import { toast } from "@/hooks/use-toast";
import { getOrderById } from "@/lib/supabaseAdminClient";
import { checkMintEligibility, updateOrderAirdropStatus } from "@/lib/supabaseClient";
import { CheckCircle, Loader2, X } from "lucide-react";
import { useEffect, useState } from "react";

interface SuccessPaymentDialogProps {
  isOpen: boolean;
  onClose: () => void;
  sessionId: string;
  setTransactionSignature: (signature: string) => void;
  triggerConfetti: () => void;
  setExistingOrder: (order: any | null) => void;
  setIsEligible: (eligible: boolean) => void;
  setShowAirdropModal: (show: boolean) => void;
  setShowMailSentModal: (show: boolean) => void;
  setShowSuccessPopUp: (show: boolean) => void;
  setWalletAddress: (address: string) => void;
  ctaEnabled: boolean;
  setShowCtaPopUp: (show: boolean) => void;
  setIsMinting: (minting: boolean) => void;
}

export function PaymentStatusModal({
  isOpen,
  onClose,
  sessionId,
  setTransactionSignature,
  triggerConfetti,
  setExistingOrder,
  setIsEligible,
  setShowAirdropModal,
  setShowMailSentModal,
  setShowSuccessPopUp,
  setWalletAddress,
  ctaEnabled,
  setShowCtaPopUp,
  setIsMinting,
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

  const afterSuccessProcedure = async () => {
    const order = await getOrderById(sessionId);
    setExistingOrder({ id: order?.id, status: "completed" });
    setTransactionSignature(order?.mint_signature!);
    triggerConfetti();
    const isEmail = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/i.test(
      (order?.wallet_address || "").trim()
    );
    toast({
      title: isEmail
        ? "💌 Please check your inbox, your Collectible awaits you!"
        : "✅ Collectible Minted Successfully",
    });
    if (isEmail) {
      setShowMailSentModal(true);
    } else {
      setShowSuccessPopUp(true);
    }
    setIsEligible(false);
    const {
      eligible,
      reason,
      isAirdropEligible: airdropEligible,
    } = await checkMintEligibility(
      order?.wallet_address!,
      order?.collectible_id!,
      order?.device_id!
    );
    if (airdropEligible) {
      setShowAirdropModal(true);
      updateOrderAirdropStatus(order?.id!, true);
    }
    localStorage.setItem("lastMintInput", order?.wallet_address!);
    setWalletAddress("");

    if (ctaEnabled) {
      setTimeout(() => {
        setShowSuccessPopUp(false);
        setShowMailSentModal(false);
        setShowCtaPopUp(true);
      }, 5000);
    }
    setIsMinting(false);
  };

  useEffect(() => {
    if (isSuccess) {
      setTimeout(() => {
        onClose();
        afterSuccessProcedure();
      }, 800);
    }
  }, [isSuccess]);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="bg-gray-900 border-gray-800 [&>button]:text-white [&>button]:hover:text-white/70 [&>button]:border-0 [&>button]:ring-0">
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
