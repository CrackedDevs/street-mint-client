import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Unplug, Wallet } from "lucide-react";
import Image from "next/image";
import { shortenAddress } from "@/lib/shortenAddress";
import { PublicKey } from "@solana/web3.js";
interface WalletConnectionPromptProps {
  isOpen: boolean;
  onClose: () => void;
  connected: boolean;
  publicKey: PublicKey | null;
  disconnect: () => void;
  handleConnect: () => void;
}

export default function WalletConnectionPrompt({
  isOpen,
  onClose,
  connected,
  publicKey,
  disconnect,
  handleConnect,
}: WalletConnectionPromptProps) {
  const wallets = [
    { name: "Phantom", icon: "/phantom.svg" },
    { name: "Solflare", icon: "/solflare.png" },
    { name: "Backpack", icon: "/backpack.svg" },
  ];

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md rounded-xl w-[95%] bg-black">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold text-center pt-6 text-white">
            Connect Wallet for Crypto Payment
          </DialogTitle>
        </DialogHeader>
        <div className="py-6">
          <button
            onClick={
              connected
                ? disconnect
                : () => {
                    handleConnect();
                    onClose();
                  }
            }
            className={`w-full h-10 rounded-full ${
              connected
                ? "bg-gray-200 hover:bg-gray-300 text-gray-800"
                : "bg-white text-black"
            } font-bold py-2 px-4 rounded transition duration-300 ease-in-out flex items-center justify-center`}
          >
            {connected ? (
              <>
                <Unplug className="mr-2 h-5 w-5" />
                Disconnect {publicKey && shortenAddress(publicKey.toString())}
              </>
            ) : (
              <>
                <Wallet className="mr-2 h-5 w-5" />
                Connect wallet
              </>
            )}
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
