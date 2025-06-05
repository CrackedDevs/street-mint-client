"use client";

import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, Search } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { getCollectiblesForStampbook } from "@/lib/supabaseClient";
import { Tables } from "@/lib/types/database.types";
import Image from "next/image";

type Collectible = Tables<"collectibles"> & {
  collections: {
    name: string;
    artist: number;
    artist_details?: {
      username: string;
    } | null;
  } | null;
};

interface CollectibleSelectorProps {
  artistId: number;
  selectedCollectibles: number[];
  onCollectiblesChange: (collectibles: number[]) => void;
}

export function CollectibleSelector({
  artistId,
  selectedCollectibles,
  onCollectiblesChange,
}: CollectibleSelectorProps) {
  const { toast } = useToast();
  const [availableCollectibles, setAvailableCollectibles] = useState<Collectible[]>([]);
  const [isLoadingCollectibles, setIsLoadingCollectibles] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    async function fetchCollectibles() {
      if (!artistId) return;
      
      setIsLoadingCollectibles(true);
      try {
        const { collectibles, error } = await getCollectiblesForStampbook();

        if (error) throw error;
        setAvailableCollectibles(collectibles || []);
      } catch (error) {
        console.error("Error fetching collectibles:", error);
        toast({
          title: "Error",
          description: "Failed to fetch collectibles",
          variant: "destructive",
        });
      } finally {
        setIsLoadingCollectibles(false);
      }
    }

    fetchCollectibles();
  }, [artistId, toast]);

  const filteredCollectibles = availableCollectibles.filter((collectible) => {
    const searchLower = searchQuery.toLowerCase();
    const idMatch = collectible.id.toString().includes(searchLower);
    const nameMatch = collectible.name.toLowerCase().includes(searchLower);
    const artistMatch = collectible.collections?.artist_details?.username?.toLowerCase().includes(searchLower) || false;
    return idMatch || nameMatch || artistMatch;
  });

  const handleCollectibleToggle = (collectibleId: number) => {
    const newCollectibles = selectedCollectibles.includes(collectibleId)
      ? selectedCollectibles.filter((id) => id !== collectibleId)
      : [...selectedCollectibles, collectibleId];
    
    onCollectiblesChange(newCollectibles);
  };

  return (
    <div className="space-y-2">
      <Label className="text-lg font-semibold">
        Select Collectibles <span className="text-destructive">*</span>
      </Label>
      <div className="space-y-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 h-4 w-4" />
          <Input
            type="text"
            placeholder="Search by ID, name, or artist..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        {isLoadingCollectibles ? (
          <div className="flex justify-center p-4">
            <Loader2 className="h-6 w-6 animate-spin" />
          </div>
        ) : (
          <div className="grid gap-2 p-4 border rounded-lg max-h-[500px] overflow-y-auto">
            {filteredCollectibles.length === 0 ? (
              <div className="text-center text-gray-500 py-4">
                No collectibles found
              </div>
            ) : (
              filteredCollectibles.map((collectible) => (
                <label
                  key={collectible.id}
                  className="flex items-center space-x-3 p-3 hover:bg-gray-100 rounded cursor-pointer"
                >
                  <input
                    type="checkbox"
                    checked={selectedCollectibles.includes(collectible.id)}
                    onChange={() => handleCollectibleToggle(collectible.id)}
                    className="rounded border-gray-300 h-5 w-5"
                  />
                  <div className="flex items-center flex-1 space-x-4">
                    <div className="flex items-center space-x-2">
                      {collectible.primary_image_url && (
                        <>
                          {collectible.primary_media_type === "video" ? (
                            <video
                              src={collectible.primary_image_url}
                              width={48}
                              height={48}
                              className="h-12 w-12 rounded-md object-cover"
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
                              className="h-12 w-48"
                            />
                          ) : (
                            <Image
                              src={collectible.primary_image_url}
                              alt={collectible.name}
                              width={48}
                              height={48}
                              className="h-12 w-12 rounded-md object-cover"
                            />
                          )}
                        </>
                      )}
                    </div>
                    <div>
                      <div className="font-medium text-lg">
                        {collectible.name}
                      </div>
                      <div className="text-sm text-gray-500 mt-1">
                        ID: {collectible.id} • Artist: {collectible.collections?.artist_details?.username || "Unknown"}
                      </div>
                    </div>
                  </div>
                </label>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
} 