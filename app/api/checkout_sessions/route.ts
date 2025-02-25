import { NextRequest, NextResponse } from "next/server";
import { headers } from "next/headers";

import { stripe } from "@/lib/stripe";
import { addStripeTransaction } from "@/lib/supabaseAdminClient";

export async function POST(req: NextRequest) {
  try {
    const headersList = await headers();
    const origin = headersList.get("origin");
    const {
      priceId,
      orderId,
      tipLinkWalletAddress,
      signedTransaction,
      priceInSol,
      isEmail,
      nftImageUrl,
      collectibleId,
      chipTapData,
      isCardPayment,
    } = await req.json();
    // console.log(body, "body");
    // Create Checkout Sessions from body params.
    const session = await stripe.checkout.sessions.create({
      line_items: [
        {
          // Provide the exact Price ID (for example, pr_1234) of the product you want to sell
          price: priceId,
          quantity: 1,
        },
      ],
      mode: "payment",
      success_url: `${origin}/v1?x=${chipTapData.x}&n=${chipTapData.n}&e=${chipTapData.e}&success=true&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/v1?x=${chipTapData.x}&n=${chipTapData.n}&e=${chipTapData.e}&canceled=true`,
      metadata: {
        orderId,
        tipLinkWalletAddress,
        signedTransaction,
        priceInSol,
        isEmail,
        nftImageUrl,
        collectibleId,
        chipTapData: JSON.stringify(chipTapData),
        isCardPayment,
      },
    });

    console.log(session, "session server");
    await addStripeTransaction(
      session.status!,
      session.id,
      session.amount_total! / 100,
      session
    );

    if (!session.url) {
      return NextResponse.json(
        { error: "Failed to create checkout session" },
        { status: 500 }
      );
    }

    return NextResponse.json({ url: session.url }, { status: 200 });
  } catch (err) {
    const error = err as Error;
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
