import { getSupabaseAdmin } from "@/lib/supabaseAdminClient";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    console.log("body", body);
    const { collectibleId, nfcPublicKey, artistPassword } = body;

    if (!collectibleId || !nfcPublicKey || !artistPassword) {
      console.log(
        "Collectible ID, NFC public key, and artist password are required"
      );
      return NextResponse.json(
        {
          success: false,
          error:
            "Collectible ID, NFC public key, and artist password are required",
        },
        { status: 400 }
      );
    }

    const supabaseClient = await getSupabaseAdmin();
    const { data: collectible } = await supabaseClient
      .from("collectibles")
      .select("collection_id")
      .eq("id", collectibleId)
      .single();

    if (!collectible) {
      console.log("Collectible not found");
      return NextResponse.json(
        { success: false, error: "Collectible not found" },
        { status: 404 }
      );
    }

    const { data: artist } = await supabaseClient
      .from("collections")
      .select("artists(app_password)")
      .eq("id", collectible.collection_id)
      .single();

    if (!artist) {
      console.log("Artist not found");
      return NextResponse.json(
        { success: false, error: "Artist not found" },
        { status: 404 }
      );
    }

    if (!artistPassword) {
      console.log("Artist password not found");
      return NextResponse.json(
        { success: false, error: "Artist password not found" },
        { status: 404 }
      );
    }

    if (
      artistPassword !== artist.artists?.app_password &&
      artistPassword !== process.env.APP_ADMIN_PASSWORD
    ) {
      console.log("Artist password is incorrect");
      return NextResponse.json(
        { success: false, error: "Artist password is incorrect" },
        { status: 401 }
      );
    }

    const { data: oldCollectible } = await supabaseClient
      .from("collectibles")
      .select("nfc_public_key, id")
      .eq("nfc_public_key", nfcPublicKey);

    console.log("oldCollectible", oldCollectible);

    await supabaseClient
      .from("collectibles")
      .update({
        nfc_public_key: nfcPublicKey,
        gallery_name: null
      })
      .eq("id", collectibleId);

    if (oldCollectible && oldCollectible.length > 0) {
      console.log("oldCollectible", oldCollectible);
      oldCollectible.forEach(async (collectible) => {
        return await supabaseClient
          .from("collectibles")
          .update({
            nfc_public_key: null,
            gallery_name: null
          })
          .eq("id", collectible.id);
      });
    }
    console.log("SUCCESS in nfc updating");

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error) {
    console.error("Error updating NFC public key:", error);
    return NextResponse.json(
      { success: false, error: "Failed to update NFC public key" },
      { status: 500 }
    );
  }
}
