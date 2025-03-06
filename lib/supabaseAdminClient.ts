'use server'

import { createClient } from "@supabase/supabase-js";
import { createFetch, fetchCollectibleById, getCollectionById, getArtistById, Collectible } from "./supabaseClient";
import { Database } from "./types/database.types";
import { isSignatureValid } from "./nfcVerificationHellper";
import Stripe from "stripe";


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
    active: boolean;
    created_at: string;
}

export type ChipLinkDetailed = ChipLink & {
    metadata: {
    artist: string;
    location: string;
    location_note: string;
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

export async function getAllChipLinks() {
    console.log("getAllChipLinks");
    const supabaseAdmin = await getSupabaseAdmin();
    const { data, error } : { data: ChipLink[] | null, error: any } = await supabaseAdmin
        .from('chip_links')
        .select(`id, chip_id, collectible_id, active, created_at`)
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

export async function createChipLink(chipLink: ChipLinkCreate): Promise<boolean> {
    const supabaseAdmin = await getSupabaseAdmin();
    const { error }: { error: any } = await supabaseAdmin
        .from('chip_links')
        .insert({
            chip_id: chipLink.chip_id,
            collectible_id: chipLink.collectible_id,
            active: chipLink.active,
        });

    if (error) {
        console.error('Error creating chip link:', error);
        return false;
    }
    return true;
}

export async function updateChipLink(id: number, chipLink: ChipLink) {
    const supabaseAdmin = await getSupabaseAdmin();
    const { data, error }: { data: ChipLink | null, error: any } = await supabaseAdmin
        .from('chip_links')
        .update({
            chip_id: chipLink.chip_id,
            collectible_id: chipLink.collectible_id,
            active: chipLink.active,
        })
        .eq('id', id);

    if (error) {
        console.error('Error updating chip link:', error);
        return null;
    }
    return data;
}

export async function deleteChipLink(id: number) {
    const supabaseAdmin = await getSupabaseAdmin();
    const { error }: { error: any } = await supabaseAdmin.from('chip_links').delete().eq('id', id);
    if (error) {
        console.error('Error deleting chip link:', error);
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