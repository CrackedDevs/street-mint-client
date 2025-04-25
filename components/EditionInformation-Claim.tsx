"use client";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Collectible, Collection, QuantityType } from "@/lib/supabaseClient";
import AnimatedShinyText from "@/components/magicui/animated-shiny-text";
import { cn } from "@/lib/utils";
import { useState, useEffect } from "react";
import { Earth, Stars, Clock } from "lucide-react";
import { TimeService } from "@/lib/services/timeService";
import { EditionService } from "@/lib/services/editionService";
import MintButtonClaim from "@/components/mintButtonClaim";
import { LightOrder } from "@/lib/supabaseAdminClient";

export type MintStatus = "not-started" | "ongoing" | "ended" | "loading";

const EditionInformationClaim = ({
  collection,
  collectible,
  remainingQuantity,
  artistWalletAddress,
  soldCount,
  lightOrder,
  signatureCode,
}: {
  collection: Collection;
  collectible: Collectible;
  remainingQuantity: number | null;
  artistWalletAddress: string;
  soldCount: number;
  lightOrder: LightOrder;
  signatureCode: string;
}) => {
  const [mintingStatus, setMintingStatus] = useState<MintStatus>("loading");
  const [timeLeft, setTimeLeft] = useState<string>("");

  useEffect(() => {
    const updateMintingStatus = () => {
      const DateTime = new Date();
      const now = DateTime.getTime();

      if (!collectible.mint_start_date && !collectible.mint_end_date) {
        setMintingStatus("ongoing");
        return;
      }

      if (collectible.mint_start_date && !collectible.mint_end_date) {
        const startDateUTC = new Date(collectible.mint_start_date).getTime();
        if (now < startDateUTC) {
          setMintingStatus("not-started");
          const timeToStart = startDateUTC - now;
          setTimeLeft(TimeService.formatTimeLeft(timeToStart));
        } else {
          setMintingStatus("ongoing");
        }
        return;
      } else if (collectible.mint_end_date && !collectible.mint_start_date) {
        const endDateUTC = new Date(collectible.mint_end_date).getTime();
        if (now > endDateUTC) {
          setMintingStatus("ended");
          setTimeLeft("");
        } else {
          setMintingStatus("ongoing");
          const timeToEnd = endDateUTC - now;
          setTimeLeft(TimeService.formatTimeLeft(timeToEnd));
        }
      }

      // Convert mint start and end dates to UTC
      const startDateUTC = new Date(collectible.mint_start_date!).getTime();
      const endDateUTC = new Date(collectible.mint_end_date!).getTime();

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
    <Card className="w-full md:max-w-[600px] bg-black text-white border border-white/10">
      <CardHeader className="space-y-1">
        <div className="flex justify-between items-center">
          <Badge
            variant="outline"
            className="border-white/20 text-white rounded-xl"
          >
            {EditionService.getEditionTypeText(
              collectible.quantity_type as QuantityType
            )}
          </Badge>
          <div className="text-sm">
            {soldCount > 0 && <span>Collected: {soldCount}</span>}
          </div>
          {collectible.quantity_type === QuantityType.Limited &&
            remainingQuantity !== null && (
              <span className="text-sm font-medium">
                {remainingQuantity} of {collectible.quantity}
              </span>
            )}
        </div>
      </CardHeader>

      <CardContent className="space-y-4 md:space-y-6">
        <div className="text-center md:text-left py-2 md:py-2">
          <span className="text-2xl md:text-3xl font-bold">
            {collectible.price_usd === 0
              ? "Free Collectible"
              : `$${collectible.price_usd.toFixed(2)}`}
          </span>
          <br />
          <span className="text-lg font-medium text-white/70">
            For {lightOrder.email}
          </span>
        </div>
      </CardContent>

      <CardFooter className="w-full flex flex-col md:items-center space-y-6 md:space-y-6">
        <div className="w-full">
          <MintButtonClaim
            artistWalletAddress={artistWalletAddress}
            collectible={{
              ...collectible,
              quantity_type: collectible.quantity_type as QuantityType,
            }}
            collection={{
              ...collection,
            }}
            mintStatus={mintingStatus}
            lightOrder={lightOrder}
            signatureCode={signatureCode}
          />
        </div>

        <div className="text-center text-sm font-semibold">
          ONLY AVAILABLE IRL
        </div>

        <div className="text-center md:text-right text-sm">
          <AnimatedShinyText className="inline-flex w-fit items-center justify-center px-2 md:px-4 py-1 transition ease-out text-white hover:text-neutral-600 hover:duration-300 hover:dark:text-neutral-400">
            <span>✨ Gasless Mint</span>
          </AnimatedShinyText>
        </div>
      </CardFooter>
    </Card>
  );
};

export default EditionInformationClaim;
