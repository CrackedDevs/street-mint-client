import Image from "next/image";
import {
  getCollectionById,
  getArtistById,
  fetchCollectibleById,
  QuantityType,
  getCompletedOrdersCount,
} from "@/lib/supabaseClient";
import Gallery from "@/components/gallery";
import { Toaster } from "@/components/ui/toaster";
import ArtistInfoComponent from "@/components/ArtistInfoComponent";
import EditionInformation from "@/components/EditionInformation-Old";
import { getSolPrice } from "@/lib/services/getSolPrice";
import { recordNfcTap, verifyNfcSignature } from "@/lib/supabaseAdminClient";

async function getNFTData(id: string, rnd: string, sign: string) {
  let isIRLtapped = false;
  let solPriceInUSD = 0;

  const collectible = await fetchCollectibleById(Number(id));
  if (!collectible) return null;

  // Only fetch SOL price if usdc_price is defined and greater than 0
  if (collectible.price_usd && collectible.price_usd > 0) {
    const solPrice = await getSolPrice();
    if (!solPrice) {
      return null;
    }
    solPriceInUSD = solPrice;
  }

  if (collectible.nfc_public_key) {
    const isValid = await verifyNfcSignature(
      rnd,
      sign,
      collectible.nfc_public_key
    );
    if (!isValid) {
      console.log("Signature is not valid");
      isIRLtapped = false;
    } else {
      isIRLtapped = true;
    }
  }

  const collection = await getCollectionById(collectible.collection_id);
  if (!collection) return null;

  const artist = await getArtistById(collection.artist);
  if (!artist) return null;

  // Calculate NFT price in SOL
  const priceInSOL = collectible.price_usd / solPriceInUSD;

  // Calculate remaining quantity for limited editions
  let remainingQuantity = null;
  if (collectible.quantity_type === "limited") {
    remainingQuantity = collectible.quantity;
  }
  const soldCount = await getCompletedOrdersCount(collectible.id);

  if (collectible.price_usd == 0 && rnd && sign) {
    const recordSuccess = await recordNfcTap(rnd);
    if (!recordSuccess) {
      return;
    }
  }

  return {
    collectible,
    collection,
    artist,
    priceInSOL,
    remainingQuantity,
    isIRLtapped,
    soldCount,
    randomNumber: rnd,
  };
}

// Convert to an async Server Component
export default async function NFTPage({
  params,
  searchParams,
}: {
  params: { id: string };
  searchParams: { rnd: string; sign: string };
}) {
  const data = await getNFTData(params.id, searchParams.rnd, searchParams.sign);

  if (!data) {
    return (
      <div className="flex justify-center items-center h-screen">
        <Image
          src="/logo.svg"
          alt="Street mint logo"
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
    isIRLtapped,
    randomNumber,
  } = data;

  return (
    <div className="min-h-screen bg-white text-black">
      {/* Header */}
      <header className="py-4 px-6 border-b border-gray-200">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div className="flex justify-center items-center w-full">
            <Image
              src="/logo.svg"
              alt="Street mint logo"
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
          {/* Left column - Main Image */}
          <div className="relative flex justify-center items-center h-full w-full">
            <Image
              src={collectible.primary_image_url}
              alt={`${collectible.name} - Main Image`}
              objectFit="contain"
              width={500}
              height={500}
            />
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
              randomNumber={randomNumber}
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
                quantity_type: collectible.quantity_type as QuantityType,
                whitelist: collectible.whitelist || false,
                cta_enable: collectible.cta_enable || false,
                cta_has_email_capture: collectible.cta_has_email_capture || false,
                cta_email_list: (collectible.cta_email_list || []) as {
                  [key: string]: string;
                }[],
                cta_has_text_capture:
                  collectible.cta_has_text_capture || false,
                cta_text_list: (collectible.cta_text_list || []) as {
                  [key: string]: string;
                }[],
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
