"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import {
  getCollectionById,
  getArtistById,
  fetchCollectibleById,
  QuantityType,
  Collection,
  Collectible,
  Artist,
  verifyNfcSignature,
  getCompletedOrdersCount,
  recordNfcTap,
} from "@/lib/supabaseClient";
import Gallery from "@/components/gallery";
import { Toaster } from "@/components/ui/toaster";
import ArtistInfoComponent from "@/components/ArtistInfoComponent";
import EditionInformation from "@/components/EditionInformation";
import { getSolPrice } from "@/lib/services/getSolPrice";

async function fetchNFTData(
  id: string,
  rnd: string,
  sign: string,
  setNFTData: (data: any) => void
) {
  try {
    const collectible = await fetchCollectibleById(Number(id));
    if (!collectible) return null;

    let solPriceUSD = 0;
    let priceInSOL = 0;

    // Only fetch SOL price if price_usd is defined and greater than 0
    if (collectible.price_usd && collectible.price_usd > 0) {
      const solPrice = await getSolPrice();
      if (!solPrice) {
        return null;
      }
      solPriceUSD = solPrice;
      priceInSOL = collectible.price_usd / solPriceUSD;
    }

    let isIRLtapped = false;

    if (collectible.nfc_public_key) {
      const isValid = await verifyNfcSignature(
        rnd,
        sign,
        collectible.nfc_public_key
      );
      isIRLtapped = isValid;
      if (!isValid) {
        console.log("Signature is not valid");
      }
    }

    const collection = await getCollectionById(collectible.collection_id);
    if (!collection) return;

    const artist = await getArtistById(collection.artist);
    if (!artist) return;

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

    setNFTData({
      collectible,
      collection,
      artist,
      priceInSOL,
      remainingQuantity,
      soldCount,
      isIRLtapped,
      randomNumber: rnd,
    });
  } catch (error) {
    console.error("Failed to fetch NFT data", error);
  }
}

export default function NFTPage({
  params,
  searchParams,
}: {
  params: { id: string };
  searchParams: { rnd: string; sign: string };
}) {
  const [nftData, setNFTData] = useState<{
    collectible: Collectible;
    collection: Collection;
    artist: Artist;
    priceInSOL: number;
    remainingQuantity: number | null;
    soldCount: number | 0;
    isIRLtapped: false;
    randomNumber: string;
  }>();

  useEffect(() => {
    fetchNFTData(params.id, searchParams.rnd, searchParams.sign, setNFTData);
  }, [params.id, searchParams.rnd, searchParams.sign]);

  if (!nftData) {
    return (
      <div className="flex justify-center items-center h-screen">
        <Image
          src="/irlLogo.svg"
          alt="Street mint logo"
          width={250}
          height={100}
          className="h-20 w-auto animate-pulse"
        />
      </div>
    );
  }

  const { collectible, collection, artist, priceInSOL, remainingQuantity } =
    nftData;

  return (
    <div className="min-h-screen bg-white mb-20 text-black">
      {/* Header */}
      <header className="py-6 px-6 border-b border-gray-200">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div className="flex justify-center items-center w-full">
            <Image
              src="/irlLogo.svg"
              alt="Street mint logo"
              width={200}
              height={70}
              className="h-10 w-auto"
            />
          </div>
        </div>
      </header>

      {/* Main content */}
      <main
        id="main-content"
        className="flex-grow flex min-h-screen justify-center align-middle flex-col px-4"
      >
        <div className="max-w-7xl mx-auto w-full  py-8 grid md:grid-cols-2 gap-8">
          {/* Left column - Main Image */}
          <div className="relative aspect-square">
            <Image
              width={500}
              height={500}
              src={collectible.primary_image_url}
              alt={`${collectible.name} - Main Image`}
              className="w-full h-full object-contain"
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
              isIRLSmint={true}
              soldCount={nftData.soldCount}
              isIRLtapped={nftData.isIRLtapped}
              randomNumber={nftData.randomNumber}
              collection={{
                ...collection,
                artist: collection.artist || 0,
                collectibles: collection.collectibles || [],
                collection_mint_public_key:
                  collection.collection_mint_public_key || "",
              }}
              collectible={{
                ...collectible,
                quantity_type: collectible.quantity_type as QuantityType,
              }}
              remainingQuantity={remainingQuantity}
              artistWalletAddress={artist.wallet_address}
            />
          </div>
        </div>

        {/* Full-width description */}
        <div className="max-w-7xl mx-auto w-full bg-black text-white rounded-xl  py-8">
          <div className="max-w-7xl mx-auto px-4">
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
                  {collectible.location || "N/A"}
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
                <p className="text-gray-400">Blockchain</p>
                <p>Solana</p>
              </div>
            </div>
          </div>
        </div>
        {/* Gallery Section */}
        {collectible.gallery_urls.length > 0 && (
          <div className="w-full bg-white py-4">
            <div className="max-w-7xl mx-auto px-4">
              {/* <h2 className="text-2xl font-bold mb-4">Gallery</h2> */}
              <Gallery images={collectible.gallery_urls} />
            </div>
          </div>
        )}
      </main>
      <Toaster />
    </div>
  );
}
