import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardHeader,
  CardContent,
  CardTitle,
  CardFooter,
} from "@/components/ui/card";
import { EditionService } from "@/lib/services/editionService";
import { SolanaFMService } from "@/lib/services/solanaExplorerService";
import { TimeService } from "@/lib/services/timeService";
import {
  getGalleryInformationByTokenAddresses,
  QuantityType,
} from "@/lib/supabaseClient";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@radix-ui/react-select";
import { useWallet } from "@solana/wallet-adapter-react";
import {
  CalendarIcon,
  ExternalLinkIcon,
  LayersIcon,
  LayoutGrid,
  List,
  MapPinIcon,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";

export type View = "grid" | "list";

export type GalleryItem = {
  imageUrl: string;
  collectibleName: string;
  collectionName: string;
  quantityType: QuantityType;
  mintAddress: string;
  locationMinted: string;
  orderDate: string;
};

export const GalleryGrid = () => {
  const { connected, publicKey } = useWallet();
  const [loading, setIsLoading] = useState(false);
  const [nfts, setNfts] = useState<GalleryItem[]>([]);

  useEffect(() => {
    if (connected) fetchNFTs();
  }, [connected, publicKey]);

  async function fetchNFTs() {
    setIsLoading(true);
    const walletAddress = publicKey?.toBase58();

    try {
      const response = await fetch(process.env.NEXT_PUBLIC_RPC_URL!, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          jsonrpc: "2.0",
          id: "text",
          method: "getAssetsByOwner",
          params: { ownerAddress: walletAddress },
        }),
      });

      const data = await response.json();

      if (data.result) {
        const onlyNFTs = data.result.items.filter((item: any) =>
          item.interface.includes("NFT")
        );

        const nfts: string[] = onlyNFTs.map((nft: any) => nft.id);

        console.log(nfts);

        const galleryInformation = await getGalleryInformationByTokenAddresses(
          nfts
        );
        console.log(galleryInformation);
        setNfts(galleryInformation);
      }
    } catch (error) {
      console.error("Error fetching NFTs:", error);
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="container mx-auto text-gray-800">
      <div className="flex justify-center items-center">
        <h2 className="text-5xl font-bold text-black mt-10 z-30">
          Your Collectibles
        </h2>
      </div>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 mt-6 mx-4">
        {nfts.map((nft) => (
          <Card
            key={nft.mintAddress}
            className="overflow-hidden bg-white z-30 flex flex-col"
          >
            <CardHeader className="p-0 relative">
              <Image
                src={nft.imageUrl}
                alt={nft.collectibleName}
                className="w-full h-48 object-cover"
                width={100}
                height={100}
              />
              <Badge className="absolute top-2 right-2 bg-primary text-primary-foreground">
                {EditionService.getEditionTypeText(nft.quantityType)}
              </Badge>
            </CardHeader>
            <CardContent className="p-4 flex-grow">
              <CardTitle className="text-lg font-bold mb-2">
                {nft.collectibleName}
              </CardTitle>
              <Badge className="mb-2">{nft.collectionName}</Badge>
              <div className="flex items-center text-sm text-muted-foreground mb-1">
                <CalendarIcon className="w-4 h-4 mr-2" />
                {TimeService.formatDate(nft.orderDate)}
              </div>
              {nft.locationMinted && (
                <div className="flex items-center text-sm text-muted-foreground mb-1">
                  <MapPinIcon className="w-4 h-4 mr-2" />
                  <a
                    href={nft.locationMinted ?? ""}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    View Location
                  </a>
                </div>
              )}
              <div className="flex items-center text-sm text-muted-foreground">
                <LayersIcon className="w-4 h-4 mr-2" />
                {EditionService.getEditionTypeText(nft.quantityType)}
              </div>
            </CardContent>
            <CardFooter className="p-4 pt-0">
              <Button
                className="w-full"
                variant="outline"
                onClick={() =>
                  window.open(
                    SolanaFMService.getToken(nft.mintAddress),
                    "_blank"
                  )
                }
              >
                <ExternalLinkIcon className="w-4 h-4 mr-2" />
                Show on Blockchain
              </Button>
            </CardFooter>
          </Card>
        ))}
      </div>
    </div>
  );
};
