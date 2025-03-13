import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabaseAdminClient";
import { Collectible } from "@/lib/supabaseClient";

export async function PUT(request: Request) {
  try {
    const {
      collectible,
      orderId,
      email,
      text,
      isLightVersion,
    }: {
      collectible: Collectible;
      orderId: string;
      email: string;
      text: string;
      isLightVersion: boolean;
    } = await request.json();

    if (orderId) {
      const supabaseAdmin = await getSupabaseAdmin();

      const tableName = isLightVersion ? "light_orders" : "orders";

      const { error } = await supabaseAdmin
        .from(tableName)
        .update({ cta_email: email, cta_text: text })
        .eq("id", orderId);

      if (error) {
        console.error(`Error updating ${tableName}:`, error);
        return NextResponse.json(
          {
            success: false,
            error: error.message || `Failed to update ${tableName}`,
          },
          { status: 500 }
        );
      }
    }

    if (!collectible || !collectible.id) {
      return NextResponse.json(
        { error: "Invalid collectible data" },
        { status: 400 }
      );
    }

    const supabaseAdmin = await getSupabaseAdmin();
    const { error } = await supabaseAdmin
      .from("collectibles")
      .update(collectible)
      .eq("id", collectible.id);

    if (error) {
      return NextResponse.json(
        {
          success: false,
          error: error.message || "Failed to update collectible",
        },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, error: null });
  } catch (error) {
    console.error("Error in update collectible API:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
