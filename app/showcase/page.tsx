"use client";
import Image from "next/image";
import { Clock, MapPin } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import CollectibleCard from "@/components/collectibleCard";
import DotPattern from "@/components/magicui/dot-pattern";
import { cn } from "@/lib/utils";
import { fetchAllCollectibles, Collectible } from "@/lib/supabaseClient";
import { useState, useEffect } from "react";
import { toast } from "@/hooks/use-toast";

interface ArtworkItem {
  id: string;
  title: string;
  creator: {
    name: string;
    logo: string;
  };
  image: string;
  editionType: string[];
  price: string;
  isFreeClaimable: boolean;
  location: string;
  address: string;
  status: "upcoming" | "live" | "ending";
  timeRemaining: number;
}

const artworks: ArtworkItem[] = [
  {
    id: "1",
    title: "YOUNG NAS - NYC, 1992",
    creator: {
      name: "Chi Modu",
      logo: "/placeholder.svg?height=40&width=40",
    },
    image:
      "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/photo_4965280750693887341_y.jpg-BvwzTS2x7CgVMue5si7zJyY1wh53bk.jpeg",
    editionType: ["PHYSICAL + DIGITAL NFT", "2 EDITIONS"],
    price: "2.5 ETH",
    isFreeClaimable: true,
    location: "New York City",
    address: "40.7128° N, 74.0060° W",
    status: "live",
    timeRemaining: 172800, // 48 hours in seconds
  },
  {
    id: "2",
    title: "TUPAC - LA, 1993",
    creator: {
      name: "Another Photographer",
      logo: "/placeholder.svg?height=40&width=40",
    },
    image: "/placeholder.svg?height=600&width=600",
    editionType: ["DIGITAL NFT", "5 EDITIONS"],
    price: "1.8 ETH",
    isFreeClaimable: false,
    location: "Los Angeles",
    address: "34.0522° N, 118.2437° W",
    status: "upcoming",
    timeRemaining: 86400, // 24 hours in seconds
  },
  // Add more items as needed
];

export default function ArtworkList() {

    const [collectibles, setCollectibles] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);


  const formatTimeRemaining = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    return `${hours}h ${minutes}m`;
  };

  const isIrlsDomain =
    typeof window !== "undefined" &&
    window.location.hostname === "www.irls.xyz";
  console.log(
    "isIrlsDomain",
    typeof window !== "undefined" && window.location.hostname
  );
  const BRAND_NAME = isIrlsDomain ? "IRLS" : "Street Mint";

  useEffect(() => {
    async function fetchCollectibles() {
      setLoading(true);
      setError(null);

      try {
          const allCollectiblesData = await fetchAllCollectibles();
          if (!allCollectiblesData) {
            throw new Error("Failed to fetch all collectibles data");
          }
          console.log("allCollectiblesData", allCollectiblesData);
          setCollectibles(allCollectiblesData);
      } catch (error) {
        console.error("Error in fetchCollections:", error);
        setError("An unexpected error occurred. Please try again later.");
        toast({
          title: "Error",
          description: "Failed to fetch collections. Please try again later.",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    }

    fetchCollectibles();
  }, []);

  return (
    <div>
      <header className="absolute inset-x-0 top-0 z-50 bg-white">
        <nav className="flex justify-center p-6 lg:px-8" aria-label="Global">
          <a href="#" className="-m-1.5 p-1.5">
            <span className="sr-only">{BRAND_NAME}</span>
            <Image
              src={isIrlsDomain ? "/irlLogo.svg" : "/logo.svg"}
              alt={isIrlsDomain ? "IRLS logo" : "Street mint logo"}
              width={250}
              height={100}
              className="h-10 w-auto"
            />
          </a>
        </nav>
      </header>

      <div className="w-full max-w-7xl mx-auto space-y-16 py-24 relative">
        {collectibles.map((collectible, index) => (
          <CollectibleCard collectible={collectible} index={index} />
        ))}
      </div>
      <DotPattern
        className={cn(
          "absolute inset-0 w-full h-full z-0",
          "[mask-image:radial-gradient(ellipse_at_center,white,transparent)]"
        )}
      />
    </div>
  );
}
