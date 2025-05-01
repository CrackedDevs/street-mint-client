import Image from "next/image";
import { QuantityType } from "@/lib/supabaseClient";
import Gallery from "@/components/gallery";
import { Toaster } from "@/components/ui/toaster";
import ArtistInfoComponent from "@/components/ArtistInfoComponent";
import { headers } from "next/headers";
import { checkLightVersionClaimAuthStatus } from "@/lib/claimAuth";
import EditionInformationClaim from "@/components/EditionInformation-Claim";
import dynamic from "next/dynamic";
import Link from "next/link";

// Use dynamic import with no SSR for the client component
const ClaimPopupModal = dynamic(() => import("../../components/ClaimPopupModal"), {
  ssr: false,
});

export default async function NFTPage({
  searchParams,
}: {
  searchParams: { signatureCode: string };
}) {
  const host = headers().get("host") || "";
  const isIrlsDomain = host.includes("irls.xyz");
  const signatureCode = searchParams.signatureCode;

  if (!signatureCode) {
    return (
      <div className="flex justify-center items-center h-screen">
        <Image
          src={isIrlsDomain ? "/irlLogo.svg" : "/logo.svg"}
          alt={isIrlsDomain ? "IRLS logo" : "Street mint logo"}
          width={250}
          height={100}
          className="h-20 w-auto animate-pulse"
        />
      </div>
    );
  }

  const lightOrderData = await checkLightVersionClaimAuthStatus(signatureCode);

  if (
    !lightOrderData ||
    !lightOrderData.success ||
    !lightOrderData.lightOrder
  ) {
    return (
      <div className="flex justify-center items-center h-screen">
        <Image
          src={isIrlsDomain ? "/irlLogo.svg" : "/logo.svg"}
          alt={isIrlsDomain ? "IRLS logo" : "Street mint logo"}
          width={250}
          height={100}
          className="h-20 w-auto animate-pulse"
        />
      </div>
    );
  }

  const {
    collectible,
    collection,
    artist,
    priceInSOL,
    remainingQuantity,
    soldCount,
  } = lightOrderData.collectibleData;

  const lightOrder = lightOrderData.lightOrder;

  return (
    <div className="min-h-screen bg-white text-black">
      {/* Popup Modal */}
      <ClaimPopupModal />

      {/* Header */}
      <header className="py-4 px-6 border-b border-gray-200">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div className="flex justify-center items-center w-full">
            <Image
              src={isIrlsDomain ? "/irlLogo.svg" : "/logo.svg"}
              alt={isIrlsDomain ? "IRLS logo" : "Street mint logo"}
              width={150}
              height={50}
              className="h-8 w-auto"
            />
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="py-8 md:px-10 gap-10 px-4">
        <div className="max-w-7xl mx-auto grid md:grid-cols-2 gap-8">
          {/* Left column - Main Image / Video */}
          <div className="relative flex justify-center items-center h-full w-full">
            {collectible.primary_media_type === "video" ? (
              <video
                src={collectible.primary_image_url}
                autoPlay={true}
                loop={true}
                muted={true}
                width={500}
                height={500}
              />
            ) : collectible.primary_media_type === "audio" ? (
              <audio
                src={collectible.primary_image_url}
                controls
                loop
                controlsList="nodownload"
              />
            ) : (
              <Image
                src={collectible.primary_image_url}
                alt={`${collectible.name} - Main Image`}
                objectFit="contain"
                width={500}
                height={500}
              />
            )}
          </div>

          {/* Right column - Details */}
          {lightOrder && (
            <div>
              <h1 className="text-3xl font-bold mb-2">{collectible.name}</h1>
              <p className="text-xl text-gray-600 mb-4">
                From the &quot;{collection.name}&quot; Collection
              </p>
              {/* Artist Information */}
              <ArtistInfoComponent artist={artist} />
              {/* Edition Information Section */}
              <EditionInformationClaim
                soldCount={soldCount}
                signatureCode={signatureCode}
                collection={{
                  ...collection,
                  artist: collection.artist || 0,
                  collectibles: [],
                  collection_mint_public_key:
                    collection.collection_mint_public_key || "",
                  metadata_uri: collection.metadata_uri || "",
                  merkle_tree_public_key:
                    collection.merkle_tree_public_key || "",
                }}
                collectible={{
                  ...collectible,
                  creator_royalty_array: collectible.creator_royalty_array as
                    | {
                        creator_wallet_address: string;
                        royalty_percentage: number;
                        name: string;
                      }[]
                    | null,
                  enable_card_payments:
                    collectible.enable_card_payments || false,
                  stripe_price_id: collectible.stripe_price_id || undefined,
                  quantity_type: collectible.quantity_type as QuantityType,
                  whitelist: collectible.whitelist || false,
                  cta_enable: collectible.cta_enable || false,
                  cta_has_email_capture:
                    collectible.cta_has_email_capture || false,
                  cta_email_list: (collectible.cta_email_list || []) as {
                    [key: string]: string;
                  }[],
                  cta_has_text_capture:
                    collectible.cta_has_text_capture || false,
                  cta_text_list: (collectible.cta_text_list || []) as {
                    [key: string]: string;
                  }[],
                  only_card_payment:
                    collectible.only_card_payment === null
                      ? undefined
                      : collectible.only_card_payment,
                }}
                remainingQuantity={remainingQuantity}
                artistWalletAddress={artist.wallet_address}
                lightOrder={lightOrder}
              />
            </div>
          )}
        </div>
        <div className="max-w-7xl mt-10  mx-auto w-full rounded-xl  py-8">
          You&apos;re just one step away from owning your unique IRLS Collectible!
          <br />
          <br />
          But to claim it, you&apos;ll need a Solana wallet.
          <br />
          <br />
          <span className="font-bold underline">
            Option 1: Enter your Existing Wallet address above
          </span>
          <br />
          <br />
          If you already have a Solana wallet (like Phantom, Glow, or Solflare),
          simply enter your wallet or .SOL address and hit the Collect button.
          <br />
          <br />
          <span className="font-bold underline">Option 2: Create a New Wallet</span>
          <br />
          <br />
          If you&apos;re new to Solana, we recommend setting up a Phantom wallet.
          <br />
          <br />
          It&apos;s easy to use and works seamlessly with IRLS and the whole Solana
          ecosystem.
          <br />
          <br />
          Download a phantom wallet{" "}
          <a
            href="https://phantom.app/"
            className="text-blue-500 underline"
          >
            here
          </a>{" "}
          for free and return to this page.
          <br />
          Enter your new Solana wallet address and hit the Collect button to
          claim your collectible.
          <br />
          <br />
          <span className="font-bold">What is a Solana wallet?</span>
          <br />
          <br />
          Your Solana wallet is a secure place to store and manage your digital
          assets on the Solana blockchain, including your IRLS Collectibles. It
          allows you to prove ownership, trade them on the secondary market,
          transfer them to others and interact with the exciting world of Web3.
          <br />
          <br />
          Need Help?
          <br />
          <br />
          Visit our FAQ for a step-by-step guide on setting up a
          Solana wallet and claiming your collectible:{" "}
          <Link href="/faq" className="text-blue-500 font-bold underline">
            FAQs
          </Link>
        </div>
      </main>
      <Toaster />
    </div>
  );
}
