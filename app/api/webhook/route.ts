import {
  getSupabaseAdmin,
  updateStripTransaction,
} from "@/lib/supabaseAdminClient";
import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";

export async function POST(req: NextRequest) {
  // console.log(req.headers, "headers");
  const body = await req.json();
  const stripeData: Stripe.Checkout.Session = body.data.object;
  // console.log(body);
  // console.log(body.data.object.customer_details, "customer details");
  // console.log(body.data.object.metadata, "metadata");
  await updateStripTransaction(
    stripeData.id,
    stripeData.status!,
    stripeData.metadata?.orderId!
  );

  if (stripeData.status === "complete") {
    if (!stripeData.metadata) {
      throw new Error("Missing metadata in Stripe webhook");
    }
    const isLightVersion = stripeData.metadata.isLightVersion === "true";

    console.log("stripeData.metadata", stripeData.metadata);

    if (isLightVersion) {
      const {
        orderId,
        signedTransaction,
        priceInSol,
        collectibleId,
        isCardPayment,
        walletAddress,
      } = stripeData.metadata;
      const processResponse = await fetch(
        `${
          process.env.NODE_ENV === "development"
            ? process.env.DEV_SITE_URL
            : process.env.PROD_SITE_URL
        }/api/collection/mint/process-light`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            orderId,
            signedTransaction,
            priceInSol,
            walletAddress,
            collectibleId,
            isCardPayment,
          }),
        }
      );

      console.log(processResponse);

      if (!processResponse.ok) {
        const supabaseAdmin = await getSupabaseAdmin();
        await supabaseAdmin
          .from("light_orders")
          .update({ status: "failed" })
          .eq("id", orderId);
        const errorData = await processResponse.json();
        console.error("Failed to process minting:", errorData);

        throw new Error(errorData.error || "Failed to process minting");
      }
    } else {
      const {
        orderId,
        tipLinkWalletAddress,
        signedTransaction,
        priceInSol,
        isEmail,
        nftImageUrl,
        collectibleId,
        chipTapData,
        isCardPayment,
      } = stripeData.metadata;
      const parsedChipData = JSON.parse(chipTapData);
      console.log(parsedChipData);

      const processResponse = await fetch(
        `${
          process.env.NODE_ENV === "development"
            ? process.env.DEV_SITE_URL
            : process.env.PROD_SITE_URL
        }/api/collection/mint/process`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            orderId,
            tipLinkWalletAddress,
            signedTransaction,
            priceInSol,
            isEmail,
            nftImageUrl,
            collectibleId,
            chipTapData: parsedChipData,
            isCardPayment,
          }),
        }
      );

      if (!processResponse.ok) {
        const supabaseAdmin = await getSupabaseAdmin();
        await supabaseAdmin
          .from("orders")
          .update({ status: "failed" })
          .eq("id", orderId);
        const errorData = await processResponse.json();
        console.error("Failed to process minting:", errorData);

        throw new Error(errorData.error || "Failed to process minting");
      }
    }
  } else if (stripeData.status === "expired") {
    const supabaseAdmin = await getSupabaseAdmin();
    await supabaseAdmin
      .from("orders")
      .update({ status: "failed" })
      .eq("id", stripeData.metadata?.orderId!);
  }

  return NextResponse.json({ message: "Webhook received" });
}
