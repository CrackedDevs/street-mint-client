import { NextApiResponse } from "next";
import { v4 as uuidv4 } from "uuid";
import { checkMintEligibility, supabase } from "@/lib/supabaseClient";
import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabaseAdminClient";
import { createTipLink } from "../../tiplink.helper";

export async function POST(req: Request, res: NextApiResponse) {
  const { collectibleId, walletAddress, deviceId, collectionId } =
    await req.json();

  const isEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(walletAddress || "");
  const supabaseAdmin = await getSupabaseAdmin();

  if (!collectibleId || !walletAddress) {
    return NextResponse.json(
      { success: false, error: "Missing required fields" },
      { status: 400 }
    );
  }

  let order: any;

  try {
    // Fetch collectible details
    const { data: collectible, error: collectibleError } = await supabase
      .from("collectibles")
      .select("*, collections(id)")
      .eq("id", collectibleId)
      .single();

    if (collectibleError || !collectible) {
      throw new Error("Failed to fetch collectible");
    }

    let tipLinkWalletAddress = null;
    let tipLinkUrl = null;
    if (isEmail) {
      const tipLink = await createTipLink();
      if (!tipLink) {
        throw new Error("Failed to create tip link");
      }
      console.log("tipLink", tipLink);
      tipLinkWalletAddress = tipLink.publicKey.toString();
      tipLinkUrl = tipLink.url;
    }

    // Check eligibility
    const { eligible, reason } = await checkMintEligibility(
      walletAddress,
      collectibleId,
      deviceId
    );

    console.log("Eligible:", eligible);
    console.log("Reason:", reason);

    if (!eligible) {
      if (order && order.id) {
        await supabaseAdmin
          .from("orders")
          .update({ status: "failed" })
          .eq("id", order.id);
      }
      return NextResponse.json(
        {
          success: false,
          error: "Already minted or minting in progress for this NFT" + reason,
        },
        { status: 400 }
      );
    }

    // Create order in database
    try {
      const { data, error: insertError } = await supabaseAdmin
        .from("orders")
        .insert({
          id: uuidv4(),
          wallet_address: walletAddress,
          collectible_id: collectibleId,
          collection_id: collectionId,
          status: "pending",
          price_usd: collectible.price_usd,
          nft_type: collectible.quantity_type,
          max_supply: collectible.quantity || null, // Use null for unlimited supply
          device_id: deviceId,
          tiplink_url: tipLinkUrl,
        })
        .select()
        .single();

      if (insertError) throw insertError;
      order = data;
    } catch (insertError) {
      console.error("Error creating order:", insertError);
      // If there's an error, update the order status to 'failed'
      if (order && order.id) {
        await supabaseAdmin
          .from("orders")
          .update({ status: "failed" })
          .eq("id", order.id);
      }
      throw new Error("Failed to create order");
    }

    if (!order) {
      throw new Error("Failed to create order");
    }

    return NextResponse.json(
      {
        success: true,
        orderId: order.id,
        isFree: order.price_usd === 0,
        tipLinkWalletAddress,
        tipLinkUrl,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error initiating minting:", error);
    if (order && order.id) {
      await supabaseAdmin
        .from("orders")
        .update({ status: "failed" })
        .eq("id", order.id);
    }
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
