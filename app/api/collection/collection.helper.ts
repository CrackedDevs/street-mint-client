import { createUmi } from "@metaplex-foundation/umi-bundle-defaults";
import {
  Umi,
  generateSigner,
  createSignerFromKeypair,
  signerIdentity,
  publicKey,
  percentAmount,
  PublicKey,
} from "@metaplex-foundation/umi";

import {
  createNft,
  fetchDigitalAsset,
  mplTokenMetadata,
} from "@metaplex-foundation/mpl-token-metadata";
import bs58 from "bs58";
import {
  mplBubblegum,
  mintToCollectionV1,
  findLeafAssetIdPda,
  parseLeafFromMintToCollectionV1Transaction,
  createTree,
  LeafSchema,
} from "@metaplex-foundation/mpl-bubblegum";
import { getDomainKeySync, NameRegistryState } from "@bonfida/spl-name-service";
import { Connection } from "@solana/web3.js";

// Common Umi initialization function
function initializeUmi(endpoint: string, privateKey: string): Umi {
  const umi = createUmi(endpoint).use(mplTokenMetadata()).use(mplBubblegum());

  const keypair = umi.eddsa.createKeypairFromSecretKey(
    privateKeyToUint8Array(privateKey)
  );
  const signer = createSignerFromKeypair(umi, keypair);
  umi.use(signerIdentity(signer));
  return umi;
}

export interface CreatorRoyalty {
  creator_wallet_address: string;
  royalty_percentage: number;
  name: string;
}

function privateKeyToUint8Array(privateKeyString: string): Uint8Array {
  return new Uint8Array(bs58.decode(privateKeyString));
}

export async function createBubbleGumTree() {
  const umi = initializeUmi(process.env.RPC_URL!, process.env.PRIVATE_KEY!);
  const collectionMint = generateSigner(umi);
  const merkleTree = generateSigner(umi);

  try {
    console.time("Create NFT"); // Start timer for NFT creation
    await createNft(umi, {
      mint: collectionMint,
      name: "StreetMint V1",
      uri: "https://iaulwnqmthzvuxfubnsb.supabase.co/storage/v1/object/public/nft-images/streetmint.png",
      sellerFeeBasisPoints: percentAmount(0),
      isCollection: true,
      symbol: "SMV1",
      updateAuthority: umi.identity.publicKey,
      isMutable: true,
    }).sendAndConfirm(umi);
    console.timeEnd("Create NFT"); // End timer for NFT creation

    console.log(
      `✅ Created collection: ${collectionMint.publicKey.toString()}`
    );

    console.time("Create Tree"); // Start timer for tree creation
    const builder = await createTree(umi, {
      merkleTree,
      maxDepth: 20,
      maxBufferSize: 64,
      canopyDepth: 10,
    });
    await builder.sendAndConfirm(umi);
    console.timeEnd("Create Tree"); // End timer for tree creation

    console.log(
      `✅ Created Bubble Gum Tree: ${merkleTree.publicKey.toString()}`
    );

    return {
      merkleTreePublicKey: merkleTree.publicKey.toString(),
      collectionMintPublicKey: collectionMint.publicKey.toString(),
    };
  } catch (error) {
    console.error("Error in createBubbleGumTree:", error);
    throw error;
  }
}

export async function mintNFTWithBubbleGumTree(
  merkleTreePublicKey: string,
  collectionMintPublicKey: string,
  minterAddress: string,
  name: string,
  metadata_uri: string,
  creatorRoyaltyArray: CreatorRoyalty[],
  maxRetries = 3
): Promise<{ signature: string }> {
  const umi = initializeUmi(process.env.RPC_URL!, process.env.PRIVATE_KEY!);
  let retries = 0;
  let mintTx;

  while (retries < maxRetries) {
    try {
      console.time(`Minting NFT - Attempt ${retries + 1}`);
      console.log(`Attempt ${retries + 1} to mint NFT`);
      const merkleTree = publicKey(merkleTreePublicKey);
      const leafOwner = publicKey(minterAddress);
      const collectionMintPubkey = publicKey(collectionMintPublicKey);

      console.time("Fetch Collection Asset");
      const collectionAsset = await fetchDigitalAsset(
        umi,
        collectionMintPubkey
      );
      console.timeEnd("Fetch Collection Asset");
      console.log(
        "Collection mint fetched:",
        collectionAsset.publicKey.toString()
      );

      let creators: { address: PublicKey; verified: boolean; share: number }[] =
        [];
      let totalRoyaltyPercentage = 0;

      if (creatorRoyaltyArray && creatorRoyaltyArray.length > 0) {
        // Calculate total royalty percentage first
        totalRoyaltyPercentage = creatorRoyaltyArray.reduce(
          (sum, creator) =>
            sum +
            Math.max(0, Math.min(100, Number(creator.royalty_percentage))),
          0
        );

        console.log("totalRoyaltyPercentage", totalRoyaltyPercentage);

        // Map creators with proportional shares
        creators = creatorRoyaltyArray.map((creator) => {
          const royaltyPercent = Math.max(
            0,
            Math.min(100, Number(creator.royalty_percentage))
          );

          // Calculate proportional share based on royalty percentage
          // Example: If creator has 30% royalty and total royalties are 60%,
          // their share would be (30/60)*100 = 50% of the total creator share.
          // If total royalties are 0%, all shares will be 0

          const share =
            totalRoyaltyPercentage > 0
              ? Math.floor((royaltyPercent / totalRoyaltyPercentage) * 100)
              : 0;

          return {
            address: publicKey(creator.creator_wallet_address),
            verified: false,
            share,
          };
        });

        if (creators.length > 0) {
          const totalShares = creators.reduce((sum, creator) => sum + creator.share, 0);
          const remainder = 100 - totalShares;
          
        
          for (let i = 0; i < remainder && i < creators.length; i++) {
            creators[i].share += 1;
          }
        }

        console.log("creators", creators);
        console.log("total shares:", creators.reduce((sum, creator) => sum + creator.share, 0));
      }

      console.time("Mint to Collection");
      const transaction = await mintToCollectionV1(umi, {
        leafOwner: leafOwner,
        merkleTree,
        collectionMint: collectionMintPubkey,
        metadata: {
          name: name,
          uri: metadata_uri,
          sellerFeeBasisPoints: totalRoyaltyPercentage * 100, // Convert percentage to basis points (1% = 100 basis points)
          collection: { key: collectionMintPubkey, verified: false },
          creators: creators,
        },
      });
      console.timeEnd("Mint to Collection");

      console.time(`Send and Confirm - Attempt ${retries + 1}`);

      // Get fresh blockhash before each attempt
      const blockhash = await umi.rpc.getLatestBlockhash();

      mintTx = await transaction.sendAndConfirm(umi, {
        send: {
          skipPreflight: true,
          maxRetries: 3,
        },
        confirm: {
          commitment: "confirmed",
          strategy: {
            type: "blockhash",
            blockhash: blockhash.blockhash,
            lastValidBlockHeight: blockhash.lastValidBlockHeight,
          },
        },
      });

      console.timeEnd(`Send and Confirm - Attempt ${retries + 1}`);
      console.timeEnd(`Minting NFT - Attempt ${retries + 1}`);

      console.log("NFT minted successfully");
      break;
    } catch (error: any) {
      console.error(`Error minting NFT (attempt ${retries + 1}):`, error);

      // Check if error is related to blockhash expiry
      if (
        error.message?.includes("block height exceeded") ||
        error.message?.includes("blockhash not found") ||
        error.message?.includes("Blockhash not found")
      ) {
        console.log("Blockhash expired, retrying with new blockhash...");
        retries++;
        if (retries >= maxRetries) {
          throw new Error(
            `Failed to mint NFT after ${maxRetries} attempts: ${error.message}`
          );
        }
        // Wait longer between retries
        await new Promise((resolve) => setTimeout(resolve, 5000));
        continue;
      }

      // For other errors, throw immediately
      throw error;
    }
  }

  if (!mintTx) {
    throw new Error("Minting failed");
  }

  const signatureBase58 = bs58.encode(mintTx.signature);
  return { signature: signatureBase58 };
}

export async function resolveSolDomain(
  connection: Connection,
  domain: string
): Promise<string> {
  try {
    const { pubkey } = getDomainKeySync(domain.toLocaleLowerCase().trim());
    if (!pubkey) {
      throw new Error("Domain not found");
    }
    const { registry } = await NameRegistryState.retrieve(connection, pubkey);
    if (registry) {
      return registry.owner.toBase58();
    } else {
      throw new Error("Domain not found");
    }
  } catch (error) {
    console.error("Error resolving .sol domain:", error);
    throw new Error("Failed to resolve .sol domain");
  }
}
