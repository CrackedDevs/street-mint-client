import { getSignatureCodeAuth } from "./supabaseAdminClient";
import { fetchCollectibleById, getArtistById, getCollectionById, getCompletedOrdersCount } from "./supabaseClient";
import { getSolPrice } from "@/lib/services/getSolPrice";

export const verifySignatureCode = async (adminSignatureCode: string) => {
    let collectibleData;
    let resultData;

    if (!adminSignatureCode) return null;

    try {
        resultData = await getSignatureCodeAuth(adminSignatureCode);

        if (!resultData || !resultData.collectible_id || !resultData.active) {
            resultData = {
                status: "fail",
                collectibleData: null,
                isIRLtapped: false,
                authenticated: false,
                adminSignatureAuthenticated: false,
                is_irls: false,
                redirectUrl: null,
            };

            return resultData;
        }

        collectibleData = await getCollectibleData(resultData.collectible_id);
        if (!collectibleData) return null;

        resultData = {
            status: "pass",
            collectibleData,
            isIRLtapped: true,
            authenticated: true,
            adminSignatureAuthenticated: true,
            is_irls: false,
            redirectUrl: null,
        };

        return resultData
    } catch (error) {
        console.error("Error checking auth status", error);
        if (collectibleData) {
            resultData = {
                status: "fail",
                collectibleData,
                authenticated: false,
                isIRLtapped: false,
                is_irls: false,
                redirectUrl: null,
                adminSignatureAuthenticated: false,
            };
            return resultData;
        }
        return null;
    }
}

async function getCollectibleData(collectibleId: number) {
    let solPriceInUSD = 0;

    if (!collectibleId) return null;

    const collectible = await fetchCollectibleById(Number(collectibleId));
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

    return {
        collectible,
        collection,
        artist,
        priceInSOL,
        remainingQuantity,
        soldCount,
    };
}