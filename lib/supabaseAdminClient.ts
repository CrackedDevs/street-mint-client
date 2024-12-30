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
