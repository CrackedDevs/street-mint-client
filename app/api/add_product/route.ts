import { stripe } from "@/lib/stripe";
import { NextRequest, NextResponse } from "next/server";
export async function POST(req: NextRequest) {
  const { nftName, price } = await req.json();
  const product = await stripe.products.create({
    name: nftName,
    default_price_data: {
      currency: "usd",
      unit_amount: price * 100,
    },
  });

  return NextResponse.json({ product });
}
