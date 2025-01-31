"use client";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import CollectibleMegaCard from "@/components/collectibleMegaCard";
import DotPattern from "@/components/magicui/dot-pattern";
import { cn } from "@/lib/utils";
import { fetchAllCollectibles, CollectibleDetailed } from "@/lib/supabaseClient";
import { useState, useEffect } from "react";
import { toast } from "@/hooks/use-toast";
import { Skeleton } from "@/components/ui/skeleton";
import Link from "next/link";

export default function ArtworkList() {
  const [collectibles, setCollectibles] = useState<CollectibleDetailed[]>([]);
  const [loading, setLoading] = useState(true);
  const [hasMore, setHasMore] = useState(true);
  const [offset, setOffset] = useState(0);
  const LIMIT = 10;

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

      try {
        const response = await fetchAllCollectibles(offset, LIMIT);
        if (!response) {
          throw new Error("Failed to fetch collectibles data");
        }
        
        const { collectibles: newCollectibles, hasMore: moreAvailable } = response;

        setCollectibles(prev => 
          offset === 0 ? newCollectibles : [...prev, ...newCollectibles]
        );
        setHasMore(moreAvailable);
      } catch (error) {
        console.error("Error in fetchCollections:", error);
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
  }, [offset]);

  const loadMore = () => {
    setOffset(prev => prev + LIMIT);
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div>
        <header className="absolute inset-x-0 top-0 z-50 bg-white border-b border-gray-300">
          <nav className="flex justify-center p-6 lg:px-8" aria-label="Global">
            <Link href="/" className="-m-1.5 p-1.5">
              <span className="sr-only">{BRAND_NAME}</span>
              <Image
                src={isIrlsDomain ? "/irlLogo.svg" : "/logo.svg"}
                alt={isIrlsDomain ? "IRLS logo" : "Street mint logo"}
                width={250}
                height={100}
                className="h-10 w-auto"
              />
            </Link>
          </nav>
        </header>

        {loading && offset === 0 ? (
          <div className="py-32 space-y-16">
            <Skeleton className="h-full w-full min-h-[80vh] max-w-[92vw] mx-auto space-y-16 py-24 relative z-120" />
          </div>
        ) : (
          <div>
            <div className="w-full max-w-[92vw] mx-auto space-y-16 py-32 relative">
              {collectibles.map((collectible, index) => (
                <CollectibleMegaCard key={collectible.id} collectible={collectible} index={index} />
              ))}
              
              {hasMore && (
                <div className="flex justify-center pb-16">
                  <Button 
                    onClick={loadMore}
                    disabled={loading}
                    className="w-48 text-lg h-12"
                  >
                    {loading ? "Loading..." : "Load More"}
                  </Button>
                </div>
              )}
            </div>
            <DotPattern
              className={cn(
                "absolute inset-0 w-full h-full z-0",
                "[mask-image:radial-gradient(ellipse_at_center,white,transparent)]"
              )}
            />
          </div>
        )}
      </div>
    </div>
  );
}
