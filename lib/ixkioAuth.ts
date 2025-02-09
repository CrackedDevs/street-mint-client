import { getChipLinkByChipId } from "./supabaseAdminClient";
import { fetchCollectibleById, getArtistById, getCollectionById, getCompletedOrdersCount } from "./supabaseClient";
import { getSolPrice } from "@/lib/services/getSolPrice";
import axios from "axios";
const AUTH_API_URL = "https://api.ixkio.com/v1/t";

// We will only get pass once for a {x, n, e} and that will be in the following function
// After this, we won't be able to get pass again
// Note: Do not use this function for anything else than checking auth status
export const checkAuthStatus = async (x: string, n: string, e: string) => {
  try {

    let isIRLtapped = false;
    const AUTH_INSTANCE_URL = `${AUTH_API_URL}?x=${x}&n=${n}&e=${e}`;
    let resultData;

    const collectibleData = await getCollectibleData(x, n);
    if (!collectibleData) return null;

    const response = await axios.get(AUTH_INSTANCE_URL, {
        headers: {
            "Content-Type": "application/json",
        },
    });

    if (response.status !== 200) {
        return null;
    }

    const data : {
      UID: string;
      xuid: string;
      response: string;
    } = response.data;

    console.log("ixkio auth data", data);
    
    if (data && data.xuid === x && data.response.toLowerCase() === "pass") {
        isIRLtapped = true;
        resultData = {
            status: "pass",
            collectibleData,
            scanCount: e,
            authenticated: true,
            isIRLtapped
        };
    }
    else {
      resultData = {
        status: "fail",
        collectibleData,
        scanCount: e,
        authenticated: false,
        isIRLtapped
    };
  }
    return resultData
  } catch (error) {
    console.error("Error checking auth status", error);
    return null;
  }
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
