"use client";
import Image from "next/image";
import { ChevronRight, Clock, Earth, MapPin } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { QuantityType } from "@/lib/supabaseClient";
import { useState, useEffect } from "react";
import { EditionService } from "@/lib/services/editionService";
import BlackLocationButton from "@/components/BlackLocationButton";
import { TimeService } from "@/lib/services/timeService";
import Link from "next/link";

export type MintStatus = "not-started" | "ongoing" | "ended" | "loading";

export default function CollectibleMegaCard({
  collectible,
  index,
}: {
  collectible: any;
  index: number;
}) {
  const isIrlsDomain =
    typeof window !== "undefined" &&
    window.location.hostname === "www.irls.xyz";
  console.log(
    "isIrlsDomain",
    typeof window !== "undefined" && window.location.hostname
  );
  const BRAND_NAME = isIrlsDomain ? "IRLS" : "Street Mint";

  const [mintingStatus, setMintingStatus] = useState<MintStatus>("loading");
  const [timeLeft, setTimeLeft] = useState<string>("");

  useEffect(() => {
    const updateMintingStatus = () => {
      const DateTime = new Date();
      const now = DateTime.getTime();
      if (!collectible.mint_start_date || !collectible.mint_end_date) {
        setMintingStatus("ongoing");
        return;
      }
      // Convert mint start and end dates to UTC
      const startDateUTC = new Date(collectible.mint_start_date).getTime();
      const endDateUTC = new Date(collectible.mint_end_date).getTime();

      if (now < startDateUTC) {
        setMintingStatus("not-started");
        const timeToStart = startDateUTC - now;
        setTimeLeft(TimeService.formatTimeLeft(timeToStart));
      } else if (now >= startDateUTC && now <= endDateUTC) {
        setMintingStatus("ongoing");
        const timeToEnd = endDateUTC - now;
        setTimeLeft(TimeService.formatTimeLeft(timeToEnd));
      } else {
        setMintingStatus("ended");
        setTimeLeft("");
      }
    };
    updateMintingStatus();
    const interval = setInterval(updateMintingStatus, 1000);

    return () => clearInterval(interval);
  }, [collectible.mint_start_date, collectible.mint_end_date]);

  return (
    <div key={collectible.id} className="relative z-20 bg-white border-black">
      <Card key={collectible.id} className="border-black shadow-none p-1">
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
          <div className="flex flex-col justify-between mt-1">
            <div className="space-y-8">
              <div className="flex items-center gap-4">
                {collectible.artist.avatar_url && (
                  <div>
                    <Image
                      src={collectible.artist.avatar_url || ""}
                      alt={collectible.artist.username}
                      width={48}
                      height={48}
                      className="rounded-full"
                    />
                  </div>
                )}
                <span className="text-xl font-semibold">
                  {collectible.artist.username}
                </span>
              </div>

              <div className="flex flex-col gap-8">
                <div className="flex gap-2">
                  <Badge
                    key={index}
                    variant="outline"
                    className="text-md font-normal border-black rounded-full"
                  >
                    {EditionService.getEditionTypeText(
                      collectible.quantity_type as QuantityType
                    )}
                  </Badge>
                  <Badge
                    variant="outline"
                    className="text-md font-normal border-black rounded-full"
                  >
                    Exlusive IRL Mint <Earth className="ml-2 w-4 h-4" />
                  </Badge>
                </div>
                <h2 className="text-5xl font-bold">{collectible.name}</h2>
              </div>

              <div className="space-y-6 pt-2">
                {collectible.price_usd === 0 ? (
                  <Badge variant="secondary" className="w-fit text-base">
                    Free Claim Available
                  </Badge>
                ) : (
                  <div className="flex justify-between items-center text-lg">
                    <span className="text-muted-foreground text-4xl font-semibold">
                      ${collectible.price_usd}
                    </span>
                  </div>
                )}

                <div className="pt-4 pb-2">
                  <BlackLocationButton location={collectible.location} />
                </div>

                <div className="text-base text-muted-foreground text-lg">
                  {collectible.location_note}
                </div>

                <div className="flex items-center gap-2 text-base cursor-default pt-3 pb-6">
                  <Clock className="w-7 h-7 mr-2" />
                  <Badge
                    variant="secondary"
                    className={cn(
                      "font-semibold rounded-2xl py-2 px-6 text-lg",
                      mintingStatus === "ongoing" && "bg-green-500 text-black",
                      mintingStatus === "not-started" &&
                        "bg-yellow-500 text-black",
                      mintingStatus === "ended" && "bg-red-500 text-black",
                      mintingStatus === "loading" && "bg-gray-500 text-black"
                    )}
                  >
                    {mintingStatus === "ongoing" ? (
                      timeLeft ? (
                        <div>
                          <span className="text-lg font-medium">
                            {timeLeft} left
                          </span>
                        </div>
                      ) : (
                        "Live"
                      )
                    ) : (
                      <></>
                    )}
                    {mintingStatus === "not-started" ? (
                      timeLeft ? (
                        <div>
                          <span className="text-lg font-medium">
                            Starts in: ${timeLeft}
                          </span>
                        </div>
                      ) : (
                        "Upcoming"
                      )
                    ) : (
                      <></>
                    )}
                    {mintingStatus === "ended" && "Ended"}
                    {mintingStatus === "loading" && "Loading..."}
                  </Badge>
                </div>
              </div>
            </div>

            <div>
              <Link href={`/mint/${collectible.id}`}>
                <Button className="w-full text-xl py-8 rounded-lg" size="lg">
                  More Info
                  <ChevronRight className="ml-2 h-6 w-6" />
                </Button>
              </Link>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
