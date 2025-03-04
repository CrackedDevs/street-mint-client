import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

import { ArrowLeft, CreditCard, Mail, Wallet } from "lucide-react";

interface CardPaymentDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectPaymentMethod: (paymentMethod: "card" | "crypto") => Promise<void>;
  price: number;
  isMinting: boolean;
  onBack: () => void;
  setCardPaymentAddress: (address: string) => void;
  cardPaymentAddress: string;
}

export default function CardPaymentEmailDialog({
  isOpen,
  onClose,
  onSelectPaymentMethod,
  price,
  isMinting,
  onBack,
  setCardPaymentAddress,
  cardPaymentAddress,
}: CardPaymentDialogProps) {
  const isEmail = cardPaymentAddress?.trim()
    ? /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/i.test(
        cardPaymentAddress.trim()
      )
    : false;
  const isSolDomain = cardPaymentAddress?.trim()
    ? /^[a-zA-Z0-9_-]+\.sol$/i.test(cardPaymentAddress.trim())
    : false;
  const isWalletAddress = cardPaymentAddress?.trim()
    ? /^[1-9A-HJ-NP-Za-km-z]{32,44}$/.test(cardPaymentAddress.trim())
    : false;

  const getAddressType = () => {
    if (!cardPaymentAddress?.trim()) return null;
    if (isEmail) return "email";
    if (isSolDomain) return ".sol domain";
    if (isWalletAddress) return "wallet address";
    return "unknown";
  };

  const addressType = getAddressType();

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md rounded-xl w-[95%]">
        <DialogHeader>
          <Button
            variant="ghost"
            size="icon"
            className="absolute left-4 top-4"
            onClick={onBack}
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <DialogTitle className="text-3xl font-bold text-center pt-6 text-black">
            Pay with Card
          </DialogTitle>
          <DialogDescription className="text-center text-gray-600">
            Enter where you&apos;d like to receive your NFT
          </DialogDescription>
        </DialogHeader>
        <div className="py-6">
          <div className="flex flex-col space-y-2">
            <div className="relative">
              <Input
                type="text"
                placeholder="Enter your Email, Wallet or .SOL address"
                value={cardPaymentAddress}
                onChange={(e) => setCardPaymentAddress(e.target.value)}
                className="w-full h-12 px-4 pl-10 border border-gray-300 rounded-md shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 ease-in-out"
                required
              />
              <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400">
                {addressType === "email" && <Mail className="h-5 w-5" />}
                {(addressType === "wallet address" ||
                  addressType === ".sol domain") && (
                  <Wallet className="h-5 w-5" />
                )}
              </div>
            </div>

            <div className="text-xs space-y-1">
              <p className="text-gray-500">
                We&apos;ll send your NFT to this address after payment is
                complete
              </p>
            </div>
          </div>

          <Button
            onClick={() => {
              onSelectPaymentMethod("card");
              onClose();
            }}
            disabled={isMinting || !cardPaymentAddress?.trim() || !addressType}
            className="w-full h-12 bg-black text-white rounded-md hover:bg-gray-800 transition-colors"
          >
            <CreditCard className="mr-2 h-5 w-5" />
            Pay ${price}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
