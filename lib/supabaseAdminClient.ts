'use server'

import { createClient } from "@supabase/supabase-js";
import { createFetch } from "./supabaseClient";
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
    collectible_id: number;
    active: boolean;
    created_at: string;
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
    return data;
}

export async function getChipLinkByChipId(chipId: string) {
    const supabaseAdmin = await getSupabaseAdmin();
    const { data, error } : { data: ChipLink | null, error: any } = await supabaseAdmin
        .from('chip_links')
        .select(`id, chip_id, collectible_id, active, created_at`)
        .eq('chip_id', chipId)
        .single();
    if (error) {
        console.error('Error getting all chip links:', error);
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