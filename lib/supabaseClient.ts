import { AuthError, createClient, User } from '@supabase/supabase-js';
import { Database } from './types/database.types';
import { isSignatureValid } from './nfcVerificationHellper';
import { GalleryItem } from '@/app/gallery/galleryGrid';
import { resolveSolDomain } from '@/app/api/collection/collection.helper';
import { Connection } from '@solana/web3.js';
import { pinata } from './pinataConfig';


const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

const connection = new Connection(process.env.NEXT_PUBLIC_RPC_URL!);

export type Collection = {
    id: number;
    name: string;
    description: string;
    artist: number;
    collectibles?: Collectible[];
    metadata_uri?: string;
    collection_mint_public_key?: string;
    merkle_tree_public_key?: string;
};

export enum QuantityType {
    Unlimited = "unlimited",
    Single = "single",
    Limited = "limited",
}

export enum Brand {
    StreetMint = "StreetMint",
    IRLS = "IRLS",
}

export type Collectible = {
    id: number;
    name: string;
    description: string;
    primary_image_url: string;
    quantity_type: QuantityType;
    quantity: number | null;
    creator_royalty_array?: { creator_wallet_address: string; royalty_percentage: number; name: string; }[] | null;
    price_usd: number;
    location: string | null;
    location_note: string | null;
    gallery_urls: string[];
    metadata_uri: string | null;
    nfc_public_key: string | null;
    mint_start_date: string | null;
    mint_end_date: string | null;
    airdrop_eligibility_index: number | null;
    whitelist: boolean;
    cta_enable: boolean;
    cta_title: string | null;
    cta_description: string | null;
    cta_logo_url: string | null;
    cta_text: string | null;
    cta_link: string | null;
    cta_has_email_capture: boolean;
    cta_has_text_capture: boolean;
    cta_email_list: { [key: string]: string }[];
    cta_text_list: { [key: string]: string }[];
    enable_card_payments?: boolean;
    stripe_price_id?:string
    is_irls: boolean | null;
    is_video: boolean | null;
};

interface Order {
    id: string;
    wallet_address: string;
    collectible_id: number;
    collection_id: number;
    status: string;
    price_usd: number;
    nft_type: string;
    max_supply: number;
    mint_signature: string;
    transaction_signature: string;
    device_id: string;
    // Add other fields as necessary
}

export type PopulatedCollection = {
    id: number;
    name: string;
    description: string;
    collectible_image_urls: string[];
}

export type Artist = {
    id: number;
    username: string;
    bio: string;
    email: string;
    avatar_url: string;
    x_username?: string | null;
    instagram_username?: string | null;
    linkedin_username?: string | null;
    farcaster_username?: string | null;
    wallet_address: string;
};

export type CollectibleDetailed = Collectible & {
    collection: Collection;
    artist: Artist;
}

export type ArtistWithoutWallet = Omit<Artist, 'wallet_address'>;

export const createFetch =
    (options: Pick<RequestInit, "next" | "cache">) =>
        (url: RequestInfo | URL, init?: RequestInit) => {
            return fetch(url, {
                ...init,
                ...options,
            });
        };

export const supabase = createClient<Database>(supabaseUrl!, supabaseAnonKey!, {
    global: {
        fetch: createFetch({
            cache: 'no-store',
        }),
    },
},);



const getAuthenticatedUser = async (): Promise<{ user: User | null; error: AuthError | null }> => {
    const {
        data: { user },
        error: userError,
    } = await supabase.auth.getUser();

    if (userError) {
        console.error("Error fetching user:", userError);
        return { user: null, error: userError };
    }

    if (!user || !user.user_metadata) {
        return { user: null, error: null };
    }

    return { user, error: null };
};

export const createCollection = async (collection: Omit<Collection, 'collectibles'>): Promise<Collection | null> => {
    const { user, error: authError } = await getAuthenticatedUser();
    if (!user || authError) {
        return null;
    }

    // Create metadata for the collection
    const collectionMetadata = {
        name: collection.name,
        description: collection.description,
        external_url: process.env.NEXT_PUBLIC_SITE_URL || "https://street-mint-client.vercel.app/",
        properties: {
            category: "image"
        }
    };
    // Upload collection metadata to Pinata
    const collectionMetadataFileName = `${Date.now()}-collection-metadata.json`;
    const metadataFile = new File([JSON.stringify(collectionMetadata)], collectionMetadataFileName, { type: 'application/json' });
    let result = null;
    try {
        result = await uploadFileToPinata(metadataFile);
        if (!result) {
            throw new Error('Failed to upload collection metadata to Pinata');
        }
    } catch (error) {
        console.error('Error uploading collection metadata:', error);
        return null;
    }

    const collectionMetadataUri = result;

    // Add the on-chain data to the collection object
    const collectionToInsert = {
        ...collection,
        metadata_uri: collectionMetadataUri,
    };

    const { data: collectionData, error: collectionError } = await supabase
        .from('collections')
        .insert({
            artist: collectionToInsert.artist,
            description: collectionToInsert.description,
            id: collectionToInsert.id,
            name: collectionToInsert.name,
            metadata_uri: collectionToInsert.metadata_uri,
        })
        .select();

    if (collectionError) {
        console.error('Error creating collection:', collectionError);
        return null;
    }

    if (collectionData[0]) {
        return collectionData[0] as Collection;
    }
    return null;
};

export const createCollectible = async (collectible: Omit<Collectible, 'id'>, collectionId: number): Promise<Collectible | null> => {
    const nftMetadata = {
        name: collectible.name,
        description: collectible.description,
        image: collectible.primary_image_url,
        external_url: "https://streetmint.xyz/",
        properties: {
            files: [
                {
                    uri: collectible.primary_image_url,
                    type: "image/jpg"
                },
                ...collectible.gallery_urls.map(url => ({
                    uri: url,
                    type: "image/jpg"
                }))
            ],
            category: "image"
        }
    };

    const nftMetadataFileName = `${Date.now()}-${collectible.name}-metadata.json`;

    // Create a JSON file from the NFT metadata
    const nftMetadataFile = new File([JSON.stringify(nftMetadata)], nftMetadataFileName, {
        type: "application/json",
    });

    // Upload the JSON file to Pinata
    const metadataUrl = await uploadFileToPinata(nftMetadataFile);

    if (!metadataUrl) {
        console.error('Error uploading NFT metadata to Pinata');
        return null;
    }


    const collectibleToInsert = {
        ...collectible,
        collection_id: collectionId,
        metadata_uri: metadataUrl
    };

    const { data: insertedCollectible, error: nftError } = await supabase
        .from('collectibles')
        .insert(collectibleToInsert)
        .select();

    if (nftError) {
        console.error('Error creating collectible:', nftError);
        return null;
    }

    if (insertedCollectible && insertedCollectible[0]) {
        return insertedCollectible[0] as Collectible;
    }
    return null;
};

export const uploadFileToPinata = async (file: File) => {
    try {
        const { user, error: authError } = await getAuthenticatedUser();
        if (!user || authError) {
            return null;
        }
        const fileName = `${Date.now()}-${file.name}`;
        const uploadData = await pinata.upload.file(file, { metadata: { name: fileName } }).key(process.env.NEXT_PUBLIC_PINATA_JWT!)
        const url = await pinata.gateways.convert(uploadData.IpfsHash)
        console.log(url)
        return url;
    } catch (error) {
        console.error('Error uploading image:', error);
        return null;
    }
};



export const getArtistById = async (id: number): Promise<Artist | null> => {
    const { data, error } = await supabase
        .from("artists")
        .select("*")
        .eq("id", id)
        .single();

    if (error) {
        console.error("Error fetching artist:", error);
        return null;
    }

    return data;
};


export const fetchProfileData = async () => {
    const { user, error: authError } = await getAuthenticatedUser();

    if (!user || authError) {
        return { exists: false, data: null, error: authError || null };
    }

    const { data, error } = await supabase
        .from("artists")
        .select("*")
        .eq("wallet_address", user.user_metadata.wallet_address)
        .single();

    if (error) {
        console.error("Error fetching profile:", error);
        return { exists: false, data: null, error };
    }
    return { exists: true, data: data, error: null };
};

export const checkUsernameAvailability = async (username: string) => {
    const { data, error } = await supabase
        .from("artists")
        .select("username")
        .eq("username", username)
        .single();
    if (error) {
        if (error.code === 'PGRST116') {
            // PGRST116 means no rows returned, which means the username is available
            return { available: true, error: null };
        }
        console.error("Error checking username:", error);
        return { available: false, error };
    }

    // If data is not null, it means the username already exists
    return { available: !data, error: null };
};

export const fetchCollectibleById = async (id: number) => {
    const { data, error } = await supabase
        .from("collectibles")
        .select("*")
        .eq("id", id)
        .single();

    if (error) {
        console.error("Error fetching collectible:", error);
        return null;
    }

    return data;
};

export const updateCollectible = async (collectible: Collectible): Promise<{ success: boolean; error: Error | null }> => {
    const { user, error: authError } = await getAuthenticatedUser();
    if (!user || authError) {
        return { success: false, error: authError || null };
    }
    const { error } = await supabase
        .from('collectibles')
        .update(collectible)
        .eq('id', collectible.id);

    if (error) {
        console.error("Error updating collectible:", error);
        return { success: false, error: error as unknown as Error };
    }

    return { success: true, error: null };
};

export const updateProfile = async (profileData: Artist) => {
    const { user, error: authError } = await getAuthenticatedUser();
    if (!user || authError) {
        return { exists: false, data: null, error: authError || null };
    }
    const { data, error, } = await supabase
        .from("artists")
        .update(profileData)
        .eq("wallet_address", user.user_metadata.wallet_address);

    return { data, error };
};

export const createProfile = async (profileData: Artist) => {
    const { user, error: authError } = await getAuthenticatedUser();
    if (!user || authError) {
        return { exists: false, data: null, error: authError || null };
    }
    const { data, error } = await supabase.from("artists").insert({ ...profileData, collections: [] });
    return { data, error };
};

export const getCollectionsByArtistId = async (artistId: number): Promise<PopulatedCollection[]> => {
    let query = supabase.from("collections").select("*");

    if (artistId) {
        query = query.eq("artist", artistId);
    }

    const { data, error } = await query;

    if (error) throw error;

    const transformedData = await Promise.all(data.map(async (collection) => {
        const collectibles = await fetchCollectiblesByCollectionId(collection.id);
        return {
            id: collection.id,
            name: collection.name,
            description: collection.description,
            collectible_image_urls: collectibles?.map(collectible => collectible.primary_image_url) || []
        };
    }));

    return transformedData;
};


export const getAllCollections = async (): Promise<PopulatedCollection[]> => {
    const { data, error } = await supabase.from("collections").select("*");

    if (error) throw error;

    const transformedData = await Promise.all(data.map(async (collection) => {
        const collectibles = await fetchCollectiblesByCollectionId(collection.id);
        return {
            id: collection.id,
            name: collection.name,
            description: collection.description,
            collectible_image_urls: collectibles?.map(collectible => collectible.primary_image_url) || []
        };
    }));

    return transformedData;
};

export const getCollectionById = async (id: number) => {
    const { data, error } = await supabase.from("collections").select("*").eq("id", id).single();

    if (error) {
        console.error("Error fetching collection:", error);
        return null;
    }
    return data;
};

export const getArtistPassword = async (id: number) => {
    const { data, error } = await supabase.from("artists").select("app_password").eq("id", id).single();

    if (error) {
        console.error("Error fetching collection:", error);
        return null;
    }
    return data;
};

export const fetchCollectiblesByCollectionId = async (collectionId: number) => {
    const { data, error } = await supabase.from("collectibles").select("*").eq("collection_id", collectionId);
    if (error) {
        console.error("Error fetching collectibles:", error);
        return null;
    }
    return data;
};

export const fetchAllCollectibles = async (offset: number = 0, limit: number = 10) => {
    const { data, error } = await supabase
        .from("collectibles")
        .select(`
            id,
            name,
            description,
            primary_image_url,
            quantity_type,
            quantity,
            price_usd,
            location,
            location_note,
            gallery_urls,
            metadata_uri,
            nfc_public_key,
            mint_start_date,
            mint_end_date,
            airdrop_eligibility_index,
            whitelist,
            collection_id,
            created_at,
            cta_enable,
            cta_title,
            cta_description,
            cta_logo_url,
            cta_text,
            cta_link,
            cta_has_email_capture,
            cta_has_text_capture,
            cta_email_list,
            cta_text_list,
            is_irls,
            is_video
        `)
        .range(offset, offset + limit - 1)
        .order('created_at', { ascending: false });

    if (error) {
        console.error("Error fetching all collectibles:", error);
        return null;
    }

    const allCollectibles : CollectibleDetailed[] = (await Promise.all(data.map(async (collectible) => {
        const collection = await getCollectionById(collectible.collection_id);
        if (!collection) {
            console.error("Error fetching collection:", collection);
            return null;
        }
        const artist = await getArtistById(collection.artist);
        if (!artist) {
            console.error("Error fetching artist:", artist);
            return null;
        }
        return {
            ...collectible,
            collection,
            artist
        } as CollectibleDetailed;
    }))).filter((item): item is CollectibleDetailed => item !== null);

    const { count } = await supabase
        .from("collectibles")
        .select("id", { count: 'exact', head: true }) as { count: number | null };

    return {
        collectibles: allCollectibles,
        total: count || 0,
        hasMore: offset + limit < (count || 0)
    };
};

export async function checkMintEligibility(walletAddress: string, collectibleId: number, deviceId: string): Promise<{ eligible: boolean; reason?: string, isAirdropEligible?: boolean }> {
    try {
        // Check if the NFT is still available and get its details
        // Check if the wallet address is a .sol domain
        let resolvedWalletAddress = walletAddress;
        if (walletAddress.endsWith('.sol')) {
            try {
                resolvedWalletAddress = await resolveSolDomain(connection, walletAddress);
            } catch (error) {
                console.error("Error resolving .sol domain:", error);
                return { eligible: false, reason: 'Failed to resolve .sol domain' };
            }
        }

        // Use the resolved wallet address for the rest of the checks
        const { data: collectible, error: collectibleError } = await supabase
            .from('collectibles')
            .select('quantity, quantity_type, mint_start_date, mint_end_date,airdrop_eligibility_index')
            .eq('id', collectibleId)
            .single();

        if (collectibleError) throw collectibleError;
        // Get the count of existing orders for this collectible
        const { count, error: countError } = await supabase
            .from('orders')
            .select('id', { count: 'exact', head: true })
            .eq('collectible_id', collectibleId)
            .eq('status', 'completed');

        console.log("Count of existing orders for collectible ", collectibleId, " is ", count);

        if (countError) throw countError;

        // Check availability based on NFT type
        if (collectible.quantity_type === 'single') {
            if (count && count > 0) {
                return { eligible: false, reason: 'This 1 of 1 collectible has already been minted.' };
            }
        } else if (collectible.quantity_type === 'limited') {
            if (collectible.quantity && count && count >= collectible.quantity) {
                return { eligible: false, reason: 'All editions of this limited NFT have been minted.' };
            }
        }

        // Check if the wallet has already minted this NFT
        const { data: existingOrder, error: orderError } = await supabase
            .from('orders')
            .select('id, status')
            .eq('wallet_address', resolvedWalletAddress)
            .eq('collectible_id', collectibleId)
            .in('status', ['completed', 'pending'])
            .single();

        if (orderError && orderError.code !== 'PGRST116') throw orderError; // PGRST116 means no rows returned

        console.log("existingOrder", existingOrder);

        if (existingOrder) {
            return { eligible: false, reason: 'You have already minted this NFT.' };
        }

        // Check if the device has been used to mint this NFT before
        const { data: existingDeviceMint, error: deviceError } = await supabase
            .from('orders')
            .select('id, status')
            .eq('device_id', deviceId)
            .eq('collectible_id', collectibleId)
            .in('status', ['completed', 'pending'])
            .single();


        if (deviceError && deviceError.code !== 'PGRST116') throw deviceError;
        if (existingDeviceMint) {
            console.log("Device has already been used to mint this NFT", { "deviceID": deviceId, "walletAddress": walletAddress, "collectibleId": collectibleId });
            return { eligible: false, reason: 'This device has already been used to mint this NFT.' };
        }

        //CHECK FOR MINT START AND END DATE
        const mintStartDateUTC = collectible.mint_start_date ? new Date(collectible.mint_start_date) : null;
        const mintEndDateUTC = collectible.mint_end_date ? new Date(collectible.mint_end_date) : null;

        const nowUTC = new Date();

        // Check if minting has started
        if (mintStartDateUTC && nowUTC < mintStartDateUTC) {
            return { eligible: false, reason: 'Minting not started yet.' };
        }

        // Check if the minting period has ended
        if (mintEndDateUTC && nowUTC > mintEndDateUTC) {
            return { eligible: false, reason: 'Minting period has ended.' };
        }

        let isAirdropEligible = false;
        if (collectible.airdrop_eligibility_index) {
            isAirdropEligible = collectible.airdrop_eligibility_index === count! + 1;
        }

        // If all checks pass, the user is eligible to mint
        return { eligible: true, isAirdropEligible };
    } catch (error) {
        return { eligible: false, reason: 'Error checking mint eligibility.' };
    }
}

export async function updateOrderAirdropStatus(orderId: string, airdropWon: boolean) {
    try {
        const { data, error } = await supabase
            .from('orders')
            .update({ airdrop_won: airdropWon })
            .eq('id', orderId)
            .select()
            .single()

        if (error) {
            console.error("Error updating order airdrop status:", error);
            throw error;
        }

        console.log("Order airdrop status updated to true won by user ", data.wallet_address, " for order id ", data.id);
        return data;
    } catch (error) {
        console.error("Error in updateOrderAirdropStatus:", error);
        throw error;
    }
}


export async function getExistingOrder(walletAddress: string, collectibleId: number) {
    try {
        const { data, error } = await supabase
            .from('orders')
            .select('*')
            .eq('wallet_address', walletAddress)
            .eq('collectible_id', collectibleId)
            .eq('status', 'completed')
            .single();

        if (error) {
            if (error.code === 'PGRST116') {
                // No order found
                return null;
            }
            throw error;
        }

        return data;
    } catch (error) {
        console.error("Error fetching existing order:", error);
        throw error;
    }
}



export async function getCompletedOrdersCount(collectibleId: number): Promise<number> {
    const { count, error } = await supabase
        .from('orders')
        .select('*', { count: 'exact', head: true })
        .eq('collectible_id', collectibleId)
        .eq('status', 'completed');

    if (error) {
        console.error('Error fetching completed orders count:', error);
        return 0;
    }

    return count || 0;
}

export async function getGalleryInformationByTokenAddresses(tokenAddresses: string[]) {
    const { data, error } = await supabase
        .from('orders')
        .select(`
            mint_address,
            created_at,
            collectibles(name, primary_image_url, quantity_type, location),
            collections(name)
        `)
        .in('mint_address', tokenAddresses)
        .eq('status', 'completed');

    if (error) {
        console.error('Error fetching gallery information:', error);
        return [];
    }

    // Format the returned data to include only the relevant fields
    const formattedData: GalleryItem[] = data.map((order: any) => ({
        imageUrl: order.collectibles.primary_image_url,
        collectibleName: order.collectibles.name,
        collectionName: order.collections.name,
        quantityType: order.collectibles.quantity_type,
        mintAddress: order.mint_address,
        locationMinted: order.collectibles.location,
        orderDate: order.created_at
    }));

    return formattedData;
}