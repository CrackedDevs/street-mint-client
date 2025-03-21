import Image from "next/image";
import { QuantityType } from "@/lib/supabaseClient";
import Gallery from "@/components/gallery";
import { Toaster } from "@/components/ui/toaster";
import ArtistInfoComponent from "@/components/ArtistInfoComponent";
import EditionInformation from "@/components/EditionInformation";
import { checkAuthStatus } from "@/lib/ixkioAuth";
import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { getSponsorImageByCollectibleId } from "@/lib/supabaseAdminClient";
import LoadingOverlay from "@/components/LoadingOverlay";
import { verifySignatureCode } from "@/lib/adminAuth";

export default async function NFTPage({
  searchParams,
}: {
  searchParams: { x: string; n: string; e: string; signatureCode: string };
}) {
  // Get hostname from headers
  const host = headers().get("host") || "";
  const isIrlsDomain = host.includes("irls.xyz");
  console.log("isIrlsDomain", isIrlsDomain);

  const BRAND_NAME = isIrlsDomain ? "IRLS" : "Street Mint";
  const signatureCode = searchParams.signatureCode || "";
  let data;

  // Fetch data based on whether signature code exists
  if (signatureCode) {
    data = await verifySignatureCode(signatureCode);
  } else {
    data = await checkAuthStatus(
      searchParams.x,
      searchParams.n,
      searchParams.e,
      isIrlsDomain
    );
  }

  // Then fetch sponsor data if available
  const sponsor_data = data ? await getSponsorImageByCollectibleId(data.collectibleData?.collectible?.id) : null;
  console.log("Sponsor data:", sponsor_data);

  if (!data || data.collectibleData === null) {
    return (
      <div className="flex justify-center items-center h-screen">
        <Image
          src={sponsor_data?.img_url || '/logo.svg'}
          alt={sponsor_data?.name || "Street mint logo"}
          width={250}
          height={100}
          className="h-20 w-auto animate-pulse"
        />
      </div>
    );
  }

  if (data.is_irls == true && data.redirectUrl !== null) {
    redirect(data.redirectUrl);
  } else if (data.is_irls == true) {
    alert("IRLS is not available for this moment");
  }

  const {
    collectible,
    collection,
    artist,
    priceInSOL,
    remainingQuantity,
    soldCount,
  } = data.collectibleData;

  const adminSignatureAuthenticated = data.adminSignatureAuthenticated || false;
  const isIRLtapped = data.isIRLtapped;

  // Prepare sponsor logo and name, handling null values
  const sponsorLogo = sponsor_data?.img_url || undefined;
  const sponsorName = sponsor_data?.name || undefined;

  return (
    <div className="min-h-screen bg-white text-black">
      {/* Always include client-side loading overlay with sponsor logo if available */}
      <LoadingOverlay
        sponsorLogo={sponsorLogo}
        sponsorName={sponsorName}
      />

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
          <div>
            <h1 className="text-3xl font-bold mb-2">{collectible.name}</h1>
            <p className="text-xl text-gray-600 mb-4">
              From the &quot;{collection.name}&quot; Collection
            </p>
            {/* Artist Information */}
            <ArtistInfoComponent artist={artist} />
            {/* Edition Information Section */}
            <EditionInformation
              x={searchParams.x}
              n={searchParams.n}
              e={searchParams.e}
              adminSignatureCode={signatureCode}
              adminSignatureAuthenticated={adminSignatureAuthenticated}
              soldCount={soldCount}
              isIRLtapped={isIRLtapped}
              collection={{
                ...collection,
                artist: collection.artist || 0,
                collectibles: [],
                collection_mint_public_key:
                  collection.collection_mint_public_key || "",
                metadata_uri: collection.metadata_uri || "",
                merkle_tree_public_key: collection.merkle_tree_public_key || "",
              }}
              collectible={{
                ...collectible,
                stripe_price_id: collectible.stripe_price_id || undefined,
                creator_royalty_array: collectible.creator_royalty_array as
                  | {
                    creator_wallet_address: string;
                    royalty_percentage: number;
                    name: string;
                  }[]
                  | null,
                quantity_type: collectible.quantity_type as QuantityType,
                whitelist: collectible.whitelist || false,
                cta_enable: collectible.cta_enable || false,
                cta_has_email_capture:
                  collectible.cta_has_email_capture || false,
                cta_email_list: (collectible.cta_email_list || []) as {
                  [key: string]: string;
                }[],
                cta_has_text_capture: collectible.cta_has_text_capture || false,
                cta_text_list: (collectible.cta_text_list || []) as {
                  [key: string]: string;
                }[],
                enable_card_payments: collectible.enable_card_payments || false,
                only_card_payment: collectible.only_card_payment || false,
              }}
              remainingQuantity={remainingQuantity}
              artistWalletAddress={artist.wallet_address}
            />
          </div>
        </div>
        <div className="max-w-7xl mt-10  mx-auto w-full bg-black text-white rounded-xl  py-8">
          <div className="max-w-7xl  mx-auto px-4">
            <h2 className="text-2xl font-bold mb-4">Description</h2>
            {collectible.description.split("\n").map((paragraph, index) => (
              <p key={index} className="text-md mb-2">
                {paragraph}
              </p>
            ))}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
              <div>
                <p className="text-gray-400">Art title</p>
                <p>{collectible.name}</p>
              </div>
              <div>
                <p className="text-gray-400">Artist</p>
                <p>{artist.username}</p>
              </div>
              {collectible.location_note && (
                <p className="text-md text-gray-400">
                  <strong>Where:</strong> {collectible.location_note}
                </p>
              )}
              <div>
                <p className="text-gray-400">Location to mint</p>
                <a
                  className="text-blue-400 break-words"
                  href={collectible.location || ""}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  {collectible.location ? "Google Maps" : "N/A"}
                </a>
              </div>
              <div>
                <p className="text-gray-400">Price per edition</p>
                <p>
                  {collectible.price_usd > 0 ? (
                    <>
                      ${collectible.price_usd.toFixed(2)} (
                      {priceInSOL.toFixed(2)} SOL)
                    </>
                  ) : (
                    "Free"
                  )}
                </p>
              </div>
              <div>
                <p className="text-gray-00">Blockchain</p>
                <p>Solana</p>
              </div>
            </div>
          </div>
        </div>
        {collectible.gallery_urls.length > 0 && (
          <div className="w-full bg-white py-4">
            <div className="max-w-7xl mx-auto px-4">
              <Gallery images={collectible.gallery_urls} />
            </div>
          </div>
        )}
      </main>
      <Toaster />
    </div>
  );
}
