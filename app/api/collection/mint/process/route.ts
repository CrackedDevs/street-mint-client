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
  mintNFTWithBubbleGumTree,
  resolveSolDomain,
} from "../../collection.helper";
import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabaseAdminClient";
import TipLinkEmailTemplate from "@/components/email/tiplink-template";
import { resend } from "@/lib/resendMailer";

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
  const {
    orderId,
    signedTransaction,
    priceInSol,
    tipLinkWalletAddress,
    isEmail,
    nftImageUrl,
  } = await req.json();
  //log all
  console.log("tipLinkWalletAddress", tipLinkWalletAddress);
  console.log("isEmail", isEmail);
  if (!orderId) {
    return NextResponse.json(
      { success: false, error: "Transaction not found" },
      { status: 400 }
    );
  }

  try {
    // Fetch order
    const { data: order, error: fetchError } = await supabase
      .from("orders")
      .select("*, collectibles(name, metadata_uri)")
      .eq("id", orderId)
      .single();

    if (!order) {
      throw new Error("Invalid Tansaction");
    }

    if (order.status == "completed") {
      throw new Error("No transaction found");
    }

    let resolvedWalletAddress = order.wallet_address;
    if (order.wallet_address.endsWith(".sol")) {
      try {
        resolvedWalletAddress = await resolveSolDomain(
          connection,
          order.wallet_address
        );
      } catch (error) {
        throw new Error("Failed to resolve .sol domain");
      }
    }
    console.log("Resolved Wallet Address:", resolvedWalletAddress);

    // For paid mints, verify and send transaction
    if (order.price_usd && order.price_usd > 0) {
      if (!signedTransaction) {
        throw new Error("Missed transaction signature");
      }
      let transaction;

      transaction = VersionedTransaction.deserialize(
        Buffer.from(signedTransaction, "base64")
      );

      // Verify transaction amount
      const isAmountCorrect = verifyTransactionAmount(transaction, priceInSol);
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

    // Mint NFT
    const mintResult = await mintNFTWithBubbleGumTree(
      merkleTreePublicKey,
      collectionMintPublicKey,
      isEmail && tipLinkWalletAddress
        ? tipLinkWalletAddress
        : resolvedWalletAddress,
      order.collectibles.name,
      order.collectibles.metadata_uri
    );

    if (!mintResult || !mintResult.signature) {
      console.log("Failed to mint NFT");
      throw new Error("Failed to mint NFT");
    }
    // Update order status
    const supabaseAdmin = await getSupabaseAdmin();
    const { error: updateError } = await supabaseAdmin
      .from("orders")
      .update({
        status: "completed",
        mint_signature: mintResult.signature,
        mint_address: mintResult.tokenAddress,
        wallet_address: resolvedWalletAddress,
      })
      .eq("id", orderId);

    if (updateError) {
      throw new Error("Failed to update order");
    }

    if (isEmail && tipLinkWalletAddress) {
      //send email
      try {
        const { wallet_address, tiplink_url } = order;
        if (!wallet_address || !tiplink_url) {
          console.log(
            "Missing wallet_address or tiplink_url for email sending"
          );
          return;
        }
        const { data, error } = await resend.emails.send({
          text: "Claim your Collectible!",
          from: "Daryl <daryl@mail.irls.xyz>",
          to: [wallet_address],
          subject: "Claim IRLS your Collectible!",
          react: TipLinkEmailTemplate({ tiplinkUrl: tiplink_url, nftImageUrl }),
        });

        if (error) {
          console.log(error);
        }

        console.log("Email sent successfully");
      } catch (emailError) {
        console.error("Error sending email:", emailError);
      }
    }
    return NextResponse.json(
      {
        success: true,
        mintSignature: mintResult.signature,
        tokenAddress: mintResult.tokenAddress,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error processing minting:", error);
    // Update order status to failed
    const supabaseAdmin = await getSupabaseAdmin();
    await supabaseAdmin
      .from("orders")
      .update({ status: "failed" })
      .eq("id", orderId);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
