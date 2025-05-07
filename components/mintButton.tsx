"use client";
declare global {
  interface Window {
    phantom: any;
    solflare: any;
    backpack: any;
  }
}

import { useWallet } from "@solana/wallet-adapter-react";
import { WalletMultiButton } from "@solana/wallet-adapter-react-ui";
import { useEffect, useState } from "react";
import { toast } from "@/hooks/use-toast";
import {
  PublicKey,
  SystemProgram,
  LAMPORTS_PER_SOL,
  TransactionMessage,
  VersionedTransaction,
  Connection,
  ComputeBudgetProgram,
} from "@solana/web3.js";

import WhiteBgShimmerButton from "./magicui/whiteBg-shimmer-button";
import {
  checkMintEligibility,
  checkMintEligibilityForLightVersion,
  Collectible,
  Collection,
  getExistingLightOrder,
  getExistingOrder,
  updateOrderAirdropStatus,
} from "@/lib/supabaseClient";
import { Input } from "./ui/input";
import confetti from "canvas-confetti";
import LocationButton from "./LocationButton";
import { SolanaFMService } from "@/lib/services/solanaExplorerService";
import Link from "next/link";
import { useVisitorData } from "@fingerprintjs/fingerprintjs-pro-react";
import { v4 as uuidv4 } from "uuid";
import { shortenAddress } from "@/lib/shortenAddress";
import ShowAirdropModal from "./modals/ShowAirdropModal";
import ShowDonationModal from "./modals/ShowDonationModal";
import { Unplug } from "lucide-react";
import { Wallet } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "./ui/dialog";
import Image from "next/image";
import CheckInboxModal from "./modals/ShowMailSentModal";
import { getSupabaseAdmin, recordPaidChipTap } from "@/lib/supabaseAdminClient";
import { getSolPrice } from "@/lib/services/getSolPrice";
import { MintStatus } from "./EditionInformation-Old";
import WaitlistModal from "./modals/PromotionalModal";
import { Button } from "./ui/button";
import { CtaPopUp } from "./CtaPopUp";
import SuccessPopup from "./modals/SuccessPopup";
import PaymentMethodDialog from "./modals/PaymentMethodDialog";
import { useSearchParams } from "next/navigation";
import { PaymentStatusModal } from "./modals/PaymentStatusModal";
import { PaymentCancelledModal } from "./modals/PaymentCancelledModal";
import CardPaymentEmailDialog from "./modals/CardPaymentEmailDialog";
import WalletConnectionPrompt from "./modals/WalletConnectionPrompt";

interface MintButtonProps {
  collectible: Collectible;
  collection: Collection;
  artistWalletAddress: string;
  isIRLtapped: boolean;
  mintStatus: MintStatus;
  x: string;
  n: string;
  e: string;
  adminSignatureCode: string;
  adminSignatureAuthenticated: boolean;
}

const wallets = [
  { name: "Phantom", icon: "/phantom.svg" },
  { name: "Solflare", icon: "/solflare.png" },
  { name: "Backpack", icon: "/backpack.svg" },
];

export default function MintButton({
  collectible,
  collection,
  artistWalletAddress,
  isIRLtapped,
  mintStatus,
  x,
  n,
  e,
  adminSignatureCode,
  adminSignatureAuthenticated,
}: MintButtonProps) {
  const searchParams = useSearchParams();
  const success = searchParams.get("success");
  const session_id = searchParams.get("session_id");
  const canceled = searchParams.get("canceled");
  const orderId = searchParams.get("orderId");
  const {
    connected,
    connect,
    publicKey,
    signTransaction,
    select,
    connecting,
    disconnect,
  } = useWallet();
  const [isMinting, setIsMinting] = useState(false);
  const [isEligible, setIsEligible] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [transactionSignature, setTransactionSignature] = useState<
    string | null
  >(null);
  const [deviceId, setDeviceId] = useState<string | null>(null);
  const [existingOrder, setExistingOrder] = useState<any | null>(null);
  const isFreeMint = collectible.price_usd === 0;
  const ctaEnabled = collectible.cta_enable;
  const isCardPaymentEnable = collectible.enable_card_payments || false;
  const [showCtaPopUp, setShowCtaPopUp] = useState(false);
  const [walletAddress, setWalletAddress] = useState("");
  const [showDonationModal, setShowDonationModal] = useState(false);
  const [showAirdropModal, setShowAirdropModal] = useState(false);
  const [isAirdropEligible, setIsAirdropEligible] = useState(false);
  const [tipLinkUrl, setTipLinkUrl] = useState<string | null>(null);
  const [showMailSentModal, setShowMailSentModal] = useState(false);
  const connection = new Connection(process.env.NEXT_PUBLIC_RPC_URL!);
  const [showWaitlistModal, setShowWaitlistModal] = useState(false);
  const [showSuccessPopUp, setShowSuccessPopUp] = useState(false);
  const [isLightVersion, setIsLightVersion] = useState(false);
  const [signatureCode, setSignatureCode] = useState<string | null>(null);
  const [showPaymentMethodDialog, setShowPaymentMethodDialog] = useState(false);
  const [showPaymentSuccessDialog, setShowPaymentSuccessDialog] =
    useState(false);
  const [showPaymentCancelledDialog, setShowPaymentCancelledDialog] =
    useState(false);
  const [showCardPaymenEmailtDialog, setShowCardPaymentEmailDialog] =
    useState(false);
  const [cardPaymentAddress, setCardPaymentAddress] = useState(
    publicKey?.toString() || ""
  );
  const [showWalletConnectionPrompt, setShowWalletConnectionPrompt] =
    useState(false);

  const { getData } = useVisitorData(
    { extendedResult: true },
    { immediate: true }
  );

  useEffect(() => {
    if (success == "true") {
      setShowPaymentSuccessDialog(true);
    }
    if (canceled === "true") {
      setShowPaymentCancelledDialog(true);

      if (orderId) {
        fetch("/api/orders/update-status", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            orderId,
            status: "failed",
          }),
        }).catch((error) => {
          console.error("Error updating order status:", error);
        });
      }
    }
  }, [success, canceled, searchParams]);

  const TriggerConfetti = (): void => {
    const end = Date.now() + 3 * 1000; // 3 seconds
    const colors = ["#a786ff", "#fd8bbc", "#eca184", "#f8deb1"];

    const frame = () => {
      if (Date.now() > end) return;

      confetti({
        particleCount: 2,
        angle: 60,
        spread: 55,
        startVelocity: 60,
        origin: { x: 0, y: 0.5 },
        colors: colors,
      });
      confetti({
        particleCount: 2,
        angle: 120,
        spread: 55,
        startVelocity: 60,
        origin: { x: 1, y: 0.5 },
        colors: colors,
      });

      requestAnimationFrame(frame);
    };

    frame();
  };

  async function fetchDeviceId() {
    try {
      const id = await getData({ ignoreCache: true, extendedResult: true });
      if (!id.visitorId) {
        return null;
      }
      console.log("ID in mintButton.tsx:", id.visitorId, id.browserName);
      setDeviceId(id.visitorId);
      return id.visitorId;
    } catch (error) {
      setDeviceId(null);
      return null;
    }
  }

  useEffect(() => {
    const timer = setTimeout(() => {
      if (deviceId === null) {
        toast({
          title: "Warning",
          description:
            "Unable to verify device. Please remove the ad blocker and scan the chip again.",
          variant: "destructive",
        });
      } else {
        clearTimeout(timer);
      }
    }, 4000);

    return () => clearTimeout(timer);
  }, [deviceId]);

  useEffect(() => {
    fetchDeviceId();
    if (collectible.is_light_version) {
      setIsLightVersion(true);
    }
  }, []);

  async function checkEligibilityAndExistingLightOrder() {
    const addressToCheck = walletAddress;
    if (!deviceId) {
      const device = await fetchDeviceId();
      if (device) {
        setDeviceId(device);
      } else {
        return;
      }
    }
    if (transactionSignature) {
      return;
    }
    if (addressToCheck && deviceId) {
      setIsLoading(true);
      try {
        const {
          eligible,
          reason,
          isAirdropEligible: airdropEligible,
        } = await checkMintEligibilityForLightVersion(
          addressToCheck,
          collectible.id,
          deviceId
        );
        setIsEligible(eligible);
        setIsAirdropEligible(airdropEligible || false);
        setIsLoading(false);
        if (!eligible) {
          setError(reason || "You are not eligible to mint this NFT.");
        } else {
          setError(null);
        }

        const order = await getExistingLightOrder(
          addressToCheck,
          collectible.id
        );
        setExistingOrder(order);
        if (order) {
          setTransactionSignature(order.mint_signature);
        }
      } catch (error) {
        console.error(
          "Error checking eligibility or existing light order:",
          error
        );
        setError("Failed to check claiming eligibility.");
        setIsEligible(false);
        setIsLoading(false);
      }
    } else {
      setIsLoading(false);
      setIsEligible(false);
    }
  }

  async function checkEligibilityAndExistingOrder() {
    if (connected) {
      setWalletAddress(publicKey?.toString() || "");
    }
    const addressToCheck = isFreeMint ? walletAddress : publicKey?.toString();
    if (!deviceId) {
      const device = await fetchDeviceId();
      if (device) {
        setDeviceId(device);
      } else {
        return;
      }
    }
    if (transactionSignature) {
      return;
    }
    if (addressToCheck && deviceId) {
      setIsLoading(true);
      try {
        const {
          eligible,
          reason,
          isAirdropEligible: airdropEligible,
        } = await checkMintEligibility(
          addressToCheck,
          collectible.id,
          deviceId
        );
        setIsEligible(eligible);
        setIsAirdropEligible(airdropEligible || false);
        setIsLoading(false);
        if (!eligible) {
          setError(reason || "You are not eligible to mint this NFT.");
        } else {
          setError(null);
        }

        const order = await getExistingOrder(addressToCheck, collectible.id);
        setExistingOrder(order);
        if (order) {
          setTransactionSignature(order.mint_signature);
        }
      } catch (error) {
        console.error("Error checking eligibility or existing order:", error);
        setError("Failed to check minting eligibility.");
        setIsEligible(false);
        setIsLoading(false);
      }
    } else {
      setIsLoading(false);
      setIsEligible(false);
    }
  }

  useEffect(() => {
    if (collectible.is_light_version) {
      console.log("collectible.is_light_version", collectible.is_light_version);
      checkEligibilityAndExistingLightOrder();
    } else {
      checkEligibilityAndExistingOrder();
    }
  }, [
    connected,
    publicKey,
    walletAddress,
    deviceId,
    collectible.id,
    isFreeMint,
  ]);

  useEffect(() => {
    if (connected && publicKey && collectible.price_usd === 0) {
      setWalletAddress(publicKey.toString());
    }
  }, [connected]);

  useEffect(() => {
    // Auto fill the wallet address if the user has previously minted
    const lastMintInput = localStorage.getItem("lastMintInput");
    if (lastMintInput) {
      setWalletAddress(lastMintInput || "");
    }
  }, []);

  const handlePaymentAndMint = async (paymentMethod: "card" | "crypto") => {
    console.log("adddressss", cardPaymentAddress);
    const addressToUse = isFreeMint
      ? walletAddress.trim()
      : paymentMethod === "card" && cardPaymentAddress
      ? cardPaymentAddress.trim()
      : publicKey?.toString();

    const isEmail = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/i.test(
      (addressToUse || "").trim()
    );
    console.log("Payment method:", paymentMethod);
    console.log("isEmail", isEmail);
    console.log("addressToUse", addressToUse);
    console.log("cardPaymentAddress", cardPaymentAddress);

    let newOrderId = null;

    // Skip eligibility check for card payments
    if (
      !addressToUse ||
      (!isEligible && (paymentMethod !== "card" || isFreeMint))
    ) {
      return;
    }

    setIsMinting(true);
    setError(null);
    if (
      collectible.price_usd > 0 &&
      x &&
      n &&
      e &&
      !adminSignatureAuthenticated
    ) {
      const recordSuccess = await recordPaidChipTap(x, n, e);
      if (!recordSuccess) {
        return;
      }
    }
    try {
      let signedTransaction = null;

      const initResponse = await fetch("/api/collection/mint/initiate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          collectibleId: collectible.id,
          walletAddress: addressToUse.trim(),
          deviceId: deviceId,
          collectionId: collection.id,
        }),
      });

      if (!initResponse.ok) {
        const errorData = await initResponse.json();
        throw new Error(errorData.error || "Failed to initiate minting");
      }
      let priceInSol = 0;
      const { orderId, isFree, tipLinkWalletAddress, tipLinkUrl } =
        await initResponse.json();

      newOrderId = orderId;

      setTipLinkUrl(tipLinkUrl);
      if (!isFree) {
        // Step 2: Create payment transaction (only for paid mints)
        if (paymentMethod === "crypto") {
          if (!publicKey || !signTransaction) {
            toast({
              title: "Error",
              description: "Wallet connection required for crypto payment",
              variant: "destructive",
            });
            setIsMinting(false);
            return;
          }

          const solPrice = await getSolPrice();
          if (!solPrice) {
            throw new Error("Failed to get SOL price");
          }
          const solPriceUSD = solPrice;
          priceInSol = collectible.price_usd / solPriceUSD;
          const lamports = Math.round(priceInSol * LAMPORTS_PER_SOL);
          const instructions = [
            ComputeBudgetProgram.setComputeUnitLimit({
              units: 80000,
            }),
            SystemProgram.transfer({
              fromPubkey: publicKey,
              toPubkey: new PublicKey(artistWalletAddress),
              lamports: lamports,
            }),
          ];

          const { blockhash, lastValidBlockHeight } =
            await connection.getLatestBlockhash();
          const messageV0 = new TransactionMessage({
            payerKey: publicKey,
            recentBlockhash: blockhash,
            instructions,
          }).compileToV0Message();

          const transaction = new VersionedTransaction(messageV0);

          // Sign the transaction
          if (!signTransaction) {
            throw new Error("Failed to sign transaction");
          }
          let signedTx;
          // Serialize the signed transaction
          signedTx = await signTransaction(transaction);
          signedTransaction = Buffer.from(signedTx.serialize()).toString(
            "base64"
          );
        } else {
          try {
            const response = await fetch("/api/checkout_sessions", {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
              },
              body: JSON.stringify({
                priceId: collectible.stripe_price_id,
                orderId,
                tipLinkWalletAddress,
                signedTransaction,
                priceInSol,
                isEmail,
                nftImageUrl: collectible.primary_image_url,
                collectibleId: collectible.id,
                chipTapData: {
                  x,
                  n,
                  e,
                },
                isCardPayment: true,
              }),
            });

            if (!response.ok) {
              const errorData = await response.json();
              throw new Error(
                errorData.error || "Failed to create checkout session"
              );
            }

            const { url } = await response.json();

            // Redirect to Stripe Checkout using window.location
            if (url) {
              window.location.href = url;
              return;
            } else {
              throw new Error("No checkout URL received");
            }
          } catch (error) {
            console.error("Error creating checkout session:", error);
            toast({
              title: "Error",
              description: "Failed to initialize payment",
              variant: "destructive",
            });
            setIsMinting(false);
            return;
          }
        }
      }

      const chipTapData = {
        x: x || "",
        n: n || "",
        e: e || "",
      };

      const processResponse = await fetch("/api/collection/mint/process", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          orderId,
          tipLinkWalletAddress,
          signedTransaction,
          priceInSol,
          isEmail,
          nftImageUrl: collectible.primary_image_url,
          collectibleId: collectible.id,
          chipTapData: chipTapData,
          adminSignatureCode,
          adminSignatureAuthenticated,
          isCardPayment: false,
        }),
      });

      if (!processResponse.ok) {
        const errorData = await processResponse.json();
        throw new Error(errorData.error || "Failed to process minting");
      }

      const { success, mintSignature } = await processResponse.json();
      if (success) {
        setTransactionSignature(mintSignature);
        TriggerConfetti();
        setExistingOrder({ id: orderId, status: "completed" });
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
        if (isAirdropEligible) {
          setShowAirdropModal(true);
          updateOrderAirdropStatus(orderId, true);
        }
        localStorage.setItem("lastMintInput", addressToUse);
        setWalletAddress("");
      } else {
        throw new Error("Minting process failed");
      }
      if (ctaEnabled) {
        setTimeout(() => {
          setShowSuccessPopUp(false);
          setShowMailSentModal(false);
          setShowCtaPopUp(true);
        }, 5000);
      }
    } catch (error: any) {
      console.error("Error minting NFT:", error);
      toast({
        title: "Something went wrong while minting your collectible ",
        description:
          error.message ||
          "An unexpected error occurred. Please try again later.",
        variant: "destructive",
      });
      // Set the order status as failed
      if (newOrderId) {
        try {
          const response = await fetch("/api/orders/update-status", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              orderId: newOrderId,
              status: "failed",
            }),
          });

          if (!response.ok) {
            console.error("Failed to update order status");
          }
        } catch (updateError) {
          console.error("Error updating order status:", updateError);
        }
      }
      setError("An unexpected error occurred");
    } finally {
      setIsMinting(false);
    }
  };

  const handleLightVersionClaim = async () => {
    const addressToUse = walletAddress;
    const isEmail = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/i.test(
      (addressToUse || "").trim()
    );
    if (!isEmail) {
      toast({
        title: "Error",
        description: "Please enter a valid email address",
        variant: "destructive",
      });
      return;
    }
    console.log("isEmail", isEmail);
    console.log("addressToUse", addressToUse);

    let newOrderId = null;

    if (!addressToUse || !isEligible) {
      return;
    }
    setIsMinting(true);
    setError(null);

    try {
      const initResponse = await fetch("/api/collection/mint/initiate-light", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          collectibleId: collectible.id,
          emailAddress: addressToUse,
          deviceId: deviceId,
          collectionId: collection.id,
        }),
      });

      if (!initResponse.ok) {
        const errorData = await initResponse.json();
        throw new Error(errorData.error || "Failed to initiate claiming");
      }
      const { success, signatureCode, orderId } = await initResponse.json();

      newOrderId = orderId;

      if (success) {
        setSignatureCode(signatureCode);
        TriggerConfetti();
        setExistingOrder({ id: orderId, status: "pending" });
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
        if (isAirdropEligible) {
          setShowAirdropModal(true);
          updateOrderAirdropStatus(orderId, true);
        }
        localStorage.setItem("lastMintInput", addressToUse);
        setWalletAddress("");
      } else {
        throw new Error("Minting process failed");
      }
    } catch (error: any) {
      console.error("Error minting NFT:", error);
      toast({
        title: "Something went wrong while minting your collectible ",
        description:
          error.message ||
          "An unexpected error occurred. Please try again later.",
        variant: "destructive",
      });
      // Set the order status as failed
      if (newOrderId) {
        try {
          const response = await fetch("/api/orders/update-status", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              orderId: newOrderId,
              status: "failed",
            }),
          });

          if (!response.ok) {
            console.error("Failed to update order status");
          }
        } catch (updateError) {
          console.error("Error updating order status:", updateError);
        }
      }
      setError("An unexpected error occurred");
    } finally {
      setIsMinting(false);
    }
  };

  const handleMintClick = async (paymentMethod: "card" | "crypto") => {
    setIsMinting(true);
    await checkEligibilityAndExistingOrder();

    if (isFreeMint) {
      if (!walletAddress) {
        toast({
          title: "Error",
          description: "Please enter a valid wallet address",
          variant: "destructive",
        });
        setIsMinting(false);
        return;
      }
    } else if (paymentMethod === "crypto" && !connected) {
      // For crypto payments, we need a connected wallet
      // Show the wallet connection prompt
      setShowWalletConnectionPrompt(true);
      setIsMinting(false);
      return;
    } else if (paymentMethod === "card") {
      if (!cardPaymentAddress && !showCardPaymenEmailtDialog) {
        setShowCardPaymentEmailDialog(true);
        setIsMinting(false);
        return;
      }
    }

    if (!deviceId) {
      toast({
        title: "Error",
        description: "Unable to get device ID",
        variant: "destructive",
      });
      setIsMinting(false);
      return;
    }

    // Skip eligibility check for card payments
    if (!isEligible && (paymentMethod !== "card" || isFreeMint)) {
      toast({
        title: "Error",
        description: "You are not eligible to mint this NFT",
        variant: "destructive",
      });
      setIsMinting(false);
      return;
    }

    await handlePaymentAndMint(paymentMethod);

    setIsMinting(false);
  };

  const getButtonText = () => {
    if (isFreeMint && !walletAddress) return "COLLECT NOW";
    if (connecting) return "CONNECTING...";
    if (isMinting) return "PROCESSING...";
    if (isLoading) return "Checking Eligibility...";
    // For card payments, always show MINT NOW even if not eligible
    // if (!isEligible && isCardPaymentEnable && !isFreeMint) return "MINT NOW";
    if (!isEligible) return "NOT ELIGIBLE";
    if (isLightVersion) return "COLLECT";
    if (isEligible) return "COLLECT";
    return "LOADING...";
  };

  const handleConnect = () => {
    const button = document.querySelector(
      ".wallet-adapter-button"
    ) as HTMLElement;
    if (button) {
      button.click();
    }
  };

  const handleWalletConnection = (walletName: string) => {
    const userAgent = navigator.userAgent.toLowerCase();
    const isAndroid = /android/.test(userAgent);
    const isIOS = /iphone|ipad|ipod/.test(userAgent);
    const currentUrl = encodeURIComponent(window.location.href);
    const ref = encodeURIComponent(window.location.origin);

    switch (walletName) {
      case "Phantom":
        if (isAndroid || isIOS) {
          window.location.href = `https://phantom.app/ul/browse/${currentUrl}?ref=${ref}`;
        } else {
          throw new Error("Phantom is not supported on desktop");
        }
        break;
      case "Solflare":
        if (isAndroid || isIOS) {
          window.location.href = `https://solflare.com/ul/v1/browse/${currentUrl}?ref=${ref}`;
        } else {
          throw new Error("Solflare is not supported on desktop");
        }
        break;
      case "Backpack":
        if (isAndroid || isIOS) {
          window.location.href = `https://backpack.app/ul/browse/${currentUrl}?ref=${ref}`;
        } else {
          throw new Error("Backpack is not supported on desktop");
        }
        break;
      default:
        console.log(`${walletName} connection not implemented`);
    }
  };

  const renderWalletButton = () => {
    // If card payments are enabled and not a free mint, we don't need to force wallet connection
    if ((isCardPaymentEnable && !isFreeMint) || collectible.only_card_payment) {
      return null;
    }

    const isPhantomInjected = window?.phantom;
    const isSolflareInjected = window?.solflare;
    const isBackpackInjected = window.backpack?.isBackpack;

    const isWalletInjected =
      isPhantomInjected || isSolflareInjected || isBackpackInjected;

    if (isWalletInjected) {
      if (connected && isEligible) {
        return <></>;
      }

      return (
        <button
          onClick={connected ? disconnect : () => handleConnect()}
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
      );
    }

    return (
      <Dialog>
        <DialogTrigger asChild>
          <Button
            variant="outline"
            className="text-black w-full h-12 rounded-full font-bold py-2 px-4 transition duration-300 ease-in-out flex items-center justify-center"
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
          </Button>
        </DialogTrigger>
        <DialogContent className="sm:max-w-md rounded-xl w-[95%]">
          <DialogHeader className="relative">
            <DialogTitle className="text-3xl font-bold text-center pt-6 text-black">
              Connect Wallet
            </DialogTitle>
          </DialogHeader>
          <div className="py-6">
            <p className="text-center text-gray-600 mb-6 text-sm font-medium">
              Choose your preferred wallet to get started
            </p>
            <div className="grid gap-3">
              {wallets.map((wallet) => (
                <Button
                  key={wallet.name}
                  variant="outline"
                  className="bg-white flex items-center justify-start gap-3 px-3 py-6 rounded-lg hover:bg-gray-50 border-gray-200 text-black transition-colors"
                  onClick={() => handleWalletConnection(wallet.name)}
                >
                  <Image
                    src={wallet.icon}
                    alt={`${wallet.name} icon`}
                    width={32}
                    height={32}
                    className="h-8 w-8 relative rounded"
                  />
                  <span className="font-medium">{wallet.name}</span>
                </Button>
              ))}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    );
  };

  const renderMintButton = () => (
    <WhiteBgShimmerButton
      borderRadius="9999px"
      className="w-full my-4 text-black hover:bg-gray-800 h-[44px] rounded font-bold"
      onClick={() => {
        if (isFreeMint || !isCardPaymentEnable) {
          handleMintClick("crypto");
        } else if (collectible.only_card_payment) {
          handleMintClick("card");
        } else {
          setShowPaymentMethodDialog(true);
        }
      }}
      disabled={
        isMinting ||
        (!isEligible && !isCardPaymentEnable) ||
        (!isEligible && isFreeMint) ||
        existingOrder?.status === "completed" ||
        isLoading ||
        !deviceId ||
        (!connected &&
          !isCardPaymentEnable &&
          !isFreeMint &&
          !collectible.only_card_payment)
      }
    >
      {getButtonText()}
    </WhiteBgShimmerButton>
  );

  const renderLightVersionMintButton = () => (
    <WhiteBgShimmerButton
      borderRadius="9999px"
      className="w-full my-4 text-black hover:bg-gray-800 h-[44px] rounded font-bold"
      onClick={handleLightVersionClaim}
      disabled={
        isMinting ||
        !isEligible ||
        existingOrder?.status === "completed" ||
        isLoading ||
        !deviceId
      }
    >
      {getButtonText()}
    </WhiteBgShimmerButton>
  );

  const renderCompletedMint = () => (
    <div className="flex flex-col items-center my-3 w-full">
      <Link
        href={SolanaFMService.getTransaction(
          transactionSignature || existingOrder.mint_address
        )}
        target="_blank"
        className="w-full"
      >
        <WhiteBgShimmerButton
          borderRadius="6px"
          className="w-full mb-4 hover:bg-gray-800 h-[44px] text-black rounded font-bold"
        >
          VIEW TRANSACTION
        </WhiteBgShimmerButton>
      </Link>
      
      {collectible.batch_listing_id && (
        <Link
          href={`/batch/${collectible.batch_listing_id}?search=${walletAddress}`}
          className="w-full"
          target="_blank"
        >
          <WhiteBgShimmerButton
            borderRadius="6px"
            className="w-full mb-4 hover:bg-gray-800 h-[44px] text-black rounded font-bold"
          >
            VIEW LOYALTY CARD
          </WhiteBgShimmerButton>
        </Link>
      )}
    </div>
  );

  const renderCompletedClaim = () => (
    <div className="flex flex-col items-center my-3 w-full">
      <WhiteBgShimmerButton
        borderRadius="6px"
        className="w-full mb-4 hover:bg-gray-800 h-[44px] text-black rounded font-bold"
      >
        ALREADY CLAIMED
      </WhiteBgShimmerButton>
      
      {collectible.batch_listing_id && (
        <Link
          href={`/batch/${collectible.batch_listing_id}`}
          className="w-full"
        >
          <WhiteBgShimmerButton
            borderRadius="6px"
            className="w-full mb-4 hover:bg-gray-800 h-[44px] text-black rounded font-bold"
          >
            VIEW LOYALTY CARD
          </WhiteBgShimmerButton>
        </Link>
      )}
    </div>
  );

  const handlePaymentMethodSelection = (method: "card" | "crypto") => {
    // If only card payments are enabled, always use card payment
    if (collectible.only_card_payment) {
      method = "card";
    }

    if (method === "card") {
      setShowPaymentMethodDialog(false);
      setShowCardPaymentEmailDialog(true);
    } else if (method === "crypto" && !connected) {
      setShowPaymentMethodDialog(false);
      setShowWalletConnectionPrompt(true);
    } else {
      handleMintClick(method);
    }
  };

  const handleConnectWallet = async (walletName: string) => {
    try {
      // Use the existing handleWalletConnection function
      handleWalletConnection(walletName);
      setShowWalletConnectionPrompt(false);
    } catch (error) {
      console.error("Failed to connect wallet:", error);
      toast({
        title: "Error",
        description: `Failed to connect ${walletName}. Please make sure you have the wallet installed and try again.`,
        variant: "destructive",
      });
    }
  };

  const handleSwitchToCard = () => {
    setShowWalletConnectionPrompt(false);
    setShowCardPaymentEmailDialog(true);
  };

  if (!isIRLtapped) {
    if (collectible.location)
      return (
        <>
          <LocationButton location={collectible.location} />
          <PaymentStatusModal
            isOpen={showPaymentSuccessDialog}
            onClose={() => setShowPaymentSuccessDialog(false)}
            sessionId={session_id || ""}
            setTransactionSignature={setTransactionSignature}
            triggerConfetti={TriggerConfetti}
            setExistingOrder={setExistingOrder}
            setIsEligible={setIsEligible}
            setShowAirdropModal={setShowAirdropModal}
            setShowMailSentModal={setShowMailSentModal}
            setShowSuccessPopUp={setShowSuccessPopUp}
            setWalletAddress={setWalletAddress}
            ctaEnabled={ctaEnabled}
            setShowCtaPopUp={setShowCtaPopUp}
            setIsMinting={setIsMinting}
          />
        </>
      );
    else {
      return <div></div>;
    }
  }

  return (
    <div className="flex flex-col w-full justify-center items-center">
      <ShowDonationModal
        showDonationModal={showDonationModal}
        setShowDonationModal={setShowDonationModal}
        artistWalletAddress={artistWalletAddress}
      />
      <ShowAirdropModal
        showAirdropModal={showAirdropModal}
        setShowAirdropModal={setShowAirdropModal}
      />
      <CheckInboxModal
        showModal={showMailSentModal}
        onClose={() => {
          setShowMailSentModal(false);
          setShowCtaPopUp(true);
        }}
      />
      <WaitlistModal
        showModal={showWaitlistModal}
        setShowModal={setShowWaitlistModal}
      />
      <PaymentMethodDialog
        isOpen={showPaymentMethodDialog}
        onClose={() => setShowPaymentMethodDialog(false)}
        onSelectPaymentMethod={handlePaymentMethodSelection}
        price={collectible.price_usd}
        isMinting={isMinting}
        onlyCardPayment={collectible.only_card_payment ?? false}
      />
      <CardPaymentEmailDialog
        isOpen={showCardPaymenEmailtDialog}
        onClose={() => setShowCardPaymentEmailDialog(false)}
        onSelectPaymentMethod={handleMintClick}
        setCardPaymentAddress={setCardPaymentAddress}
        cardPaymentAddress={cardPaymentAddress}
        price={collectible.price_usd}
        isMinting={isMinting}
        onBack={() => {
          setShowCardPaymentEmailDialog(false);
          setShowPaymentMethodDialog(true);
        }}
      />
      <WalletConnectionPrompt
        isOpen={showWalletConnectionPrompt}
        onClose={() => setShowWalletConnectionPrompt(false)}
        connected={connected}
        publicKey={publicKey}
        disconnect={disconnect}
        handleConnect={handleConnect}
      />
      <PaymentStatusModal
        isOpen={showPaymentSuccessDialog}
        onClose={() => setShowPaymentSuccessDialog(false)}
        sessionId={session_id || ""}
        setTransactionSignature={setTransactionSignature}
        triggerConfetti={TriggerConfetti}
        setExistingOrder={setExistingOrder}
        setIsEligible={setIsEligible}
        setShowAirdropModal={setShowAirdropModal}
        setShowMailSentModal={setShowMailSentModal}
        setShowSuccessPopUp={setShowSuccessPopUp}
        setWalletAddress={setWalletAddress}
        ctaEnabled={ctaEnabled}
        setShowCtaPopUp={setShowCtaPopUp}
        setIsMinting={setIsMinting}
      />
      <PaymentCancelledModal
        isOpen={showPaymentCancelledDialog}
        onClose={() => setShowPaymentCancelledDialog(false)}
        onRetry={() => {
          setShowPaymentCancelledDialog(false);
          setShowPaymentMethodDialog(true);
        }}
      />
      {ctaEnabled && showCtaPopUp && (
        <CtaPopUp
          title={collectible.cta_title ?? ""}
          description={collectible.cta_description ?? ""}
          logoUrl={collectible.cta_logo_url ?? ""}
          ctaText={collectible.cta_text ?? ""}
          ctaLink={collectible.cta_link ?? ""}
          hasEmailCapture={collectible.cta_has_email_capture ?? false}
          hasTextCapture={collectible.cta_has_text_capture ?? false}
          isOpen={showCtaPopUp}
          onClose={() => setShowCtaPopUp(false)}
          collectible={collectible}
          publicKey={publicKey?.toString() ?? ""}
          existingOrderId={existingOrder?.id ?? ""}
          isLightVersion={isLightVersion}
        />
      )}
      <SuccessPopup
        isOpen={showSuccessPopUp}
        onClose={() => {
          setShowSuccessPopUp(false);
          setShowCtaPopUp(true);
        }}
      />
      {!isLightVersion &&
        (transactionSignature || existingOrder?.status === "completed") &&
        renderCompletedMint()}
      {isLightVersion && signatureCode && renderCompletedClaim()}
      {mintStatus === "ongoing" &&
        !(transactionSignature || existingOrder?.status === "completed") && (
          <div className="flex flex-col items-center justify-center w-full">
            <div className="flex flex-col items-center justify-center w-full">
              {isLightVersion && !signatureCode && (
                <div className="w-full flex mt-2 gap-4 flex-col items-center justify-center">
                  <Input
                    type="text"
                    placeholder="Enter Email"
                    value={walletAddress}
                    onChange={(e) => setWalletAddress(e.target.value)}
                    className="w-full h-12 px-4 border border-gray-300 rounded-md shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 ease-in-out"
                  />
                  {existingOrder?.status !== "completed" &&
                    walletAddress &&
                    renderLightVersionMintButton()}
                </div>
              )}
              {!isLightVersion &&
                (isFreeMint ? (
                  <div className="w-full flex mt-2 gap-4 flex-col items-center justify-center">
                    <Input
                      type="text"
                      placeholder="Enter Email, Solana Wallet or .SOL Address"
                      value={walletAddress}
                      onChange={(e) => setWalletAddress(e.target.value)}
                      className="w-full h-12 px-4 border border-gray-300 rounded-md shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 ease-in-out"
                    />
                    {existingOrder?.status !== "completed" &&
                      walletAddress &&
                      renderMintButton()}
                  </div>
                ) : (
                  <div className="w-full mt-4 flex flex-col items-center justify-center">
                    {!isCardPaymentEnable && renderWalletButton()}
                    {isCardPaymentEnable &&
                      !connected &&
                      !collectible.only_card_payment && (
                        <div className="mb-4 text-center">
                          <p className="text-center text-sm text-white mb-2 bg-black bg-opacity-50 p-2 rounded-md">
                            You can mint without connecting a wallet using card
                            payment
                          </p>
                        </div>
                      )}
                    {collectible.only_card_payment && (
                      <div className="mb-4 text-center">
                        <p className="text-center text-sm text-white mb-2 bg-black bg-opacity-50 p-2 rounded-md">
                          This collectible can only be purchased with card
                          payment
                        </p>
                      </div>
                    )}
                    <div className="hidden">
                      <WalletMultiButton />
                    </div>
                    {existingOrder?.status !== "completed" &&
                      connected &&
                      renderMintButton()}
                    {isCardPaymentEnable && !connected && renderMintButton()}
                  </div>
                ))}
            </div>

            {error && <p className="text-red-500 mt-2">{error}</p>}
          </div>
        )}
    </div>
  );
}
