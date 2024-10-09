import { TipLink } from "@tiplink/api";

import { LAMPORTS_PER_SOL } from "@solana/web3.js";
import bs58 from "bs58";

export async function createTipLink(): Promise<{
  publicKey: string;
  url: string;
} | null> {
  try {
    const tiplink = await TipLink.create();

    return {
      publicKey: tiplink.keypair.publicKey.toBase58(),
      url: tiplink.url.toString(),
    };
  } catch (error: any) {
    console.error("Error creating TipLink:", error);
    return null;
  }
}
