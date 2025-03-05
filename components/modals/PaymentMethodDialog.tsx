import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import Image from "next/image";
import { CreditCard, Wallet } from "lucide-react";

interface PaymentMethodDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectPaymentMethod: (method: "crypto" | "card") => void;
  price: number;
  isMinting: boolean;
}

export default function PaymentMethodDialog({
  isOpen,
  onClose,
  onSelectPaymentMethod,
  price,
  isMinting,
}: PaymentMethodDialogProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md rounded-xl w-[95%]">
        <DialogHeader>
          <DialogTitle className="text-3xl font-bold text-center pt-6 text-black">
            Choose Payment Method
          </DialogTitle>
          <DialogDescription className="text-center text-gray-600">
            Select how you&apos;d like to pay ${price}
          </DialogDescription>
        </DialogHeader>
        <div className="py-6">
          <div className="grid gap-4">
            <Button
              variant="outline"
              disabled={isMinting}
              className="bg-white flex items-center justify-start gap-3 px-3 py-8 rounded-lg hover:bg-gray-50 border-gray-200 text-black transition-colors"
              onClick={() => {
                onSelectPaymentMethod("crypto");
                onClose();
              }}
            >
              <Wallet className="h-8 w-8" />
              <div className="flex flex-col items-start">
                <span className="font-medium text-lg">Pay with Crypto</span>
                <span className="text-sm text-gray-500">
                  Connect your wallet and pay with SOL
                </span>
              </div>
            </Button>

            <Button
              variant="outline"
              disabled={isMinting}
              className="bg-white flex items-center justify-start gap-3 px-3 py-8 rounded-lg hover:bg-gray-50 border-gray-200 text-black transition-colors"
              onClick={() => {
                onSelectPaymentMethod("card");
                onClose();
              }}
            >
              <CreditCard className="h-8 w-8" />
              <div className="flex flex-col items-start">
                <span className="font-medium text-lg">Pay with Card</span>
                <span className="text-sm text-gray-500">
                  Securely pay using credit or debit card
                </span>
              </div>
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
