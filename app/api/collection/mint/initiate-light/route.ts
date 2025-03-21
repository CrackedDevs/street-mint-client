import { NextApiResponse } from "next";
import { v4 as uuidv4 } from "uuid";
import {
  checkMintEligibilityForLightVersion,
  supabase,
} from "@/lib/supabaseClient";
import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabaseAdminClient";
import nodemailer from "nodemailer";
import ClaimEmailTemplate from "@/components/email/claim-template";
import { transporter } from "@/lib/nodemailer";

export async function POST(req: Request, res: NextApiResponse) {
  const { collectibleId, emailAddress, deviceId, collectionId } =
    await req.json();

  const isEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailAddress || "");
  const supabaseAdmin = await getSupabaseAdmin();

  if (!collectibleId || !isEmail) {
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

    // Check eligibility
    const { eligible, reason } = await checkMintEligibilityForLightVersion(
      emailAddress,
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
          error:
            "Already claimed or claiming in progress for this NFT" + reason,
        },
        { status: 400 }
      );
    }

    const transaction_uuid = uuidv4();

    const orderId = uuidv4();
    const randomStringCode = Array.from(
      crypto.getRandomValues(new Uint8Array(6))
    )
      .map((n) => n % 10)
      .join("");
    const randomNumber = Math.floor(Math.random() * 1000000);
    const dateCode = Date.now().toString().slice(-6);
    const orderIdCode = orderId.replace(/-/g, "");

    const signatureCode = `${randomStringCode}-${randomNumber}-${dateCode}-${orderIdCode}`;
    console.log("Signature Code:", signatureCode);

    const platform = collectible.is_irls ? "IRLS" : "STREETMINT";

    // Create order in database
    try {
      const { data, error: insertError } = await supabaseAdmin
        .from("light_orders")
        .insert({
          id: orderId,
          last_uuid: transaction_uuid,
          signature_code: signatureCode,
          email: emailAddress,
          collectible_id: collectibleId,
          collection_id: collectionId,
          status: "pending",
          price_usd: collectible.price_usd,
          nft_type: collectible.quantity_type,
          max_supply: collectible.quantity || null, // Use null for unlimited supply
          device_id: deviceId,
          email_sent: false,
        })
        .select()
        .single();

      if (insertError) throw insertError;
      order = data;
      console.log("order", order);

      let fromEmail = "";
      let fromName = "";
      let app_password = "";

      if (platform == "STREETMINT") {
        fromEmail = "hello@streetmint.xyz";
        fromName = "Street Mint";
        app_password = process.env.STREETMINT_NODEMAILER_APP_PASSWORD!;
      } else {
        fromEmail = "hello@irls.xyz";
        fromName = "IRLS";
        app_password = process.env.IRLS_NODEMAILER_APP_PASSWORD!;
      }

      const mailOptions = {
        from: `${fromName} <${fromEmail}>`,
        to: emailAddress,
        subject: `Here's your one-time claim link for NFT ${collectible.name} - ${fromName}`,
        html: ClaimEmailTemplate({
          platform,
          nftImageUrl: collectible.primary_image_url,
          signatureCode,
        }),
      };

      await new Promise((resolve) => setTimeout(resolve, 400));

      const { data: existingLightOrder, error: lightOrderError } = await supabase
      .from('light_orders')
      .select('id, status', { head: true, count: 'exact' })
      .eq('email', emailAddress)
      .eq('collectible_id', collectibleId)
      .in('status', ['completed', 'pending'])

      if (lightOrderError && lightOrderError.code !== "PGRST116")
        throw lightOrderError; // PGRST116 means no rows returned

      console.log("existingLightOrder", existingLightOrder);

      if (existingLightOrder && existingLightOrder.length > 1) {
        return NextResponse.json(
          {
            success: false,
            error: "You have already claimed this NFT or claiming in progress",
          },
          { status: 400 }
        );
      }

      const emailResponse = await transporter.sendMail(mailOptions);
      console.log("emailResponse", emailResponse);
      console.log("Email sent successfully");

      if (collectible.custom_email && collectible.custom_email_subject && collectible.custom_email_body) {
        const customEmailOptions = {
          from: `${fromName} <${fromEmail}>`,
          to: emailAddress,
          subject: collectible.custom_email_subject.trim(),
          html: `<p style="font-size: 16px; line-height: 1.5; color: black; font-family: Arial, sans-serif;">${collectible.custom_email_body.trim()}</p>`,
        };

        const customEmailResponse = await transporter.sendMail(customEmailOptions);
        console.log("customEmailResponse", customEmailResponse);
        console.log("Custom email sent successfully");
      }

      const { data: emailData, error: emailError } = await supabaseAdmin
        .from("light_orders")
        .update({ email_sent: true })
        .eq("id", order.id)
        .eq("email", emailAddress)
        .eq("last_uuid", transaction_uuid)
        .eq("status", "pending")
        .select()
        .single();

      if (!emailData || emailError) {
        throw new Error("Failed to update email sent status");
      }
    } catch (insertError) {
      console.error("Error creating light order:", insertError);
      // If there's an error, update the order status to 'failed'
      if (order && order.id) {
        await supabaseAdmin
          .from("light_orders")
          .update({ status: "failed" })
          .eq("id", order.id);
      }
      throw new Error("Failed to create light order");
    }

    if (!order) {
      throw new Error("Failed to create light order");
    }

    return NextResponse.json(
      {
        success: true,
        orderId: order.id,
        signatureCode,
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
