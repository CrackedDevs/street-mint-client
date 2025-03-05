"use server";

import { getSupabaseAdmin } from "@/lib/supabaseAdminClient";

export const verifyOrder = async (sessionId: string) => {
  try {
    const supabaseAdmin = await getSupabaseAdmin();
    const { data, error } = await supabaseAdmin
      .from("transactions")
      .select("*")
      .eq("session_id", sessionId);

    if (error) {
      console.error(error);
      throw new Error("Failed to verify order");
    }

    if (!data) {
      throw new Error("Order not found");
    }

    return data[0];
  } catch (e) {
    console.log("error verifying stripe payment status", e);
    return null;
  }
};
