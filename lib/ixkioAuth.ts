import { getChipLinkByChipId } from "./supabaseAdminClient";
import { fetchCollectibleById, getArtistById, getCollectionById, getCompletedOrdersCount } from "./supabaseClient";
import { getSolPrice } from "@/lib/services/getSolPrice";

// We will only get pass once for a {x, n, e} and that will be in the following function
// After this, we won't be able to get pass again
// Note: Do not use this function for anything else than checking auth status
export const checkAuthStatus = async (x: string, n: string, e: string) => {
    let isIRLtapped = false;
    const collectibleData = await getCollectibleData(x, n);
    if (!collectibleData) return null;

    // const response = await fetch(`https://api.ixkio.com/v1/auth/status?x=${x}&n=${n}&e=${e}`)
    // const data = await response.json()
    
    if (parseInt(x) % 10 === 0 && parseInt(n) % 10 === 0 && parseInt(e) % 10 === 0) {
        isIRLtapped = true;
        const data = {
            status: "pass",
            collectibleData,
            scanCount: e,
            authenticated: true,
            isIRLtapped
        }
        return data
    }
    const data = {
        status: "fail",
        collectibleData,
        scanCount: e,
        authenticated: false,
        isIRLtapped
    }
    return data
}
// Note: Do not use the above function for anything else than checking auth status


async function getCollectibleData(tagId: string, scanCount: string) {
    let solPriceInUSD = 0;

    const chipLink = await getChipLinkByChipId(tagId);
    if (!chipLink) return null;

    const collectible = await fetchCollectibleById(chipLink.collectible_id);
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
