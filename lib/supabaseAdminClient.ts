'use server'

import { createClient } from "@supabase/supabase-js";
import { createFetch, fetchCollectibleById, getCollectionById, getArtistById, Collectible } from "./supabaseClient";
import { Database } from "./types/database.types";
import { isSignatureValid } from "./nfcVerificationHellper";


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
    artists_id?: number | null;
    active: boolean;
    created_at: string;
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

export async function recordChipTap(x: string, n: string, e: string, uuid: string): Promise<boolean> {
    const supabaseAdmin = await getSupabaseAdmin();
    const { data, error } = await supabaseAdmin
        .from('chip_taps')
        .insert({ x, n, e, server_auth: false, last_uuid: uuid });

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
        .select(`id, chip_id, collectible_id, artists_id, active, created_at`)
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
            artists_id: chipLink.artists_id
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

export async function getChipLinksByArtistId(artistId: number) {
    const supabaseAdmin = await getSupabaseAdmin();
    const { data, error } = await supabaseAdmin
        .from('chip_links')
        .select(`id, chip_id, collectible_id, active, created_at, artists_id`)
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