'use server'

import { createClient } from "@supabase/supabase-js";
import { createFetch, fetchCollectibleById, getCollectionById, getArtistById, Collectible, Sponsor, uploadFileToPinata } from "./supabaseClient";
import { Database } from "./types/database.types";
import { isSignatureValid } from "./nfcVerificationHellper";
import Stripe from "stripe";
import { BatchListing } from "./supabaseClient";

const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;

const supabaseAdmin = createClient<Database>(supabaseUrl!, supabaseServiceRoleKey!, {
    global: {
        fetch: createFetch({
            cache: 'no-store',
        }),
    },
});

export type ChipLink = {
    id: number;
    chip_id: string;
    collectible_id: number | null;
    batch_listing_id?: number | null;
    artists_id?: number | null | null;
    active: boolean;
    created_at: string;
    label?: string | null;
}

export type CollectibleBySignatureCode = {
    id: number;
    admin_signature_code: string;
    collectible_id: number;
    active: boolean;
}

export type ChipLinkDetailed = ChipLink & {
    metadata: {
    artist: string;
    location: string | null;
    location_note: string | null;
    collection_id: number;
    collectible_name: string;
    collectible_description: string;
    }
}

export type ChipTap = {
    id: number;
    x: string;
    n: string;
    e: string;
    server_auth: boolean;
    last_uuid: string;
}

export type LightOrder = {
    airdrop_won: boolean;
    collectible_id: number | null;
    collection_id: number | null;
    created_at: string | null;
    device_id: string | null;
    email: string;
    email_sent: boolean | null;
    id: string;
    last_uuid: string | null;
    max_supply: number | null;
    mint_address: string | null;
    mint_signature: string | null;
    nft_type: string | null;
    price_sol: number | null;
    price_usd: number | null;
    quantity: number | null;
    signature_code: string | null;
    status: string | null;
    transaction_signature: string | null;
    updated_at: string | null;
    wallet_address: string | null;
}

export type ChipLinkCreate = Omit<ChipLink, "id" | "created_at">;

export type ScheduledCollectibleChange = {
    id: number;
    chip_id: string | null;
    collectible_id: number | null;
    schedule_unix: number | null;
    executed: boolean | null;
    created_at: string;
}

export async function getSupabaseAdmin() {
    return supabaseAdmin;
}

export async function verifyNfcSignature(rnd: string, sign: string, pubKey: string): Promise<boolean> {
    const supabaseAdmin = await getSupabaseAdmin();

    if (!rnd || !sign || !pubKey) {
        return false;
    }
    const isValid = await isSignatureValid(rnd, sign, pubKey);
    if (!isValid) {
        console.log("NFC signature is not valid");
        return false;
    }

    const { data, error } = await supabaseAdmin
        .from('nfc_taps')
        .select('id')
        .eq('random_number', rnd)
        .single();

    if (error && error.code !== 'PGRST116') {
        console.error('Error checking NFC tap:', error);
        return false
    }
    if (data) {
        console.log("NFC tap already recorded");
        return false;
    }

    return true;
}

export async function recordNfcTap(rnd: string): Promise<boolean> {
    console.log("recordNfcTap", rnd);
    const supabaseAdmin = await getSupabaseAdmin();
    const { data, error } = await supabaseAdmin
        .from('nfc_taps')
        .insert({ random_number: rnd });

    console.log("data", data);
    if (error) {
        console.error('Error recording NFC tap:', error);
        return false;
    }
    return true;
}

export async function recordPaidChipTap(x: string, n: string, e: string): Promise<boolean> {
    const supabaseAdmin = await getSupabaseAdmin();
    const { data, error } = await supabaseAdmin
        .from('chip_taps_paid')
        .insert({ x, n, e });

    console.log("data", data);
    if (error) {
        console.error('Error recording paid Chip tap:', error);
        return false;
    }
    return true;
}

export async function recordChipTap(x: string, n: string, e: string, uuid: string, is_light_version: boolean = false): Promise<boolean> {
    const supabaseAdmin = await getSupabaseAdmin();
    const { data, error } = await supabaseAdmin
        .from('chip_taps')
        .insert({ x, n, e, server_auth: is_light_version ? true : false, last_uuid: uuid });

    console.log("data", data);
    if (error) {
        console.error('Error recording Chip tap:', error);
        return false;
    }
    return true;
}

export async function recordChipTapServerAuth(x: string, n: string, e: string, uuid: string): Promise<boolean> {
    const supabaseAdmin = await getSupabaseAdmin();
    const { data, error } = await supabaseAdmin
        .from('chip_taps')
        .update({ server_auth: true })
        .eq('x', x)
        .eq('n', n)
        .eq('e', e)
        .eq('last_uuid', uuid)
        .select();

    if (error) {
        console.error('Error recording Chip tap:', error);
        return false;
    }

    if (!data || data.length === 0) {
        console.error('No data found');
        return false;
    }

    console.log("chipTapServerAuth data", data);

    return true;
}

export async function getSignatureCodeAuth(adminSignatureCode: string) {
    const supabaseAdmin = await getSupabaseAdmin();
    const { data, error } : { data: CollectibleBySignatureCode | null, error: any } = await supabaseAdmin
        .from('admin_signature_codes')
        .select(`id, admin_signature_code, collectible_id, active`)
        .eq('admin_signature_code', adminSignatureCode)
        .eq('active', true)
        .single();
    if (error) {
        console.error('Error getting collectible by admin signature code:', error);
        return null;
    }
    return data;
}

// Do not use this function, since it is used for authentication and prevent race condition
export async function getChipTap(x: string, n: string, e: string, uuid: string): Promise<ChipTap | null> {
    const supabaseAdmin = await getSupabaseAdmin();

    const { data: chipTapData, error: chipTapError } = await supabaseAdmin
    .from('chip_taps')
    .select('id, last_uuid')
    .eq('x', x)
    .eq('n', n)
    .eq('e', e)
    .single();

    if (chipTapError) {
        console.error('Error getting chip tap:', chipTapError);
        return null;
    }

    const { data, error } = await supabaseAdmin
        .from('chip_taps')
        .update({ last_uuid: uuid })
        .eq('x', x)
        .eq('n', n)
        .eq('e', e)
        .select('id, last_uuid, x, n, e, server_auth')
        .single();

    console.log("chipTap data", data);
    if (error) {
        console.error('Error recording Chip tap:', error);
        return null;
    }
    return data;
}

export async function disconnectChipToCollectible(chipId: string) {
    const supabaseAdmin = await getSupabaseAdmin();
    const { error } = await supabaseAdmin
        .from('chip_links')
        .update({ collectible_id: null })
        .eq('chip_id', chipId);

    if (error) {
        console.error('Error disconnecting chip to collectible:', error);
        return false;
    }
    return true;
}

export async function getAllChipLinks() {
    console.log("getAllChipLinks");
    const supabaseAdmin = await getSupabaseAdmin();
    const { data, error } : { data: ChipLink[] | null, error: any } = await supabaseAdmin
        .from('chip_links')
        .select(`id, chip_id, collectible_id, artists_id, active, created_at, label`)
        .order('created_at', { ascending: false });

        if (error) {
            console.error('Error getting all chip links:', error);
            return null;
        }

        if (!data) {
            console.error('No data found');
            return [];
        }
    
    const allChipLinks : ChipLinkDetailed[] = (await Promise.all(data.map(async (chipLink) => {
        // If there's a collectible_id, fetch the collectible details
        if (chipLink.collectible_id) {
            if (chipLink.collectible_id === null) {
            return null;
        }
        const collectible = await fetchCollectibleById(chipLink.collectible_id);
            if (!collectible) {
                console.error("Error fetching collectible:", collectible);
                return null;
            }

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
                ...chipLink,
                metadata: {
                    collectible_name: collectible.name,
                    collectible_description: collectible.description,
                    artist: artist.username,
                    location: collectible.location,
                    location_note: collectible.location_note,
                    collection_id: collectible.collection_id,
                }
            } as ChipLinkDetailed;
        } 
        // If there's an artists_id but no collectible_id, fetch just the artist details
        else if (chipLink.artists_id) {
            const artist = await getArtistById(chipLink.artists_id);
            if (!artist) {
                console.error("Error fetching artist:", artist);
                return null;
            }

            return {
                ...chipLink,
                metadata: {
                    collectible_name: "",
                    collectible_description: "",
                    artist: artist.username,
                    location: null,
                    location_note: null,
                    collection_id: 0,
                }
            } as ChipLinkDetailed;
        }
        // If neither collectible_id nor artists_id, return with default metadata
        else {
            return {
                ...chipLink,
                metadata: {
                    collectible_name: "",
                    collectible_description: "",
                    artist: "Unassigned",
                    location: null,
                    location_note: null,
                    collection_id: 0,
                }
            } as ChipLinkDetailed;
        }
    }))).filter((item): item is ChipLinkDetailed => item !== null);

    return allChipLinks;
}

export async function getChipLinkByChipId(chipId: string) {
    const supabaseAdmin = await getSupabaseAdmin();
    const { data, error } : { data: ChipLink | null, error: any } = await supabaseAdmin
        .from('chip_links')
        .select(`id, chip_id, collectible_id, active, created_at`)
        .eq('chip_id', chipId)
        .single();
    if (error) {
        console.error('Error getting chip link by chip id:', error);
        return null;
    }
    return data;
}

export async function getLightOrderBySignatureCode(signatureCode: string) {
    const supabaseAdmin = await getSupabaseAdmin();
    const { data, error } : { data: LightOrder | null, error: any } = await supabaseAdmin
        .from('light_orders')
        .select(`id, signature_code, collectible_id, collection_id, created_at, device_id, email, email_sent, last_uuid, max_supply, mint_address, mint_signature, nft_type, price_sol, price_usd, quantity, status, transaction_signature, updated_at`)
        .eq('signature_code', signatureCode)
        .single();

    if (error) {
        console.error('Error getting light order by signature code:', error);
        return null;
    }
    return data;
}

export async function getChipLinkByCollectibleId(collectibleId: number) {
    const supabaseAdmin = await getSupabaseAdmin();
    const { data, error } : { data: ChipLink | null, error: any } = await supabaseAdmin
        .from('chip_links')
        .select(`id, chip_id, collectible_id, active, created_at`)
        .eq('collectible_id', collectibleId)
        .single();

    if (error) {
        console.error('Error getting chip link by collectible id:', error);
        return null;
    }
    return data;
}

export async function createChipLink(chipLink: ChipLinkCreate): Promise<{ success: boolean; error?: string }> {
    const supabaseAdmin = await getSupabaseAdmin();
    
    // First, check if the chip ID already exists
    const { data: existingChip, error: checkError } = await supabaseAdmin
        .from('chip_links')
        .select('id, chip_id, artists_id')
        .eq('chip_id', chipLink.chip_id)
        .single();
    
    if (checkError && checkError.code !== 'PGRST116') {
        // PGRST116 means no rows returned, which is what we want
        console.error('Error checking existing chip link:', checkError);
        return { success: false, error: 'Error checking if chip ID already exists' };
    }
    
    if (existingChip) {
        // Chip ID already exists, get the artist's username
        let artistInfo = "unknown artist";
        
        if (existingChip.artists_id) {
            // Fetch the artist's username
            const { data: artistData, error: artistError } = await supabaseAdmin
                .from('artists')
                .select('username')
                .eq('id', existingChip.artists_id)
                .single();
                
            if (!artistError && artistData) {
                artistInfo = `${artistData.username} (ID: ${existingChip.artists_id})`;
            } else {
                artistInfo = `artist ID ${existingChip.artists_id}`;
            }
        }
        
        console.log('Chip ID already exists:', existingChip);
        return { 
            success: false, 
            error: `Chip ID ${chipLink.chip_id} is already assigned to ${artistInfo}` 
        };
    }
    
    // If we get here, the chip ID doesn't exist, so create it
    const { error: insertError } = await supabaseAdmin
        .from('chip_links')
        .insert({
            chip_id: chipLink.chip_id,
            collectible_id: chipLink.collectible_id,
            batch_listing_id: chipLink.batch_listing_id,
            active: chipLink.active,
            artists_id: chipLink.artists_id,
            label: chipLink.label
        });

    if (insertError) {
        console.error('Error creating chip link:', insertError);
        return { success: false, error: 'Error creating chip link' };
    }
    
    return { success: true };
}

export async function updateChipLink(id: number, chipLink: ChipLink) {
    const supabaseAdmin = await getSupabaseAdmin();
    const { data, error }: { data: ChipLink[] | null, error: any } = await supabaseAdmin
        .from('chip_links')
        .update({
            chip_id: chipLink.chip_id,
            collectible_id: chipLink.collectible_id,
            batch_listing_id: chipLink.batch_listing_id,
            active: chipLink.active,
            label: chipLink.label,
        })
        .eq('id', id)
        .select();

    if (error) {
        console.error('Error updating chip link:', error);
        return null;
    }
    
    return data && data.length > 0 ? data[0] : null;
}

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

    const { data: insertedCollectible, error: nftError } = await supabaseAdmin
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

export async function deleteChipLink(id: number) {
    const supabaseAdmin = await getSupabaseAdmin();
    const { error } = await supabaseAdmin
        .from('chip_links')
        .delete()
        .eq('id', id);
    
    if (error) {
        console.error('Error deleting chip link:', error);
        return false;
    }
    
    return true;
}

export async function disconnectChipLink(id: number) {
    const supabaseAdmin = await getSupabaseAdmin();
    const { error } = await supabaseAdmin
        .from('chip_links')
        .update({ collectible_id: null, batch_listing_id: null })
        .eq('id', id);
    
    if (error) {
        console.error('Error disconnecting chip link:', error);
        return false;
    }
    
    return true;
}

export const createBatchListing = async (batchListing: Omit<BatchListing, 'id'>, collectionId: number, chipLinks: number[]): Promise<BatchListing | null> => {
    const nftMetadata = {
        name: batchListing.name,
        description: batchListing.description,
        image: batchListing.primary_image_url,
        external_url: "https://streetmint.xyz/",
        properties: {
            files: [
                {
                    uri: batchListing.primary_image_url,
                    type: "image/jpg"
                },
                ...batchListing.gallery_urls.map(url => ({
                    uri: url,
                    type: "image/jpg"
                }))
            ],
            category: "image"
        }
    };

    const nftMetadataFileName = `${Date.now()}-${batchListing.name}-metadata.json`;

    const nftMetadataFile = new File([JSON.stringify(nftMetadata)], nftMetadataFileName, {
        type: "application/json",
    });

    const metadataUrl = await uploadFileToPinata(nftMetadataFile);

    if (!metadataUrl) {
        console.error('Error uploading NFT metadata to Pinata');
        return null;
    }

    const batchListingToInsert = {
        ...batchListing,
        collection_id: collectionId,
        metadata_uri: metadataUrl
    };

    const { data: insertedBatchListing, error: nftError } = await supabaseAdmin
        .from('batch_listings')
        .insert(batchListingToInsert)
        .select();

    if (nftError) {
        console.error('Error creating collectible:', nftError);
        return null;
    }

    console.log('insertedBatchListing', insertedBatchListing);
    console.log('chipLinks', chipLinks);

    if (chipLinks.length > 0) {
        console.log('chipLinks', chipLinks);
        const { data: insertedChipLinks, error: chipLinksError } = await supabaseAdmin
            .from('chip_links')
            .update({ batch_listing_id: insertedBatchListing[0].id })
            .in('id', chipLinks)
            .select();

        console.log('insertedChipLinks', insertedChipLinks);

        if (chipLinksError) {
            console.error('Error updating chip links:', chipLinksError);
        }
    }

    if (insertedBatchListing && insertedBatchListing[0]) {
        return insertedBatchListing[0] as BatchListing;
    }
    return null;
};

export async function disconnectChipFromBatch(chipId: number) {
    const supabaseAdmin = await getSupabaseAdmin();
    const { error } = await supabaseAdmin
        .from('chip_links')
        .update({ batch_listing_id: null })
        .eq('id', chipId);

    if (error) {
        console.error('Error disconnecting chip from batch:', error);
        return false;
    }

    return true;
}

export async function getChipLinksByArtistId(artistId: number) {
    const supabaseAdmin = await getSupabaseAdmin();
    const { data, error } = await supabaseAdmin
        .from('chip_links')
        .select(`id, chip_id, collectible_id, active, created_at, artists_id, batch_listing_id, label`)
        .eq('artists_id', artistId)
        .order('created_at', { ascending: false });
    
    if (error) {
        console.error('Error getting chip links by artist ID:', error);
        return null;
    }
    
    return data;
}

export async function getAllArtists() {
  const supabaseAdmin = await getSupabaseAdmin();
  const { data, error } = await supabaseAdmin
    .from('artists')
    .select('id, username, email, avatar_url')
    .order('username');

  if (error) {
    console.error('Error getting all artists:', error);
    return null;
  }
  
  return data;
}

export async function getScheduledCollectibleChanges(chipId?: string) {
    const supabaseAdmin = await getSupabaseAdmin();
    
    let query = supabaseAdmin
        .from('collectible_schedule')
        .select('*')
        .eq('executed', false);
    
    if (chipId) {
        query = query.eq('chip_id', chipId);
    }
    
    const { data, error } = await query;
    
    if (error) {
        console.error('Error getting scheduled collectible changes:', error);
        return null;
    }
    
    return data;
}

export async function scheduleCollectibleChange(chipId: string, collectibleId: number, scheduleUnix: number) {
    const supabaseAdmin = await getSupabaseAdmin();
    
    // First, check if there are any existing scheduled changes for this chip
    const { data: existingSchedules, error: fetchError } = await supabaseAdmin
        .from('collectible_schedule')
        .select('id')
        .eq('chip_id', chipId)
        .eq('executed', false);
    
    if (fetchError) {
        console.error('Error checking for existing scheduled changes:', fetchError);
        return null;
    }
    
    // If there are existing scheduled changes, delete them
    if (existingSchedules && existingSchedules.length > 0) {
        const existingIds = existingSchedules.map(schedule => schedule.id);
        const { error: deleteError } = await supabaseAdmin
            .from('collectible_schedule')
            .delete()
            .in('id', existingIds);
        
        if (deleteError) {
            console.error('Error deleting existing scheduled changes:', deleteError);
            return null;
        }
    }
    
    // Now insert the new scheduled change
    const { data, error } = await supabaseAdmin
        .from('collectible_schedule')
        .insert({
            chip_id: chipId,
            collectible_id: collectibleId,
            schedule_unix: scheduleUnix,
            executed: false
        });
    
    if (error) {
        console.error('Error scheduling collectible change:', error);
        return null;
    }
    
    return data;
}

// New function to add a single scheduled change without deleting existing ones
export async function addScheduledCollectibleChange(chipId: string, collectibleId: number, scheduleUnix: number) {
    const supabaseAdmin = await getSupabaseAdmin();
    
    // Insert the new scheduled change
    const { data, error } = await supabaseAdmin
        .from('collectible_schedule')
        .insert({
            chip_id: chipId,
            collectible_id: collectibleId,
            schedule_unix: scheduleUnix,
            executed: false
        });
    
    if (error) {
        console.error('Error adding scheduled collectible change:', error);
        return null;
    }
    
    return data;
}

// Function to schedule multiple collectible changes for a chip (replaces all existing ones)
export async function scheduleMultipleCollectibleChanges(chipId: string, changes: Array<{ collectibleId: number; scheduleUnix: number }>) {
    const supabaseAdmin = await getSupabaseAdmin();
    
    // First, delete all existing scheduled changes for this chip
    const { error: deleteError } = await supabaseAdmin
        .from('collectible_schedule')
        .delete()
        .eq('chip_id', chipId)
        .eq('executed', false);
    
    if (deleteError) {
        console.error('Error deleting existing scheduled changes:', deleteError);
        return null;
    }
    
    // Now insert all the new scheduled changes
    const changesToInsert = changes.map(change => ({
        chip_id: chipId,
        collectible_id: change.collectibleId,
        schedule_unix: change.scheduleUnix,
        executed: false
    }));
    
    const { data, error } = await supabaseAdmin
        .from('collectible_schedule')
        .insert(changesToInsert);
    
    if (error) {
        console.error('Error scheduling multiple collectible changes:', error);
        return null;
    }
    
    return data;
}

export async function deleteScheduledCollectibleChange(id: number) {
    const supabaseAdmin = await getSupabaseAdmin();
    
    const { data, error } = await supabaseAdmin
        .from('collectible_schedule')
        .delete()
        .eq('id', id);
    
    if (error) {
        console.error('Error deleting scheduled collectible change:', error);
        return false;
    }
    
    return true;
}

export async function addStripeTransaction(status:string,sessionId:string,amount:number,session:Stripe.Checkout.Session){
    const supabaseAdmin = await getSupabaseAdmin();
const {data,error}=await supabaseAdmin.from('transactions').insert({
    status,
    session_id:sessionId,
    amount,
    transaction_dump:JSON.parse(JSON.stringify(session)),
})
if(error){
    console.error('Error adding stripe transaction:', error);
    throw error;
}
return data;
}

export async function updateStripTransaction(sessionId:string,status:string,orderId:string){
    const supabaseAdmin = await getSupabaseAdmin();
    const {data,error}=await supabaseAdmin.from('transactions').update({
        status,
        order_id:orderId
    }).eq('session_id',sessionId)   
    if(error){
        console.error('Error updating stripe transaction:', error);
        throw error;
    }
    return data;
}

export async function getOrderById(sessionId:string){
    const supabaseAdmin = await getSupabaseAdmin();
    const {data,error}=await supabaseAdmin.from('transactions').select('*').eq('session_id',sessionId).limit(1)

    if(error){
        console.error('Error getting session by id:', error);
        return null;
    }
    if(!data[0]){
        console.error("data not found for order")
    }
   const orderId = data[0].order_id
   if(!orderId){
    console.error("no orderid found")
    return
   }
   const {data:orderData, error:OrderError} = await supabaseAdmin.from('orders').select('*').eq('id',orderId)
   if(OrderError){
    console.error('Error getting order by id:', OrderError);
    return null;
   }
   if(!orderData[0]){
    console.error("no order data found")
    return null;
   }
   return orderData[0];
}

export async function getLightOrdersByEmail(email: string, page: number = 0, pageSize: number = 20) {
    const supabaseAdmin = await getSupabaseAdmin();
    const start = page * pageSize;
    
    const { data, error, count } = await supabaseAdmin
        .from('light_orders')
        .select('*, collectibles(name, primary_image_url)', { count: 'exact' })
        .eq('email', email)
        .order('created_at', { ascending: false })
        .range(start, start + pageSize - 1);

    if (error) {
        console.error('Error getting light orders by email:', error);
        return { orders: null, total: 0 };
    }

    return { 
        orders: data, 
        total: count || 0 
    };
}

export async function getAllLightOrders(page: number = 0, pageSize: number = 20, filters: { status?: string } = {}) {
    const supabaseAdmin = await getSupabaseAdmin();
    const start = page * pageSize;
    
    let query = supabaseAdmin
        .from('light_orders')
        .select('*, collectibles(name, primary_image_url, collections(name))', { count: 'exact' })
        .order('created_at', { ascending: false });
    
    // Apply filters if provided
    if (filters.status) {
        query = query.eq('status', filters.status);
    }
    
    const { data, error, count } = await query.range(start, start + pageSize - 1);

    if (error) {
        console.error('Error getting all light orders:', error);
        return { orders: null, total: 0 };
    }

    return { 
        orders: data, 
        total: count || 0 
    };
}

export async function getAllRegularOrders(page: number = 0, pageSize: number = 20, filters: { status?: string } = {}) {
    const supabaseAdmin = await getSupabaseAdmin();
    const start = page * pageSize;
    
    let query = supabaseAdmin
        .from('orders')
        .select('*, collectibles(name, primary_image_url, collections(name))', { count: 'exact' })
        .order('created_at', { ascending: false });
    
    // Apply filters if provided
    if (filters.status) {
        query = query.eq('status', filters.status);
    }
    
    const { data, error, count } = await query.range(start, start + pageSize - 1);

    if (error) {
        console.error('Error getting all regular orders:', error);
        return { orders: null, total: 0 };
    }

    return { 
        orders: data, 
        total: count || 0 
    };
}



export const createSponsor = async (sponsor: Omit<Sponsor, 'id' | 'created_at'>): Promise<Sponsor | null> => {
    try {
        const supabaseAdmin = await getSupabaseAdmin();
        const { data, error } = await supabaseAdmin
            .from('sponsors')
            .insert([sponsor])
            .select()
            .single();

        if (error) {
            console.error('Error creating sponsor:', error);
            return null;
        }

        return data;
    } catch (error) {
        console.error('Error creating sponsor:', error);
        return null;
    }
};

export const getSponsorsByArtistId = async (artistId: number): Promise<Sponsor[]> => {
    try {
        const supabaseAdmin = await getSupabaseAdmin();
        const { data, error } = await supabaseAdmin
            .from('sponsors')
            .select('*')
            .eq('artist_id', artistId);

        if (error) {
            console.error('Error fetching sponsors:', error);
            return [];
        }

        return data || [];
    } catch (error) {
        console.error('Error fetching sponsors:', error);
        return [];
    }
};

export const updateSponsor = async (sponsor: Sponsor): Promise<{ success: boolean; error: Error | null }> => {
    try {
        const supabaseAdmin = await getSupabaseAdmin();

        const { error } = await supabaseAdmin
            .from('sponsors')
            .update(sponsor)
            .eq('id', sponsor.id);

        if (error) {
            console.error('Error updating sponsor:', error);
            return { success: false, error: new Error(error.message) };
        }

        return { success: true, error: null };
    } catch (error) {
        console.error('Error updating sponsor:', error);
        return { success: false, error: error as Error };
    }
};

export const deleteSponsor = async (sponsorId: number): Promise<{ success: boolean; error: Error | null }> => {
    try {
        const supabaseAdmin = await getSupabaseAdmin();

        const { error } = await supabaseAdmin
            .from('sponsors')
            .delete()
            .eq('id', sponsorId);

        if (error) {
            console.error('Error deleting sponsor:', error);
            return { success: false, error: new Error(error.message) };
        }

        return { success: true, error: null };
    } catch (error) {
        console.error('Error deleting sponsor:', error);
        return { success: false, error: error as Error };
    }
};


export async function getSponsorImageByCollectibleId(collectibleId: any) {
    let collectible_sponsor_id = null;
    try {
        const { data: collectibleData, error: collectibleError } = await supabaseAdmin
            .from('collectibles')
            .select('sponsor_id')
            .eq('id', collectibleId)
            .single();
        collectible_sponsor_id = collectibleData?.sponsor_id;

        if (collectibleError) {
            throw new Error(`Error fetching collectible: ${collectibleError.message}`);
        }
        
        // If no sponsor_id, return null
        if (!collectible_sponsor_id) {
            return null;
        }
        
        const { data: sponsorData, error: sponsorError } = await supabaseAdmin
            .from('sponsors')
            .select('*')
            .eq('id', collectible_sponsor_id)
            .single()

        if (sponsorError) {
            throw new Error(`Error fetching sponsor: ${sponsorError.message}`);
        }
    
        // If no data or empty array, return null
        if (!sponsorData) {
            return null;
        }
        return sponsorData;

    } catch (error) {
        console.error('Error in getSponsorImageByCollectibleId:', error);
        return null;
    }
}

