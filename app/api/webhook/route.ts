import { updateStripTransaction } from "@/lib/supabaseAdminClient";
import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";

export async function POST(req: NextRequest) {
  console.log(req.headers, "headers");
  const body = await req.json();
  const stripeData: Stripe.Checkout.Session = body.data.object;
  // console.log(body);
  // console.log(body.data.object.customer_details, "customer details");
  // console.log(body.data.object.metadata, "metadata");
  await updateStripTransaction(stripeData.id, stripeData.status!);

  if (stripeData.status === "complete") {
    if (!stripeData.metadata) {
      throw new Error("Missing metadata in Stripe webhook");
    }
    const {
      orderId,
      tipLinkWalletAddress,
      signedTransaction,
      priceInSol,
      isEmail,
      nftImageUrl,
    } = stripeData.metadata;

    const processResponse = await fetch(`${process.env.NODE_ENV === "development" ? process.env.DEV_SITE_URL : process.env.PROD_SITE_URL}/api/collection/mint/process`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        orderId,
        tipLinkWalletAddress,
        signedTransaction,
        priceInSol,
        isEmail,
        nftImageUrl,
      }),
    });

    if (!processResponse.ok) {
      const errorData = await processResponse.json();
      console.error("Failed to process minting:", errorData);
      throw new Error(errorData.error || "Failed to process minting");
    }
  }

  return NextResponse.json({ message: "Webhook received" });
}
