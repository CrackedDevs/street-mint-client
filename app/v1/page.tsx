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
import EditionInformation from "@/components/EditionInformation";
import { getSolPrice } from "@/lib/services/getSolPrice";
import { checkAuthStatus } from "@/lib/ixkioAuth";

export default async function NFTPage({
  searchParams,
}: {
  searchParams: { x: string; n: string; e: string };
}) {

  console.log(searchParams);

  const data = await checkAuthStatus(
    searchParams.x,
    searchParams.n,
    searchParams.e
  );

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

  //   const data = await getNFTData(params.id, searchParams.rnd, searchParams.sign);

  //   if (!data) {
  //     return (
  //       <div className="flex justify-center items-center h-screen">
  //         <Image
  //           src="/logo.svg"
  //           alt="Street mint logo"
  //           width={250}
  //           height={100}
  //           className="h-20 w-auto animate-pulse"
  //         />
  //       </div>
  //     );
  //   }

    const {
      collectible,
      collection,
      artist,
      priceInSOL,
      remainingQuantity,
      soldCount,
    } = data.collectibleData;

  const isIRLtapped = data.isIRLtapped;
  const scanCount = data.scanCount;


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
                randomNumber={"89898"}
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
