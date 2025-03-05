import { getLightOrderBySignatureCode } from "./supabaseAdminClient";
import { fetchCollectibleById, getArtistById, getCollectionById, getCompletedOrdersCount } from "./supabaseClient";
import { getSolPrice } from "@/lib/services/getSolPrice";

export const checkLightVersionClaimAuthStatus = async (signatureCode: string) => {
  let collectibleData;

  try {
    const lightOrder = await getLightOrderBySignatureCode(signatureCode);

    if (!lightOrder) return {
        success: false,
        status: "fail",
        reason: "Invalid signature code",
        lightOrder: null,
        collectibleData: null,
    };

    if (lightOrder.status != "pending") return {
        success: false,
        status: "pass",
        reason: "Order is either completed or failed",
        lightOrder: null,
        collectibleData: null,
    };

    if (!lightOrder.collectible_id) return {
        success: false,
        status: "fail",
        reason: "Collectible ID is not set",
        lightOrder: null,
        collectibleData: null,
    };

    collectibleData = await getCollectibleData(lightOrder.collectible_id);
    if (!collectibleData) return {
        success: false,
        status: "fail",
        reason: "Collectible data not found",
        lightOrder: null,
        collectibleData: null,
    };

    return {
        success: true,
        status: "success",
        reason: null,
        lightOrder,
        collectibleData,
    };

  } catch (error) {
    console.error("Error checking light version claim auth status:", error);
    return {
        success: false,
        status: "fail",
        reason: "Error checking light version claim auth status",
        lightOrder: null,
        collectibleData: null,
    };
  }
}


async function getCollectibleData(collectibleId: number) {
    let solPriceInUSD = 0;

    const collectible = await fetchCollectibleById(collectibleId);
    if (!collectible) return null;
  
    // Only fetch SOL price if usdc_price is defined and greater than 0
    if (collectible.price_usd && collectible.price_usd > 0) {
      const solPrice = await getSolPrice();
      if (!solPrice) {
        return null;
      }
      solPriceInUSD = solPrice;
    }
  
    const collection = await getCollectionById(collectible.collection_id);
    if (!collection) return null;
  
    const artist = await getArtistById(collection.artist);
    if (!artist) return null;
  
    // Calculate NFT price in SOL
    const priceInSOL = collectible.price_usd / solPriceInUSD;
  
    // Calculate remaining quantity for limited editions
    let remainingQuantity = null;
    if (collectible.quantity_type === "limited") {
      remainingQuantity = collectible.quantity;
    }
    const soldCount = await getCompletedOrdersCount(collectible.id);
  
    // if (collectible.price_usd == 0 && rnd && sign) {
    //   const recordSuccess = await recordNfcTap(rnd);
    //   if (!recordSuccess) {
    //     return;
    //   }
    // }
  
    return {
      collectible,
      collection,
      artist,
      priceInSOL,
      remainingQuantity,
      soldCount,
    };
  }
