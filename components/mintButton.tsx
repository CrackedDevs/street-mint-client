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
  Collectible,
  Collection,
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

interface MintButtonProps {
  collectible: Collectible;
  collection: Collection;
  artistWalletAddress: string;
  isIRLtapped: boolean;
  mintStatus: MintStatus;
  x: string;
  n: string;
  e: string;
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
}: MintButtonProps) {
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
  const [deviceId, setDeviceId] = useState("");
  const [existingOrder, setExistingOrder] = useState<any | null>(null);
  const isFreeMint = collectible.price_usd === 0;
  const ctaEnabled = collectible.cta_enable;
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

  const { getData } = useVisitorData(
    { extendedResult: true },
    { immediate: true }
  );

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
    let deviceId = localStorage.getItem("BrowserID");
    console.log("Device ID in mintButton.tsx:", deviceId);
    try {
      if (!deviceId) {
        const id = await getData({ ignoreCache: true, extendedResult: true });
        console.log("ID in mintButton.tsx:", id.visitorId, id.browserName);
        setDeviceId(id.visitorId);
        // Store the new device ID
        if (id.browserName == "Mobile Safari") {
          localStorage.setItem("BrowserID", `${id.visitorId}-${uuidv4()}`);
        } else {
          localStorage.setItem("BrowserID", id.visitorId);
        }
      } else {
        setDeviceId(deviceId);
      }
      return deviceId!;
    } catch (error) {
      console.error("Error fetching or setting device ID:", error);
      const newDeviceID = uuidv4();
      localStorage.setItem("BrowserID", newDeviceID);
      setDeviceId(newDeviceID);
      return newDeviceID;
    }
  }
  useEffect(() => {
    fetchDeviceId();
  }, []);

  async function checkEligibilityAndExistingOrder() {
    if (connected) {
      setWalletAddress(publicKey?.toString() || "");
    }
    const addressToCheck = isFreeMint ? walletAddress : publicKey?.toString();
    if (!deviceId) {
      const device = await fetchDeviceId();
      setDeviceId(device);
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
      setExistingOrder(null);
    }
  }

  useEffect(() => {
    checkEligibilityAndExistingOrder();
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
    //Auto fill the wallet address if the user has previously minted
    const lastMintInput = localStorage.getItem("lastMintInput");
    if (lastMintInput) {
      setWalletAddress(lastMintInput || "");
    }
  }, []);

  const handlePaymentAndMint = async () => {
    const addressToUse = isFreeMint ? walletAddress : publicKey?.toString();
    const isEmail = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/i.test(
      (addressToUse || "").trim()
    );
    console.log("isEmail", isEmail);
    console.log("addressToUse", addressToUse);

    let newOrderId = null;

    if (!addressToUse || !isEligible) {
      return;
    }
    setIsMinting(true);
    setError(null);
    if (collectible.price_usd > 0 && x && n && e) {
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
          walletAddress: addressToUse,
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
      if (!isFree && publicKey) {
        // Step 2: Create payment transaction (only for paid mints)
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
      }

      const chipTapData = {
        x,
        n,
        e
      }

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
          chipTapData: chipTapData
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

  const handleMintClick = async () => {
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
    } else if (!connected) {
      try {
        await connect();
        setIsMinting(false);
        return;
      } catch (error) {
        console.error("Failed to connect wallet:", error);
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

    if (!isEligible) {
      toast({
        title: "Error",
        description: "You are not eligible to mint this NFT",
        variant: "destructive",
      });
      setIsMinting(false);
      return;
    }
    await handlePaymentAndMint();
    if (ctaEnabled) {
      setTimeout(() => {
        setShowSuccessPopUp(false);
        setShowCtaPopUp(true);
      }, 5000);
    }
    setIsMinting(false);
  };

  const getButtonText = () => {
    if (isFreeMint && !walletAddress) return "COLLECT NOW";
    if (connecting) return "CONNECTING...";
    if (isMinting) return "PROCESSING...";
    if (isLoading) return "Checking Eligibility...";
    if (!isEligible) return "NOT ELIGIBLE";
    if (isEligible) return "MINT NOW";
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
      className="w-full my-4 text-black hover:bg-gray-800 h-[40px] rounded font-bold"
      onClick={handleMintClick}
      disabled={
        isMinting ||
        !isEligible ||
        existingOrder?.status === "completed" ||
        isLoading
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
          className="w-full mb-4 hover:bg-gray-800 h-[45px] text-black rounded font-bold"
        >
          VIEW TRANSACTION
        </WhiteBgShimmerButton>
      </Link>
    </div>
  );

  if (!isIRLtapped) {
    if (collectible.location)
      return <LocationButton location={collectible.location} />;
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
        setShowModal={setShowMailSentModal}
      />
      <WaitlistModal
        showModal={showWaitlistModal}
        setShowModal={setShowWaitlistModal}
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
        />
      )}
      <SuccessPopup
        isOpen={showSuccessPopUp}
        onClose={() => {
          setShowSuccessPopUp(false);
          setShowCtaPopUp(true);
        }}
      />
      {(transactionSignature || existingOrder?.status === "completed") &&
        renderCompletedMint()}
      {mintStatus === "ongoing" && (
        <div className="flex flex-col items-center justify-center w-full">
          <div className="flex flex-col items-center justify-center w-full">
            {isFreeMint ? (
              <div className="w-full flex mt-2 gap-4 flex-col items-center justify-center">
                <Input
                  type="text"
                  placeholder="Enter your Email, Wallet or .SOL address"
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
                {renderWalletButton()}
                <div className="hidden">
                  <WalletMultiButton />
                </div>
                {existingOrder?.status !== "completed" &&
                  walletAddress &&
                  renderMintButton()}
              </div>
            )}
          </div>

          {error && <p className="text-red-500 mt-2">{error}</p>}
        </div>
      )}
    </div>
  );
}
