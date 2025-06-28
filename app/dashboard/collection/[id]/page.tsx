"use client";

import Link from "next/link";
import Image from "next/image";
import {
  ChevronLeft,
  ChevronRight,
  PlusCircle,
  MapPin,
  Calendar,
  Search,
  Loader2,
  AlertTriangleIcon
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Badge as BadgeIcon } from "lucide-react";
import { Input } from "@/components/ui/input";
import {
  Collection,
  Collectible,
  BatchListing,
  getCollectionById,
  fetchCollectiblesByCollectionId,
  supabase,
} from "@/lib/supabaseClient";
import { useParams } from "next/navigation";
import { useState, useEffect } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { useRouter } from "next/navigation";
import withAuth from "../../withAuth";
import { TimeService } from "@/lib/services/timeService";
import { useUserProfile } from "@/app/providers/UserProfileProvider";
import { useToast } from "@/hooks/use-toast";

type CollectionWithIds = Omit<Collection, "collectibles">;

// Function to fetch batch listings by collection ID
const fetchBatchListingsByCollectionId = async (collectionId: number): Promise<BatchListing[] | null> => {
  const { data, error } = await supabase
    .from("batch_listings")
    .select("*")
    .eq("collection_id", collectionId);

  if (error) {
    console.error("Error fetching batch listings:", error);
    return null;
  }

  return data as BatchListing[];
};

function Component() {
  const { id } = useParams();
  const router = useRouter();
  const { userProfile } = useUserProfile();
  const { toast } = useToast();
  const [collection, setCollection] = useState<CollectionWithIds | null>(null);
  const [collectibles, setCollectibles] = useState<Collectible[]>([]);
  const [filteredCollectibles, setFilteredCollectibles] = useState<Collectible[]>([]);
  const [batchListings, setBatchListings] = useState<BatchListing[] | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  // Authorization states
  const [isAuthorized, setIsAuthorized] = useState<boolean | null>(null);
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);

  // Authorization check - verify collection belongs to the logged-in artist
  useEffect(() => {
    const checkAuthorization = async () => {
      if (!userProfile?.id || !id) {
        setIsCheckingAuth(false);
        return;
      }

      try {
        const collectionData = await getCollectionById(Number(id));
        if (collectionData) {
          const authorized = collectionData.artist === userProfile.id;
          setIsAuthorized(authorized);
          
          if (!authorized) {
            toast({
              title: "Unauthorized",
              description: "You don't have permission to view this collection.",
              variant: "destructive",
            });
          }
        } else {
          setIsAuthorized(false);
          toast({
            title: "Error",
            description: "Collection not found.",
            variant: "destructive",
          });
        }
      } catch (error) {
        console.error("Error checking authorization:", error);
        setIsAuthorized(false);
        toast({
          title: "Error",
          description: "Failed to verify permissions.",
          variant: "destructive",
        });
      } finally {
        setIsCheckingAuth(false);
      }
    };

    checkAuthorization();
  }, [userProfile?.id, id, toast]);

  useEffect(() => {
    async function fetchCollectionAndCollectibles() {
      if (!isAuthorized) return;

      const collectionData = await getCollectionById(Number(id));

      if (!collectionData) {
        console.error("Error fetching collection: Collection not found");
      } else {
        setCollection({ ...collectionData } as CollectionWithIds);
      }

      const collectiblesData = await fetchCollectiblesByCollectionId(
        Number(id)
      );

      if (!collectiblesData) {
        console.error("Error fetching collectibles: No data returned");
        return;
      } else {
        setCollectibles(collectiblesData as Collectible[]);
        setFilteredCollectibles(collectiblesData as Collectible[]);
      }

      // Fetch batch listings for this collection
      const batchListingsData = await fetchBatchListingsByCollectionId(Number(id));
      setBatchListings(batchListingsData);
    }
    fetchCollectionAndCollectibles();
  }, [id, isAuthorized]);

  // Filter collectibles based on search query
  useEffect(() => {
    if (searchQuery.trim() === "") {
      setFilteredCollectibles(collectibles);
    } else {
      const query = searchQuery.toLowerCase();
      const filtered = collectibles.filter(
        (item) =>
          item.name.toLowerCase().includes(query) ||
          (item.description && item.description.toLowerCase().includes(query))
      );
      setFilteredCollectibles(filtered);
    }
  }, [searchQuery, collectibles]);

  // Show loading while checking authorization
  if (isCheckingAuth) {
    return (
      <div className="min-h-screen bg-gray-100 py-8 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="flex justify-center items-center h-64">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <span className="ml-2 text-lg">Verifying permissions...</span>
          </div>
        </div>
      </div>
    );
  }

  // Show unauthorized message if user doesn't have permission
  if (isAuthorized === false) {
    return (
      <div className="min-h-screen bg-gray-100 py-8 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <Card className="w-full shadow-lg">
            <CardContent className="py-12">
              <div className="text-center">
                <AlertTriangleIcon className="mx-auto h-16 w-16 text-destructive mb-4" />
                <h2 className="text-2xl font-bold mb-2">Access Denied</h2>
                <p className="text-gray-600 mb-6">
                  You don't have permission to view this collection. Only the collection owner can access it.
                </p>
                <Button 
                  onClick={() => router.push('/dashboard')}
                  variant="outline"
                >
                  Return to Dashboard
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  if (!collection) {
    return (
      <div className="min-h-screen bg-gray-100 py-8 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <Skeleton className="h-6 w-32 mb-6" />
          <Skeleton className="h-48 w-full mb-8" />
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, index) => (
              <Skeleton key={index} className="h-96 w-full" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  const hasBatchListings = batchListings && batchListings.length > 0;

  return (
    <div className="min-h-screen bg-gray-100 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <Link
            href="/dashboard/collection"
            className="inline-flex items-center text-sm font-medium text-gray-700 hover:text-gray-900"
          >
            <ChevronLeft className="mr-1 h-4 w-4" />
            Back to Collections
          </Link>
          {!hasBatchListings && (
            <div className="flex space-x-2">
              <Button
                className="inline-flex items-center"
                onClick={() => {
                  router.push(
                    `/dashboard/collection/${collection.id}/new-batch-listing`
                  );
                }}
              >
                <PlusCircle className="mr-2 h-4 w-4" />
                Add New Batch Listing
              </Button>
              <Button
                className="inline-flex items-center"
                onClick={() => {
                  router.push(
                    `/dashboard/collection/${collection.id}/new-collectible`
                  );
                }}
              >
                <PlusCircle className="mr-2 h-4 w-4" />
                Add New Collectible
              </Button>
            </div>
          )}
        </div>
        <Card className="mb-8 bg-white shadow-lg">
          <CardHeader>
            <CardTitle className="text-3xl font-bold text-gray-900 mb-2">
              {collection.name}
            </CardTitle>
            <p className="text-lg text-gray-600">{collection.description}</p>
          </CardHeader>
        </Card>

        {hasBatchListings && (
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Batch Listings</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {batchListings.map((batchListing) => (
                <Card 
                  key={batchListing.id}
                  className="overflow-hidden hover:shadow-xl transition-shadow duration-300 flex flex-col"
                >
                  <CardContent className="flex pt-5 w-full h-full justify-center flex-col">
                    <div className="relative">
                      {batchListing.primary_media_type === "video" ? (
                        <video
                          src={batchListing.primary_image_url}
                          className="object-contain w-full h-full object-center items-center"
                          autoPlay
                          loop
                          muted
                        />
                      ) : batchListing.primary_media_type === "audio" ? (
                        <audio
                          src={batchListing.primary_image_url}
                          controls
                          loop
                          controlsList="nodownload"
                        />
                      ) : (
                        <Image
                          width={300}
                          height={300}
                          src={batchListing.primary_image_url}
                          alt={batchListing.name}
                          className="object-contain w-full h-full object-center items-center"
                        />
                      )}
                    </div>
                    <div className="p-4">
                      <h3 className="text-xl font-semibold mb-2 text-gray-900">
                        {batchListing.name}
                      </h3>
                      <p className="text-sm text-gray-600 mb-4">
                        {batchListing.description}
                      </p>
                      <p className="text-sm mb-1">
                        Batch Listing ID: {batchListing.id}
                      </p>
                      <p className="text-sm mb-4">
                        {batchListing.frequency_type === "daily" ? "Daily" : batchListing.frequency_type === "weekly" ? "Weekly" : "Monthly"}
                      </p>
                      <div className="flex justify-between items-center mb-4">
                        <div className="flex flex-wrap gap-2">
                          <Badge
                            variant="secondary"
                            className="text-xs font-semibold"
                          >
                            {batchListing.quantity_type === "limited"
                              ? `Limited (${batchListing.quantity})`
                              : batchListing.quantity_type === "single"
                                ? "1 of 1"
                                : "Open Edition"}
                          </Badge>
                          <Badge
                            variant="secondary"
                            className="text-xs font-semibold"
                          >
                            {batchListing.is_light_version === true
                              ? "Light"
                              : "Standard"}
                          </Badge>
                          <Badge
                            variant="secondary"
                            className="text-xs font-semibold"
                          >
                            {batchListing.is_irls === true
                              ? "IRLS"
                              : "StreetMint"}
                          </Badge>
                        </div>
                        <span className="text-lg font-bold text-gray-900">
                          {batchListing.price_usd > 0
                            ? `$${batchListing.price_usd}`
                            : "Free"}
                        </span>
                      </div>
                      <div className="space-y-2 mt-4">
                        <div className="flex items-center text-sm text-blue-600">
                          <MapPin className="mr-2 h-4 w-4" />
                          <a
                            href={batchListing.location ?? ""}
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            {(batchListing.location && "View Location") ||
                              "Location not specified"}
                          </a>
                        </div>
                        {batchListing.location_note && (
                          <p className="text-sm text-gray-600 ml-6">
                            {batchListing.location_note}
                          </p>
                        )}
                        <div className="flex items-center text-sm text-gray-600">
                          <PlusCircle className="mr-2 h-4 w-4" />
                          <span>
                            Collectible Name:{" "}
                            {batchListing.collectible_name}
                          </span>
                        </div>
                        <div className="flex items-center text-sm text-gray-600">
                          <Calendar className="mr-2 h-4 w-4" />
                          <span>
                            Batch Start:{" "}
                            {TimeService.formatDate(batchListing.batch_start_date)}
                          </span>
                        </div>
                        <div className="flex items-center text-sm text-gray-600">
                          <Calendar className="mr-2 h-4 w-4" />
                          <span>
                            Batch End:{" "}
                            {TimeService.formatDate(batchListing.batch_end_date)}
                          </span>
                        </div>
                        {batchListing.batch_hour !== null && (
                          <div className="flex items-center text-sm text-gray-600">
                            <Calendar className="mr-2 h-4 w-4" />
                            <span>Batch Hour: {batchListing.batch_hour}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </CardContent>
                  <div className="p-4 bg-gray-50 border-t border-gray-200">
                    <Button
                      onClick={() =>
                        router.push(
                          `/dashboard/collection/${collection.id}/edit-batch-listing/${batchListing.id}`
                        )
                      }
                      variant="ghost"
                      className="w-full text-sm text-gray-600 hover:text-gray-900 flex items-center justify-center"
                    >
                      Edit Batch Listing
                      <ChevronRight className="ml-2 h-4 w-4" />
                    </Button>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        )}

        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-bold text-gray-900">Collectibles</h2>
          <div className="relative w-1/3">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              type="text"
              placeholder="Search collectibles..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 pr-4 py-2 border rounded-md w-full"
            />
          </div>
        </div>
        
        {filteredCollectibles.length === 0 ? (
          <p className="text-center text-gray-500 my-8">No collectibles found matching your search.</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredCollectibles.map((collectible) => (
              <Card
                key={collectible.id}
                className="overflow-hidden hover:shadow-xl transition-shadow duration-300 flex flex-col"
              >
                <CardContent className="flex pt-5 w-full h-full justify-center flex-col">
                  <div className=" relative">
                    {collectible.primary_media_type === "video" ? (
                      <video
                        src={collectible.primary_image_url}
                        className="object-contain w-full h-full object-center items-center"
                        autoPlay
                        loop
                        muted
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
                        width={300}
                        height={300}
                        src={collectible.primary_image_url}
                        alt={collectible.name}
                        className="object-contain w-full h-full object-center items-center"
                      />
                    )}
                  </div>
                  <div className="p-4">
                    <h3 className="text-xl font-semibold mb-2 text-gray-900">
                      {collectible.name}
                    </h3>
                    <p className="text-sm text-gray-600 mb-4">
                      {collectible.description}
                    </p>
                    <div className="flex justify-between items-center mb-4">
                      <div className="flex flex-wrap gap-2">
                        <Badge
                          variant="secondary"
                          className="text-xs font-semibold"
                        >
                          {collectible.quantity_type === "limited"
                            ? `Limited (${collectible.quantity})`
                            : collectible.quantity_type === "single"
                              ? "1 of 1"
                              : "Open Edition"}
                        </Badge>
                        <Badge
                          variant="secondary"
                          className="text-xs font-semibold"
                        >
                          {collectible.is_light_version === true
                            ? "Light"
                            : "Standard"}
                        </Badge>
                        <Badge
                          variant="secondary"
                          className="text-xs font-semibold"
                        >
                          {collectible.is_irls === true
                            ? "IRLS"
                            : "StreetMint"}
                        </Badge>
                        <Badge
                          variant="secondary"
                          className="text-xs font-semibold"
                        >
                          {collectible.batch_listing_id !== null
                            ? "Batch Listing"
                            : "No Batch Listing"}
                        </Badge>
                      </div>
                      <span className="text-lg font-bold text-gray-900">
                        {collectible.price_usd > 0
                          ? `$${collectible.price_usd}`
                          : "Free"}
                      </span>
                    </div>
                    <div className="flex justify-between items-center mb-4"></div>
                    {collectible.gallery_urls &&
                      collectible.gallery_urls.length > 0 && (
                        <div className="mb-4">
                          <h4 className="text-sm font-semibold text-gray-700 mb-2">
                            {collectible.gallery_name ?? "Gallery"}
                          </h4>
                          <div className="flex space-x-2">
                            {collectible.gallery_urls.map((url, index) => (
                              <div
                                key={index}
                                className="w-16 h-16 relative rounded-md overflow-hidden"
                              >
                                <Image
                                  src={url}
                                  alt={`Gallery image ${index + 1}`}
                                  layout="fill"
                                  objectFit="cover"
                                />
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    <div className="space-y-2 mt-4">
                      <div className="flex items-center text-sm text-blue-600">
                        <MapPin className="mr-2 h-4 w-4" />
                        <a
                          href={collectible.location ?? ""}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          {(collectible.location && "View Location") ||
                            "Location not specified"}
                        </a>
                      </div>
                      {collectible.location_note && (
                        <p className="text-sm text-gray-600 ml-6">
                          {collectible.location_note}
                        </p>
                      )}
                      <div className="flex items-center text-sm text-gray-600">
                        <BadgeIcon className="mr-2 h-4 w-4" />
                        <span>Collectible ID: {collectible.id}</span>
                      </div>
                      <div className="flex items-center text-sm text-gray-600">
                        <Calendar className="mr-2 h-4 w-4" />
                        <span>
                          Mint Start:{" "}
                          {TimeService.formatDate(collectible.mint_start_date)}
                        </span>
                      </div>
                      <div className="flex items-center text-sm text-gray-600">
                        <Calendar className="mr-2 h-4 w-4" />
                        <span>
                          Mint End:{" "}
                          {TimeService.formatDate(collectible.mint_end_date)}
                        </span>
                      </div>
                    </div>
                  </div>
                </CardContent>
                <div className="p-4 bg-gray-50 border-t border-gray-200">
                  <Button
                    onClick={() =>
                      router.push(
                        `/dashboard/collection/${collection.id}/edit-collectible/${collectible.id}`
                      )
                    }
                    variant="ghost"
                    className="w-full text-sm text-gray-600 hover:text-gray-900 flex items-center justify-center"
                  >
                    Edit Details
                    <ChevronRight className="ml-2 h-4 w-4" />
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default withAuth(Component);
