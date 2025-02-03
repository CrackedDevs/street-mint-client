"use client";
import Image from "next/image";
import { ChevronRight, Clock, Earth, MapPin } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { QuantityType, CollectibleDetailed } from "@/lib/supabaseClient";
import { useState, useEffect } from "react";
import { EditionService } from "@/lib/services/editionService";
import { TimeService } from "@/lib/services/timeService";
import Link from "next/link";

export type MintStatus = "not-started" | "ongoing" | "ended" | "loading";

export default function CollectibleMegaCard({
  collectible,
  index,
}: {
  collectible: CollectibleDetailed;
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
          className={`grid md:grid-cols-2 gap-6 md:gap-12 p-4 md:p-8 ${
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
            <div className="space-y-4 md:space-y-8">
              <div className="flex items-center gap-3">
                {collectible.artist.avatar_url && (
                  <div>
                    <Image
                      src={collectible.artist.avatar_url || ""}
                      alt={collectible.artist.username}
                      width={44}
                      height={44}
                      className="rounded-full"
                    />
                  </div>
                )}
                <span className="text-lg md:text-xl font-semibold">
                  {collectible.artist.username}
                </span>
              </div>

              <div className="flex flex-col gap-4 md:gap-8">
                <div className="flex flex-wrap gap-2">
                  <Badge
                    key={index}
                    variant="outline"
                    className="text-sm font-normal border-black rounded-full"
                  >
                    {EditionService.getEditionTypeText(
                      collectible.quantity_type as QuantityType
                    )}
                  </Badge>
                  <Badge
                    variant="outline"
                    className="text-sm font-normal border-black rounded-full"
                  >
                    Exlusive IRL Mint <Earth className="ml-2 w-4 h-4" />
                  </Badge>
                </div>
              </div>

              <div>
                <h3 className="text-3xl md:text-4xl font-bold">
                  {collectible.name}
                </h3>
              </div>

              <div className="space-y-4 md:space-y-5">
                <div className="">
                  {collectible.price_usd === 0 ? (
                    <Badge
                      variant="secondary"
                      className="w-fit text-sm md:text-base text-green-700"
                    >
                      Free Claim Available
                    </Badge>
                  ) : (
                    <div className="flex justify-between items-center">
                      <span className="text-muted-foreground text-2xl md:text-4xl font-semibold">
                        ${collectible.price_usd}
                      </span>
                    </div>
                  )}
                </div>

                <div className="text-sm md:text-lg text-muted-foreground">
                  {collectible.location_note}
                </div>

                <div className="flex items-center gap-2 cursor-default">
                  <Badge
                    variant="secondary"
                    className={cn(
                      "font-semibold rounded-2xl py-1 md:py-1.5 px-3 md:px-5 text-base md:text-sm",
                      mintingStatus === "ongoing" && "bg-green-400 text-black",
                      mintingStatus === "not-started" &&
                        "bg-yellow-400 text-black",
                      mintingStatus === "ended" && "bg-red-400 text-black",
                      mintingStatus === "loading" && "bg-gray-500 text-black"
                    )}
                  >
                    <Clock className="w-4 h-4 md:w-5 md:h-5 mr-2 md:mr-3" />
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

            <div className="py-5">
              <p className="text-sm md:text-md text-muted-foreground">
                {collectible.description.length > 490
                  ? `${collectible.description.substring(0, 490)}...`
                  : collectible.description}
              </p>
            </div>

            <div className="w-full flex flex-col sm:flex-row items-center gap-4">
              {collectible.location && (
                <Link href={collectible.location} className="w-full sm:w-auto">
                  <Button
                    variant="destructive"
                    className="w-full text-base md:text-lg py-6 md:py-7 px-4 md:px-6 bg-white border-gray-300 hover:bg-gray-300 text-gray-700 border-2 rounded-lg whitespace-nowrap"
                  >
                    <MapPin className="w-4 h-4 md:w-5 md:h-5 mr-2" />
                    View Location
                  </Button>
                </Link>
              )}

              <Link href={`/mint/${collectible.id}`} className="w-full">
                <Button
                  className="w-full text-lg md:text-xl py-7 md:py-7 rounded-lg"
                  size="lg"
                >
                  More Info
                  <ChevronRight className="ml-2 h-5 w-5 md:h-6 md:w-6" />
                </Button>
              </Link>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
