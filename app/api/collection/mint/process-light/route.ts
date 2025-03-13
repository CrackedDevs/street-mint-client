import { NextApiResponse } from "next";
import {
  Connection,
  Transaction,
  VersionedTransaction,
  SystemProgram,
  LAMPORTS_PER_SOL,
  SendTransactionError,
} from "@solana/web3.js";
import { supabase } from "@/lib/supabaseClient";
import {
  CreatorRoyalty,
  mintNFTWithBubbleGumTree,
} from "../../collection.helper";
import { v4 as uuidv4 } from "uuid";
import { NextResponse } from "next/server";
import {
  getSupabaseAdmin,
} from "@/lib/supabaseAdminClient";
import { headers } from "next/headers";

function verifyTransactionAmount(
  transaction: Transaction | VersionedTransaction,
  expectedAmount: number,
  tolerance: number = 0.01
): boolean {
  let foundTransfer = false;
  let transferAmount = 0;

  if (transaction instanceof VersionedTransaction) {
    const message = transaction.message;
    const accountKeys = message.staticAccountKeys;

    for (const instruction of message.compiledInstructions) {
      if (
        accountKeys[instruction.programIdIndex].equals(SystemProgram.programId)
      ) {
        const data = Buffer.from(instruction.data);
        // The first 4 bytes are the instruction discriminator for 'transfer'
        if (data.readUInt32LE(0) === 2) {
          transferAmount = Number(data.readBigUInt64LE(4)) / LAMPORTS_PER_SOL;
          foundTransfer = true;
          break;
        }
      }
    }
  } else {
    for (const instruction of transaction.instructions) {
      if (instruction.programId.equals(SystemProgram.programId)) {
        const data = instruction.data;
        // The first 4 bytes are the instruction discriminator for 'transfer'
        if (data.readUInt32LE(0) === 2) {
          transferAmount = Number(data.readBigUInt64LE(4)) / LAMPORTS_PER_SOL;
          foundTransfer = true;
          break;
        }
      }
    }
  }

  if (!foundTransfer) {
    console.log("No transfer instruction found in transaction");
    return false;
  }

  console.log(`Transaction amount: ${transferAmount} SOL`);
  console.log(`Expected amount: ${expectedAmount} SOL`);

  // Check if the amount is within the tolerance range
  const lowerBound = expectedAmount * (1 - tolerance);
  const upperBound = expectedAmount * (1 + tolerance);

  return transferAmount >= lowerBound && transferAmount <= upperBound;
}

const connection = new Connection(process.env.RPC_URL!);

const waitForTransactionConfirmation = async (
  signature: string,
  maxAttempts = 10
) => {
  for (let i = 0; i < maxAttempts; i++) {
    const confirmation = await connection.getSignatureStatus(signature, {
      searchTransactionHistory: true,
    });
    console.log(confirmation);

    if (
      confirmation &&
      confirmation.value &&
      confirmation.value.confirmationStatus === "confirmed" &&
      confirmation.value.err == null
    ) {
      return true;
    }
    await new Promise((resolve) => setTimeout(resolve, 2000)); // Wait for 2 seconds before next check
  }
  throw new Error("Transaction confirmation timed out");
};

export async function POST(req: Request, res: NextApiResponse) {
  console.time("POST Request Duration"); // Start timing the entire POST request

  const host = headers().get("host") || "";
  console.log("host", host);
  const platform = host == "www.irls.xyz" ? "IRLS" : "STREETMINT";
  console.log("platform", platform);

  const {
    orderId,
    signedTransaction,
    priceInSol,
    walletAddress,
    collectibleId,
    isCardPayment = false,
  } = await req.json();

  console.time("Initial Checks Duration"); // Start timing initial checks
  if (!orderId) {
    console.timeEnd("Initial Checks Duration"); // End timing initial checks
    return NextResponse.json(
      { success: false, error: "Transaction not found" },
      { status: 400 }
    );
  }

  try {

    console.time("Fetch Order Duration"); // Start timing order fetch
    // Fetch order
    const { data: order, error: fetchError } = await supabase
      .from("light_orders")
      .select("*, collectibles(name, metadata_uri, creator_royalty_array)")
      .eq("id", orderId)
      .eq("collectible_id", collectibleId)
      .single();
    console.timeEnd("Fetch Order Duration"); // End timing order fetch

    if (!order) {
      throw new Error("Invalid Transaction");
    }

    if (order.status == "completed") {
      throw new Error("No transaction found");
    }

    let emailAddress = order.email;

    const supabaseAdmin = await getSupabaseAdmin();

    await new Promise((resolve) => setTimeout(resolve, 700));

    // const { count, error: countError } = await supabaseAdmin
    //   .from("light_orders")
    //   .select("id", { count: "exact", head: true })
    //   .eq("collectible_id", collectibleId)
    //   .eq("email", emailAddress)
    //   .eq("wallet_address", walletAddress)
    //   .in("status", ["completed", "pending"]);

    // if (countError) {
    //   console.error("Error getting count of existing orders:", countError);
    //   throw new Error("Failed to get count of existing orders");
    // }

    // console.log(
    //   "Count of existing light orders for collectible of address ",
    //   emailAddress,
    //   " is ",
    //   count
    // );

    // if (count && count > 1) {
    //   throw new Error(
    //     "More than one light order found for this collectible with same wallet address which is pending or completed"
    //   );
    // }

    // For paid mints, verify and send transaction
    if (order.price_usd && order.price_usd > 0 && !isCardPayment) {
      if (!signedTransaction) {
        throw new Error("Missed transaction signature");
      }
      let transaction;

      transaction = VersionedTransaction.deserialize(
        Buffer.from(signedTransaction, "base64")
      );

      console.time("Transaction Verification Duration"); // Start timing transaction verification
      // Verify transaction amount
      const isAmountCorrect = verifyTransactionAmount(transaction, priceInSol);
      console.timeEnd("Transaction Verification Duration"); // End timing transaction verification

      if (!isAmountCorrect) {
        throw new Error("Transaction amount does not match the NFT price");
      }

      let txSignature;
      try {
        txSignature = await connection.sendRawTransaction(
          transaction.serialize(),
          {
            skipPreflight: true,
            maxRetries: 3,
          }
        );
        await waitForTransactionConfirmation(txSignature);
        console.log("Transaction confirmed");
      } catch (error) {
        if (error instanceof SendTransactionError) {
          // Check if the error is due to an expired blockhash
          if (error.message.includes("Blockhash not found")) {
            // Get a new blockhash
            const { blockhash, lastValidBlockHeight } =
              await connection.getLatestBlockhash();

            // Update the transaction with the new blockhash
            transaction.message.recentBlockhash = blockhash;

            // Retry sending the transaction
            txSignature = await connection.sendRawTransaction(
              transaction.serialize(),
              {
                skipPreflight: true,
                maxRetries: 3,
              }
            );
            console.log("Transaction sent. Signature:", txSignature);

            await waitForTransactionConfirmation(txSignature);
          } else {
            throw error; // Re-throw if it's not a blockhash issue
          }
        } else {
          throw error; // Re-throw if it's not a SendTransactionError
        }
      }
    }

    const merkleTreePublicKey = process.env.MERKLE_TREE_PUBLIC_KEY;
    const collectionMintPublicKey = process.env.MEGA_COLLECTION_MINT_PUBLIC_KEY;

    if (
      !order.collectibles ||
      !merkleTreePublicKey ||
      !collectionMintPublicKey ||
      !order.collectibles.metadata_uri
    ) {
      throw new Error("Something went wrong");
    }

    console.time("Mint NFT Duration"); // Start timing NFT minting
    // Mint NFT
    const mintResult = await mintNFTWithBubbleGumTree(
      merkleTreePublicKey,
      collectionMintPublicKey,
      walletAddress,
      order.collectibles.name,
      order.collectibles.metadata_uri,
      order.collectibles.creator_royalty_array as unknown as CreatorRoyalty[]
    );
    console.timeEnd("Mint NFT Duration"); // End timing NFT minting

    if (!mintResult || !mintResult.signature) {
      console.log("Failed to mint NFT");
      throw new Error("Failed to mint NFT");
    }
    // Update order status
    const { error: updateError } = await supabaseAdmin
      .from("light_orders")
      .update({
        status: "completed",
        mint_signature: mintResult.signature,
        wallet_address: walletAddress,
      })
      .eq("id", orderId);

    if (updateError) {
      console.error("Error updating order:", updateError);
      throw new Error("Failed to update order");
    }
    console.timeEnd("POST Request Duration"); // End timing the entire POST request
    return NextResponse.json(
      {
        success: true,
        mintSignature: mintResult.signature,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error processing minting:", error);
    // Update order status to failed
    const supabaseAdmin = await getSupabaseAdmin();
    await supabaseAdmin
      .from("light_orders")
      .update({ status: "failed" })
      .eq("id", orderId);
    console.timeEnd("POST Request Duration"); // End timing the entire POST request
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
