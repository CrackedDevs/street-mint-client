"use client";
import Image from "next/image";
import { Clock, MapPin } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import DotPattern from "@/components/magicui/dot-pattern";
import { cn } from "@/lib/utils";
import {
  fetchAllCollectibles,
  Collectible,
  QuantityType,
} from "@/lib/supabaseClient";
import { useState, useEffect } from "react";
import { toast } from "@/hooks/use-toast";
import { EditionService } from "@/lib/services/editionService";
import LocationButton from "@/components/LocationButton";

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

export default function ArtworkList({
  collectible,
  index,
}: {
  collectible: any;
  index: number;
}) {
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

  return (
    <div key={collectible.id} className="relative z-20 bg-white">
      <Card key={collectible.id} className="border-0 shadow-none">
        <CardContent
          className={`grid md:grid-cols-2 gap-12 p-8 ${
            index % 2 === 0 ? "" : "md:grid-flow-col-dense"
          }`}
        >
          <div
            className={`relative aspect-square ${
              index % 2 === 0 ? "md:order-first" : "md:order-last"
            }`}
          >
            <Image
              src={collectible.primary_image_url || "/placeholder.svg"}
              alt={collectible.name}
              fill
              className="object-cover rounded-lg"
            />
          </div>
          <div className="flex flex-col justify-between">
            <div className="space-y-6">
              <div className="flex items-center gap-4">
                <Image
                  src={collectible.artist.avatar_url || ""}
                  alt={collectible.artist.username}
                  width={48}
                  height={48}
                  className="rounded-full"
                />
                <span className="font-medium text-lg">
                  {collectible.artist.username}
                </span>
              </div>

              <div>
                <div className="flex gap-2 mb-4">
                  <Badge
                    key={index}
                    variant="outline"
                    className="text-sm font-normal"
                  >
                    {EditionService.getEditionTypeText(
                      collectible.quantity_type as QuantityType
                    )}
                  </Badge>
                </div>
                <h2 className="text-5xl font-bold mb-6">{collectible.name}</h2>
              </div>

              <div className="space-y-6">
                {collectible.price_usd === 0 ? (
                  <Badge variant="secondary" className="w-fit text-base">
                    Free Claim Available
                  </Badge>
                ) : (
                  <div className="flex justify-between items-center text-lg">
                    <span className="text-muted-foreground">Price</span>
                    <span className="font-bold">{collectible.price_usd}</span>
                  </div>
                )}

                {/* <div className="flex items-center gap-2 text-base text-muted-foreground">
                  <MapPin className="w-5 h-5" />
                  <span>{collectible.location}</span>
                </div> */}

                <LocationButton location={collectible.location} />

                <div className="text-base text-muted-foreground">
                  Location hint: {collectible.location_note}
                </div>

                {/* <div className="flex items-center gap-2 text-base">
                        <Clock className="w-5 h-5" />
                        <span className="font-medium">
                          {artwork.status === "upcoming" && "Goes live in "}
                          {artwork.status === "live" && "Live now - "}
                          {artwork.status === "ending" && "Ending in "}
                          {formatTimeRemaining(artwork.timeRemaining)}
                        </span>
                      </div> */}
              </div>
            </div>

            <div className="mt-8">
              <Button className="w-full text-xl py-8" size="lg">
                More Info
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
