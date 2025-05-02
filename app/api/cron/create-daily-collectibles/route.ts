import { getSupabaseAdmin } from "@/lib/supabaseAdminClient";
import { Collectible, QuantityType } from "@/lib/supabaseClient";
import { NumericUUID } from "@/lib/utils";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  try {
    const supabaseAdmin = await getSupabaseAdmin();

    const { data: batchListings, error: fetchError } = await supabaseAdmin
      .from("batch_listings")
      .select("*")

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

    // Process each batch listing
    for (const listing of batchListings) {
      const now = new Date();
      const currentUTCHour = now.getUTCHours();

      if (listing.batch_hour === currentUTCHour) {
        const mintStart = new Date(Date.UTC(
          now.getUTCFullYear(),
          now.getUTCMonth(),
          now.getUTCDate(),
          listing.batch_hour,
          0,
          0,
          0
        ));

        const mintEnd = new Date(mintStart.getTime() + (23 * 60 + 59) * 60 * 1000);

        const collectible: Collectible = {
          id: listing.id,
          name: listing.collectible_name,
          description: listing.collectible_description,
          primary_image_url: listing.primary_image_url,
          quantity_type: listing.quantity_type as QuantityType,
          quantity: listing.quantity,
          creator_royalty_array: listing.creator_royalty_array as { creator_wallet_address: string; royalty_percentage: number; name: string; }[] | null ?? null,
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
          cta_enable: listing.cta_enable ? true : false,
          cta_title: listing.cta_title,
          cta_description: listing.cta_description,
          cta_logo_url: listing.cta_logo_url,
          cta_text: listing.cta_text,
          cta_link: listing.cta_link,
          cta_has_email_capture: listing.cta_has_email_capture ? true : false,
          cta_has_text_capture: listing.cta_has_text_capture ? true : false,
          cta_email_list: listing.cta_email_list as { [key: string]: string; }[],
          cta_text_list: listing.cta_text_list as { [key: string]: string; }[],
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
          day_number: listing.total_collectibles ? listing.total_collectibles + 1 : 1
        };

        const collectibleToInsert: Collectible & { collection_id: number } = {
          ...collectible,
          id: NumericUUID(),
          mint_start_date: mintStart.toISOString(),
          mint_end_date: mintEnd.toISOString(),
          collection_id: listing.collection_id
        };

        const { error: nftError } = await supabaseAdmin
          .from('collectibles')
          .insert(collectibleToInsert)
          .select();

        if (nftError) {
          console.error('Error creating collectible:', nftError);
        }
      }
    }

    return NextResponse.json(
      { batch_listings: batchListings },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error in GET /api/cron/create-daily-collectibles:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}