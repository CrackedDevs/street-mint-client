import { TipLink, TipLinkClient } from "@tiplink/api";

import { LAMPORTS_PER_SOL } from "@solana/web3.js";
import bs58 from "bs58";

export async function createTipLink(): Promise<{
  publicKey: string;
  url: string;
} | null> {
  try {
    const client = await TipLinkClient.init(process.env.TIPLINK_API_KEY!, 1);
    const campaign = await client.campaigns.create({
      name: "Streetmint Campaign",
      description: "Streetmint Campaign", // optional
      themeId: 87,
      imageUrl: "https://www.streetmint.xyz/logo.svg",
      active: true,
    });

    const tiplink = await TipLink.create();
    const tiplinks = [tiplink];
    await campaign.addEntries(tiplinks);

    return {
      publicKey: tiplink.keypair.publicKey.toBase58(),
      url: tiplink.url.toString(),
    };
  } catch (error: any) {
    console.error("Error creating TipLink:", error);
    return null;
  }
}
