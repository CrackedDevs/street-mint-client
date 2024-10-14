import { createUmi } from "@metaplex-foundation/umi-bundle-defaults";
import {
  Umi,
  generateSigner,
  createSignerFromKeypair,
  signerIdentity,
  publicKey,
  percentAmount,
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
  maxRetries = 3
): Promise<{ signature: string }> {
  const umi = initializeUmi(process.env.RPC_URL!, process.env.PRIVATE_KEY!);
  let retries = 0;
  let mintTx;

  while (retries < maxRetries) {
    try {
      console.time(`Minting NFT - Attempt ${retries + 1}`); // Start timer for minting
      console.log(`Attempt ${retries + 1} to mint NFT`);
      const merkleTree = publicKey(merkleTreePublicKey);
      const leafOwner = publicKey(minterAddress);
      const collectionMintPubkey = publicKey(collectionMintPublicKey);

      console.time("Fetch Collection Asset"); // Start timer for fetching collection asset
      const collectionAsset = await fetchDigitalAsset(
        umi,
        collectionMintPubkey
      );
      console.timeEnd("Fetch Collection Asset"); // End timer for fetching collection asset
      console.log(
        "Collection mint fetched:",
        collectionAsset.publicKey.toString()
      );

      console.time("Mint to Collection"); // Start timer for minting to collection
      const transaction = await mintToCollectionV1(umi, {
        leafOwner: leafOwner,
        merkleTree,
        collectionMint: collectionMintPubkey,
        metadata: {
          name: name,
          uri: metadata_uri,
          sellerFeeBasisPoints: 0,
          collection: { key: collectionMintPubkey, verified: true },
          creators: [
            { address: umi.identity.publicKey, verified: true, share: 100 },
          ],
        },
      });
      console.timeEnd("Mint to Collection"); // End timer for minting to collection
      console.time("Send and Confirm");
      mintTx = await transaction.sendAndConfirm(umi, {
        send: {
          skipPreflight: true,
        },
        confirm: {
          commitment: "confirmed",
        },
      });
      console.timeEnd("Send and Confirm"); // End timer for sending and confirming
      console.timeEnd(`Minting NFT - Attempt ${retries + 1}`); // End timer for minting

      console.log("NFT minted successfully");
      break; // Exit the retry loop if minting is successful
    } catch (error: any) {
      console.error(`Error minting NFT (attempt ${retries + 1}):`, error);
      retries++;
      if (retries >= maxRetries) {
        throw new Error(
          `Failed to mint NFT after ${maxRetries} attempts: ${error.message}`
        );
      }
      // Wait for a short time before retrying
      await new Promise((resolve) => setTimeout(resolve, 2000));
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
