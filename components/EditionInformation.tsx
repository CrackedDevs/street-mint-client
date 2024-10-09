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
import { Earth, Stars } from "lucide-react";
import { TimeService } from "@/lib/services/timeService";
import { EditionService } from "@/lib/services/editionService";

const EditionInformation = ({
  collection,
  collectible,
  remainingQuantity,
  artistWalletAddress,
  soldCount,
  isIRLSmint,
  isIRLtapped,
  randomNumber,
}: {
  collection: Collection;
  collectible: Collectible;
  remainingQuantity: number | null;
  artistWalletAddress: string;
  soldCount: number;
  isIRLtapped: boolean;
  isIRLSmint?: boolean;
  randomNumber: string | null;
}) => {
  const [mintingStatus, setMintingStatus] = useState<
    "not-started" | "ongoing" | "ended"
  >("not-started");
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

  // Determine the effective isIRLtapped value
  const effectiveIsIRLtapped = collectible.whitelist ? true : isIRLtapped;

  return (
    <div>
      <Card className="bg-black mx-auto text-white my-2">
        <CardHeader className="space-y-3 flex justify-between">
          <div className="flex justify-between items-center w-full">
            <div className="flex justify-between items-center">
              <Badge
                variant="secondary"
                className="text-black text-md md:text-lg"
              >
                {EditionService.getEditionTypeText(
                  collectible.quantity_type as QuantityType
                )}
              </Badge>
              <span className="md:text-2xl text-md ml-2 font-bold">
                {collectible.quantity_type === QuantityType.Limited &&
                  remainingQuantity !== null && (
                    <span>
                      {remainingQuantity} of {collectible.quantity}
                    </span>
                  )}
              </span>
            </div>
            <div
              className={cn(
                "group rounded-full border border-black/5 bg-neutral-100 text-base text-white transition-all ease-in hover:cursor-pointer hover:bg-neutral-200 dark:border-white/5 dark:bg-neutral-900 dark:hover:bg-neutral-800 w-fit"
              )}
            >
              <AnimatedShinyText className="inline-flex w-fit items-center justify-center px-2 md:px-4 py-1 transition ease-out hover:text-neutral-600 hover:duration-300 hover:dark:text-neutral-400">
                <span>✨ Gasless Mint</span>
              </AnimatedShinyText>
            </div>
          </div>
          <CardTitle className="text-3xl font-extrabold">
            {collectible.name}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 gap-10">
          <div className="flex justify-between gap-10 flex-col items-baseline">
            <div className="flex w-full justify-center items-center">
              <SparklesText
                className="text-5xl font-bold"
                sparklesCount={5}
                text={`${
                  collectible.price_usd === 0
                    ? "Free Mint"
                    : `$${collectible.price_usd.toFixed(2)}`
                }`}
              />
            </div>
            <div className="flex  flex-row w-full justify-between">
              <div>
                {soldCount > 0 && (
                  <span className="text-white text-lg">
                    Minted: {soldCount}
                  </span>
                )}
              </div>
              <Badge variant="secondary" className="text-black text-sm">
                EXCLUSIVE IRL MINT <Earth className="ml-2" />
              </Badge>
            </div>
          </div>

          {/* Minting Status and Time Left */}
          <div className="flex flex-row justify-between items-center space-y-2">
            {mintingStatus === "ongoing" && (
              <Badge variant="secondary" className="text-black text-md">
                Live <Stars className="ml-2" />
              </Badge>
            )}
            {mintingStatus === "not-started" && (
              <Badge variant="secondary" className="text-black text-md">
                Upcoming <Stars className="ml-2" />
              </Badge>
            )}
            {mintingStatus === "ended" && (
              <Badge variant="secondary" className="text-black text-md">
                Ended <Stars className="ml-2" />
              </Badge>
            )}
            {timeLeft && (
              <div className="text-lg font-semibold">
                {mintingStatus === "not-started"
                  ? `Starts in: ${timeLeft}`
                  : `${timeLeft} left`}
              </div>
            )}
          </div>

          {/* Render MintButton only if minting has started */}

          <MintButton
            randomNumber={randomNumber}
            isIRLtapped={
              process.env.NODE_ENV === "development"
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
        </CardContent>
        <CardFooter>
          {isIRLSmint ? (
            <p className="text-sm text-gray-300">
              Locate the IRLS Mint station, tap it with your phone to claim your
              digital collectible.
            </p>
          ) : (
            <p className="text-sm text-gray-300">
              Locate the Street Mint station, tap it with your phone to claim
              your digital collectible.
            </p>
          )}
        </CardFooter>
      </Card>
    </div>
  );
};

export default EditionInformation;
