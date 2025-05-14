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
import MintButton from "@/components/mintButton";
import SparklesText from "@/components/magicui/sparkles-text";
import AnimatedShinyText from "@/components/magicui/animated-shiny-text";
import { cn } from "@/lib/utils";
import { useState, useEffect } from "react";
import { Earth, Stars, Clock } from "lucide-react";
import { TimeService } from "@/lib/services/timeService";
import { EditionService } from "@/lib/services/editionService";

export type MintStatus = "not-started" | "ongoing" | "ended" | "loading";

const EditionInformation = ({
  collection,
  collectible,
  remainingQuantity,
  artistWalletAddress,
  soldCount,
  isIRLSmint,
  isIRLtapped,
  x,
  n,
  e,
  adminSignatureCode,
  adminSignatureAuthenticated,
}: {
  collection: Collection;
  collectible: Collectible;
  remainingQuantity: number | null;
  artistWalletAddress: string;
  soldCount: number;
  isIRLtapped: boolean;
  isIRLSmint?: boolean;
  x: string;
  n: string;
  e: string;
  adminSignatureCode: string;
  adminSignatureAuthenticated: boolean;
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

  // Determine the effective isIRLtapped value
  const effectiveIsIRLtapped = collectible.whitelist ? true : isIRLtapped;

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
      <CardContent className="space-y-4 md:space-y-4">
        <div className="text-center md:text-left py-2 md:py-2">
          <span className="text-3xl md:text-4xl font-bold">
            {collectible.price_usd === 0
              ? "Free Collectible"
              : `$${collectible.price_usd.toFixed(2)}`}
          </span>
        </div>
        <div className="flex items-center justify-center md:justify-start space-x-2 bg-white/10 rounded-full py-3 px-4">
          <Badge
            variant="secondary"
            className={cn(
              "font-semibold rounded-xl",
              mintingStatus === "ongoing" && "bg-green-500 text-black",
              mintingStatus === "not-started" && "bg-yellow-500 text-black",
              mintingStatus === "ended" && "bg-red-500 text-black",
              mintingStatus === "loading" && "bg-gray-500 text-black"
            )}
          >
            {mintingStatus === "ongoing" && "Live"}
            {mintingStatus === "not-started" && "Upcoming"}
            {mintingStatus === "ended" && "Ended"}
            {mintingStatus === "loading" && "Loading..."}
          </Badge>
          {
            collectible.is_light_version && (
              <Badge
                variant="secondary"
                className={cn(
                  "font-semibold rounded-xl bg-gray-500 text-white",
                )}
              >
                Email Only
              </Badge>
            )
          }
          {timeLeft && (
            <>
              <Clock className="w-4 h-4" />
              <span className="text-sm font-medium">
                {mintingStatus === "not-started"
                  ? `Starts in: ${timeLeft}`
                  : `${timeLeft} left`}
              </span>
            </>
          )}
        </div>
      </CardContent>
      <CardFooter className="w-full flex flex-col md:items-center space-y-6 md:space-y-6">
        <div className="w-full">
          <MintButton
            x={x}
            n={n}
            e={e}
            adminSignatureCode={adminSignatureCode}
            adminSignatureAuthenticated={adminSignatureAuthenticated}
            isIRLtapped={
              process.env.NEXT_PUBLIC_NODE_ENV === "development"
                ? true
                : effectiveIsIRLtapped
            }
            artistWalletAddress={artistWalletAddress}
            collectible={{
              ...collectible,
              quantity_type: collectible.quantity_type as QuantityType,
            }}
            collection={{
              ...collection,
            }}
            mintStatus={mintingStatus}
          />
        </div>
        <div className="text-center text-sm font-semibold">
          ONLY AVAILABLE IRL
        </div>
        {!collectible.is_light_version && (
          <div className="text-center md:text-right text-sm">
            <AnimatedShinyText className="inline-flex w-fit items-center justify-center px-2 md:px-4 py-1 transition ease-out text-white hover:text-neutral-600 hover:duration-300 hover:dark:text-neutral-400">
              <span>✨ Gasless Mint</span>
            </AnimatedShinyText>
          </div>
        )}
      </CardFooter>
    </Card>
  );
};

export default EditionInformation;
