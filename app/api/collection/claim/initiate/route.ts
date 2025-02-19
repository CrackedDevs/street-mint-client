import { NextApiResponse } from "next";
import { v4 as uuidv4 } from "uuid";
import { checkClaimEligibilityForLight, supabase } from "@/lib/supabaseClient";
import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabaseAdminClient";
import { resend } from "@/lib/resendMailer";
import ClaimEmailTemplate from "@/components/email/claim-email-template";
import crypto from "crypto";

export async function POST(req: Request, res: NextApiResponse) {
  const { collectibleId, email, deviceId, collectionId } =
    await req.json();

  const isEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email || "");

  if (!collectibleId || !email || !deviceId || !collectionId || !isEmail) {
    return NextResponse.json(
      { success: false, error: "Missing required fields or invalid email" },
      { status: 400 }
    );
  }

  const supabaseAdmin = await getSupabaseAdmin();

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

    // Check eligibility
    const { eligible, reason } = await checkClaimEligibilityForLight(
      email,
      collectibleId,
      deviceId
    );

    console.log("Eligible:", eligible);
    console.log("Reason:", reason);

    if (!eligible) {
      if (order && order.id) {
        await supabaseAdmin
          .from("light_orders")
          .update({ status: "failed" })
          .eq("id", order.id);
      }
      return NextResponse.json(
        {
          success: false,
          error: "Already claimed or claiming in progress for this NFT" + reason,
        },
        { status: 400 }
      );
    }

    const id = uuidv4();
    const randomStringCode = Array.from(crypto.getRandomValues(new Uint8Array(6)))
      .map(n => n % 10)
      .join('');
    const signatureCode = `${randomStringCode}-${Math.random() * 100000}-${Date.now().toString().slice(-6)}x${id}`;
    const nftImageUrl = collectible.primary_image_url;

    const { data, error } = await resend.emails.send({
        text: "Claim your Collectible!",
        from: "Daryl <daryl@mail.irls.xyz>",
        to: [email],
        subject: "Claim IRLS Light your Collectible!",
        react: ClaimEmailTemplate({ 
          collectibleId, 
          collectionId, 
          nftImageUrl,
          signatureCode,
        }),
      });

    if (error) {
      console.error("Error sending email for claim:", error);
      return NextResponse.json(
        { success: false, error: "Failed to send email for claim" },
        { status: 500 }
      );
    }

    // Create order in database
    try {
      const { data, error: insertError } = await supabaseAdmin
        .from("light_orders")
        .insert({
          id,
          email: email,
          collectible_id: collectibleId,
          collection_id: collectionId,
          status: "pending",
          price_usd: 0,
          nft_type: collectible.quantity_type,
          max_supply: collectible.quantity || null, // Use null for unlimited supply
          device_id: deviceId,
          tiplink_url: "",
          email_sent: true,
        })
        .select()
        .single();

      if (insertError) throw insertError;
      order = data;
    } catch (insertError) {
      console.error("Error creating light order:", insertError);
      // If there's an error, update the order status to 'failed'
      if (order && order.id) {
        await supabaseAdmin
          .from("light_orders")
          .update({ status: "failed" })
          .eq("id", order.id);
      }
      throw new Error("Failed to create order");
    }

    if (!order) {
      throw new Error("Failed to create light order");
    }

    return NextResponse.json(
      {
        success: true,
        orderId: order.id,
        lightOrderSignature: "",
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error initiating claiming:", error);
    if (order && order.id) {
      await supabaseAdmin
        .from("light_orders")
        .update({ status: "failed" })
        .eq("id", order.id);
    }
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
