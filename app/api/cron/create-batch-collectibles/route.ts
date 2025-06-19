import { getSupabaseAdmin } from "@/lib/supabaseAdminClient";
import {
  Collectible,
  LabelFormat,
  QuantityType,
  uploadFileToPinata,
} from "@/lib/supabaseClient";
import { NumericUUID } from "@/lib/utils";
import { NextRequest, NextResponse } from "next/server";
import { createCollectible } from "@/lib/supabaseAdminClient";
import { generateLabeledImageFile } from "@/lib/generateCollectibleImage";

// 0: Sunday
// 1: Monday
// 2: Tuesday
// 3: Wednesday
// 4: Thursday
// 5: Friday
// 6: Saturday

export async function GET(request: NextRequest) {
  try {
    const supabaseAdmin = await getSupabaseAdmin();

    const currentDate = new Date();

    const { data: batchListings, error: fetchError } = await supabaseAdmin
      .from("batch_listings")
      .select("*")
      .lte("batch_start_date", currentDate.toISOString())
      .gte("batch_end_date", currentDate.toISOString())
      .eq("id", 5787604996);

    if (fetchError) {
      console.error("Error fetching batch listings:", fetchError);
      return NextResponse.json(
        { error: "Failed to fetch batch listings" },
        { status: 500 }
      );
    }

    if (!batchListings || batchListings.length === 0) {
      return NextResponse.json(
        { message: "No batch listings to process" },
        { status: 200 }
      );
    }

    const now = new Date();
    // const currentUTCHour = now.getUTCHours();
    const currentUTCHour = 2;
    const currentDayOfWeek = now.getUTCDay(); // 0-6, where 0 is Sunday
    const currentDayOfMonth = now.getUTCDate(); // 1-31

    console.log("currentUTCHour", currentUTCHour);
    console.log("currentDayOfWeek", currentDayOfWeek);
    console.log("currentDayOfMonth", currentDayOfMonth);
    console.log("currentDate", currentDate);

    const processedListings = [];

    for (const listing of batchListings) {
      // Check if the current hour matches the batch hour
      if (listing.batch_hour !== currentUTCHour) {
        continue;
      }

      // Check frequency type and days
      const frequencyType = listing.frequency_type || "daily";
      const frequencyDays = Array.isArray(listing.frequency_days)
        ? listing.frequency_days
        : [];
      console.log("frequencyDays", frequencyDays);

      // Skip if not scheduled for today based on frequency type
      if (
        frequencyType === "weekly" &&
        !frequencyDays.includes(currentDayOfWeek)
      ) {
        continue;
      }

      if (
        frequencyType === "monthly" &&
        !frequencyDays.includes(currentDayOfMonth)
      ) {
        continue;
      }

      // For daily, we always continue (no specific day check needed)

      // Create mint start time (current day at batch hour)
      const mintStart = new Date(
        Date.UTC(
          now.getUTCFullYear(),
          now.getUTCMonth(),
          now.getUTCDate(),
          listing.batch_hour,
          0,
          0,
          0
        )
      );

      // Calculate mint end time based on frequency type
      let mintEnd;

      if (frequencyType === "daily") {
        // For daily, end just before the next day's batch
        mintEnd = new Date(mintStart.getTime() + (23 * 60 + 59) * 60 * 1000);
      } else if (frequencyType === "weekly") {
        if (listing.always_active) {
          // For weekly with always_active true, find the next scheduled day
          // Convert frequencyDays to number array for proper sorting and comparison
          const numericDays = frequencyDays
            .map((day) => Number(day))
            .filter((day) => !isNaN(day));
          const sortedDays = [...numericDays].sort((a, b) => a - b);
          let nextDay = sortedDays.find((day) => day > currentDayOfWeek);

          // If no next day found, get the first day of next week
          if (nextDay === undefined) {
            nextDay = sortedDays[0];
            // Calculate days until next occurrence (days until next week + the selected day)
            const daysUntilNext = 7 - currentDayOfWeek + nextDay;

            // End time is just before the next scheduled batch
            mintEnd = new Date(
              Date.UTC(
                now.getUTCFullYear(),
                now.getUTCMonth(),
                now.getUTCDate() + daysUntilNext,
                listing.batch_hour,
                0,
                0,
                0
              )
            );
            // Subtract 1 minute to make it end just before
            mintEnd.setMinutes(mintEnd.getMinutes() - 1);
          } else {
            // Calculate days until next occurrence
            const daysUntilNext = nextDay - currentDayOfWeek;

            // End time is just before the next scheduled batch
            mintEnd = new Date(
              Date.UTC(
                now.getUTCFullYear(),
                now.getUTCMonth(),
                now.getUTCDate() + daysUntilNext,
                listing.batch_hour,
                0,
                0,
                0
              )
            );
            // Subtract 1 minute to make it end just before
            mintEnd.setMinutes(mintEnd.getMinutes() - 1);
          }
        } else {
          // If always_active is false, set mintEnd to 23 hours and 59 minutes after mintStart
          mintEnd = new Date(mintStart.getTime() + (23 * 60 + 59) * 60 * 1000);
        }
      } else if (frequencyType === "monthly") {
        if (listing.always_active) {
          // For monthly with always_active true, find the next scheduled day
          // Convert frequencyDays to number array for proper sorting and comparison
          const numericDays = frequencyDays
            .map((day) => Number(day))
            .filter((day) => !isNaN(day));
          const sortedDays = [...numericDays].sort((a, b) => a - b);
          let nextDay = sortedDays.find((day) => day > currentDayOfMonth);

          // If no next day found, get the first day of next month
          if (nextDay === undefined) {
            nextDay = sortedDays[0];
            // Move to next month, on the selected day
            mintEnd = new Date(
              Date.UTC(
                now.getUTCFullYear(),
                now.getUTCMonth() + 1,
                nextDay,
                listing.batch_hour,
                0,
                0,
                0
              )
            );
            // Subtract 1 minute to make it end just before
            mintEnd.setMinutes(mintEnd.getMinutes() - 1);
          } else {
            // Set to next occurrence this month
            mintEnd = new Date(
              Date.UTC(
                now.getUTCFullYear(),
                now.getUTCMonth(),
                nextDay,
                listing.batch_hour,
                0,
                0,
                0
              )
            );
            // Subtract 1 minute to make it end just before
            mintEnd.setMinutes(mintEnd.getMinutes() - 1);
          }
        } else {
          // If always_active is false, set mintEnd to 23 hours and 59 minutes after mintStart
          mintEnd = new Date(mintStart.getTime() + (23 * 60 + 59) * 60 * 1000);
        }
      } else {
        // Fallback to daily behavior
        mintEnd = new Date(mintStart.getTime() + (23 * 60 + 59) * 60 * 1000);
      }

      // Check if the calculated mintEnd exceeds the batch's end date
      const batchEndDate = listing.batch_end_date
        ? new Date(listing.batch_end_date)
        : null;
      if (batchEndDate && mintEnd > batchEndDate) {
        // Set mintEnd to be the batch end date at 23:59
        mintEnd = new Date(
          Date.UTC(
            batchEndDate.getUTCFullYear(),
            batchEndDate.getUTCMonth(),
            batchEndDate.getUTCDate(),
            23,
            59,
            59,
            999
          )
        );
      }

      console.log(
        `Mint period for batch ${
          listing.id
        }: ${mintStart.toISOString()} to ${mintEnd.toISOString()}`
      );

      // TODO: Dynamically add date or day number
      const day_number = listing.total_collectibles
        ? listing.total_collectibles + 1
        : 1;

      let primary_image_url = listing.primary_image_url;

      if (
        listing.label_format === LabelFormat.Date ||
        listing.label_format === LabelFormat.Day
      ) {
        let caption;
        if (listing.label_format === LabelFormat.Date) {
          caption = now.toLocaleDateString("en-GB", {
            day: "2-digit",
            month: "2-digit",
            year: "numeric",
          });
        } else {
          caption = `Day ${day_number}`;
        }

        const collectible_image = await generateLabeledImageFile({
          imageURL: listing.primary_image_url,
          caption,
          x: listing.label_position_x,
          y: listing.label_position_y,
          displayWidth: listing.display_width,
          displayHeight: listing.display_height,
          labelTextColor: listing.label_text_color,
          labelSize: listing.label_size ?? 16,
          labelOnOutside: false,
        });

        console.log("collectible_image", collectible_image);

        if (!collectible_image) {
          return NextResponse.json(
            { error: "Failed to generate collectible image" },
            { status: 500 }
          );
        }
        const dynamic_image_url = await uploadFileToPinata(collectible_image);

        if (dynamic_image_url && dynamic_image_url !== null) {
          primary_image_url = dynamic_image_url;
        }
      }

      if (!primary_image_url || primary_image_url === null) {
        return NextResponse.json(
          { error: "Failed to upload collectible image to Pinata" },
          { status: 500 }
        );
      }

      const collectible: Collectible = {
        id: listing.id,
        name: listing.collectible_name,
        description: listing.collectible_description,
        primary_image_url: primary_image_url,
        quantity_type: listing.quantity_type as QuantityType,
        quantity: listing.quantity,
        creator_royalty_array:
          (listing.creator_royalty_array as
            | {
                creator_wallet_address: string;
                royalty_percentage: number;
                name: string;
              }[]
            | null) ?? null,
        price_usd: listing.price_usd,
        location: listing.location,
        location_note: listing.location_note,
        gallery_urls: listing.gallery_urls,
        metadata_uri: listing.metadata_uri,
        nfc_public_key: listing.nfc_public_key,
        mint_start_date: mintStart.toISOString(),
        mint_end_date: mintEnd.toISOString(),
        airdrop_eligibility_index: listing.airdrop_eligibility_index,
        whitelist: listing.whitelist ? true : false,
        collection_id: listing.collection_id,
        cta_enable: listing.cta_enable ? true : false,
        cta_title: listing.cta_title,
        cta_description: listing.cta_description,
        cta_logo_url: listing.cta_logo_url,
        cta_text: listing.cta_text,
        cta_link: listing.cta_link,
        cta_image_url: listing.cta_image_url,
        cta_has_email_capture: listing.cta_has_email_capture ? true : false,
        cta_has_text_capture: listing.cta_has_text_capture ? true : false,
        cta_email_list: listing.cta_email_list as { [key: string]: string }[],
        cta_text_list: listing.cta_text_list as { [key: string]: string }[],
        enable_card_payments: listing.enable_card_payments ? true : false,
        only_card_payment: listing.only_card_payment ? true : false,
        stripe_price_id: listing.stripe_price_id ?? undefined,
        is_irls: listing.is_irls ? true : false,
        is_light_version: listing.is_light_version ? true : false,
        sponsor_id: listing.sponsor_id ?? null,
        primary_media_type: listing.primary_media_type,
        custom_email: listing.custom_email ? true : false,
        custom_email_subject: listing.custom_email_subject || null,
        custom_email_body: listing.custom_email_body || null,
        gallery_name: listing.gallery_name,
        batch_listing_id: listing.id,
        day_number,
      };

      const collectibleToInsert: Collectible & { collection_id: number } = {
        ...collectible,
        id: NumericUUID(),
        mint_start_date: mintStart.toISOString(),
        mint_end_date: mintEnd.toISOString(),
        collection_id: listing.collection_id,
      };

      try {
        const newCollectible = await createCollectible(
          collectibleToInsert,
          listing.collection_id
        );

        if (!newCollectible) {
          console.error(
            "Error creating collectible for batch listing:",
            listing.id
          );
          continue;
        }

        // Log the frequency information for debugging
        console.log(`Created collectible for batch listing ${listing.id}:
          Frequency Type: ${frequencyType}
          Current Day of Week: ${currentDayOfWeek}
          Current Day of Month: ${currentDayOfMonth}
          Selected Days: ${JSON.stringify(frequencyDays)}
          Mint Start: ${mintStart.toISOString()}
          Mint End: ${mintEnd.toISOString()}
        `);

        const { data: chipLinks, error: chipLinksError } = await supabaseAdmin
          .from("chip_links")
          .select("id")
          .eq("batch_listing_id", listing.id);

        if (chipLinksError) {
          console.error(`Error fetching chip links:`, chipLinksError);
        }

        if (chipLinks && Array.isArray(chipLinks) && chipLinks.length > 0) {
          const { error: chipError } = await supabaseAdmin
            .from("chip_links")
            .update({ collectible_id: newCollectible?.id })
            .in(
              "id",
              chipLinks.map((chip) => chip.id)
            )
            .select();

          if (chipError) {
            console.error(`Error updating chip links:`, chipError);
          }
        }

        const { error: updateBatchListingError } = await supabaseAdmin
          .from("batch_listings")
          .update({ total_collectibles: listing.total_collectibles + 1 || 1 })
          .eq("id", listing.id)
          .select();

        if (updateBatchListingError) {
          console.error(
            "Error updating batch listing:",
            updateBatchListingError
          );
          continue;
        }

        processedListings.push({
          batch_listing_id: listing.id,
          collectible_id: newCollectible.id,
          frequency_type: frequencyType,
          mint_start: mintStart.toISOString(),
          mint_end: mintEnd.toISOString(),
        });
      } catch (error) {
        console.error(`Error processing batch listing ${listing.id}:`, error);
      }
    }

    return NextResponse.json(
      {
        message: `Processed ${processedListings.length} batch listings`,
        processed_listings: processedListings,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error in GET /api/cron/create-batch-collectibles:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
