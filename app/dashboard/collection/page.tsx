"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import Link from "next/link";
import {
  getCollectionsByArtistId,
  PopulatedCollection,
} from "@/lib/supabaseClient";
import { useWallet } from "@solana/wallet-adapter-react";
import withAuth from "../withAuth";
import { PlusIcon, Loader2Icon, TrashIcon } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { useUserProfile } from "@/app/providers/UserProfileProvider";
import DotPattern from "@/components/magicui/dot-pattern";
import { cn } from "@/lib/utils";
import ShimmerButton from "@/components/magicui/shimmer-button";
import CollectionCard from "@/components/collectionCard";

function CollectionsPage() {
  const [collections, setCollections] = useState<PopulatedCollection[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { publicKey, connected } = useWallet();
  const { userProfile } = useUserProfile();

  useEffect(() => {
    async function fetchCollections() {
      if (!connected || !publicKey) {
        setError("Please connect your wallet to view collections.");
        setLoading(false);
        return;
      }
      setLoading(true);
      setError(null);

      try {
        if (userProfile && publicKey) {
          const collectionsData = await getCollectionsByArtistId(
            userProfile.id
          );
          if (!collectionsData) {
            throw new Error("Failed to fetch collections data");
          }

          setCollections(collectionsData);
        }
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

    fetchCollections();
  }, [userProfile]);

  if (!connected) {
    return <></>;
  }

  return (
    <div className="min-h-screen bg-background text-foreground p-4 sm:p-8 w-full">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold">Your Collections</h1>
          <Link href="/dashboard/collection/create" className="z-10">
            <ShimmerButton>
              <PlusIcon className="mr-2 h-4 w-4" /> Create New Collection
            </ShimmerButton>
          </Link>
        </div>
        
        {loading || !connected ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(3)].map((_, index) => (
              <Card key={index} className="w-full h-64 animate-pulse z-20">
                <CardHeader className="h-1/2 bg-gray-200 dark:bg-gray-700" />
                <CardContent className="h-1/2 flex items-center justify-center">
                  <Loader2Icon className="h-8 w-8 animate-spin text-gray-400" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : error ? (
          <Card className="w-full max-w-md mx-auto z-20 relative">
            <CardHeader>
              <CardTitle className="text-2xl font-bold text-center text-red-500">
                Error
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-center mb-4">{error}</p>
              <Button
                className="w-full"
                onClick={() => window.location.reload()}
              >
                Retry
              </Button>
            </CardContent>
          </Card>
        ) : collections.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {collections.map((collection) => (
              <div key={collection.id} className="relative z-20 bg-white">
                <CollectionCard
                  collection={{
                    id: collection.id?.toString() || "",
                    name: collection.name,
                    description: collection.description,
                    collectible_image_urls: collection.collectible_image_urls,
                  }}
                />
                {/* LET THIS STAY */}
                {/* <Button
                  variant="destructive"
                  size="sm"
                  className="absolute top-2 right-2 z-30"
                  onClick={() => handleDeleteCollection(collection.id)}
                >
                  <TrashIcon className="h-4 w-4" />
                </Button> */}
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center z-20">
            <p className="text-lg mb-4">
              You haven&apos;t created any collections yet.
            </p>
            <Link href="/dashboard/collection/create" className="z-30 relative">
              <Button size="lg" className="z-30">
                <PlusIcon className="mr-2 h-5 w-5" /> Create Your First
                Collection
              </Button>
            </Link>
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
  );
}

export default withAuth(CollectionsPage);
