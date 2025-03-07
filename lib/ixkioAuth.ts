import { getChipLinkByChipId } from "./supabaseAdminClient";
import { fetchCollectibleById, getArtistById, getCollectionById, getCompletedOrdersCount } from "./supabaseClient";
import { recordChipTap } from "./supabaseAdminClient";
import { getSolPrice } from "@/lib/services/getSolPrice";
import { v4 as uuidv4 } from "uuid";
import axios from "axios";
const AUTH_API_URL = "https://api.ixkio.com/v1/t";
const IRLS_REDIRECT_URL = "https://www.irls.xyz/v1";

// We will only get pass once for a {x, n, e} and that will be in the following function
// After this, we won't be able to get pass again
// Note: Do not use this function for anything else than checking auth status
export const checkAuthStatus = async (x: string, n: string, e: string, isCurrentIRLS: boolean) => {
  let collectibleData;
  let resultData;
  let isIRLtapped = false;

  try {
    const AUTH_INSTANCE_URL = `${AUTH_API_URL}?x=${x}&n=${n}&e=${e}`;

    collectibleData = await getCollectibleData(x, n);
    if (!collectibleData) return null;

    if (!isCurrentIRLS && collectibleData.collectible.is_irls) {
      const redirectUrl = `${IRLS_REDIRECT_URL}?x=${x}&n=${n}&e=${e}`;
      resultData = {
        status: "wait",
        collectibleData,
        isIRLtapped: false,
        authenticated: false,
        is_irls: true,
        redirectUrl
      }
      return resultData;
    }

    const response = await axios.get(AUTH_INSTANCE_URL, {
        headers: {
            "Content-Type": "application/json",
        },
    });

    if (response.status !== 200) {
        throw new Error("Failed to authenticate with ixkio");
    }

    // const data : {
    //   UID: string;
    //   xuid: string;
    //   response: string;
    // } = response.data;

    const data = {
      UID: "123",
      xuid: x,
      response: "pass"
    }

  

    console.log("ixkio auth data", data);
    
    if (data && data.xuid === x && data.response && data.response.toLowerCase() === "pass") {
      const initialUuid = uuidv4();
      let recordSuccess;
      if (collectibleData.collectible.is_light_version) {
        recordSuccess = await recordChipTap(x, n, e, initialUuid, true);
      } else {
        recordSuccess = await recordChipTap(x, n, e, initialUuid);
      }
      console.log("recordSuccess", recordSuccess);
      if (!recordSuccess) {
        throw new Error("Failed to record chip tap");
      }
        isIRLtapped = true; // Only set to true here, since we are using the chip tap for authentication
        resultData = {
            status: "pass",
            collectibleData,
            scanCount: e,
            authenticated: true,
            isIRLtapped,
            is_irls: false
        };
    }
    else {
      resultData = {
        status: "fail",
        collectibleData,
        scanCount: 0,
        authenticated: false,
        isIRLtapped,
        is_irls: false
    };
  }
    return resultData
  } catch (error) {
    console.error("Error checking auth status", error);
    if (collectibleData) {
      resultData = {
        status: "fail",
        collectibleData,
        scanCount: 0,
        authenticated: false,
        isIRLtapped,
        is_irls: false
      };
      return resultData;
    }
    return null;
  }
}
// Note: Do not use the above function for anything else than checking auth status


async function getCollectibleData(tagId: string, scanCount: string) {
    let solPriceInUSD = 0;

    const chipLink = await getChipLinkByChipId(tagId);
    if (!chipLink) return null;

    const collectible = await fetchCollectibleById(chipLink.collectible_id || 0);
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
