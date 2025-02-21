import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabaseAdminClient";
import { Collectible } from "@/lib/supabaseClient";

export async function PUT(request: Request) {
  try {
    const collectible: Collectible = await request.json();

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
