import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabaseAdminClient";

type BaseOrder = {
  id: string;
  wallet_address: string;
  status: string;
  mint_signature: string;
  price_usd: number;
  price_sol: number;
  created_at: string;
  quantity: number;
  device_id: string;
  updated_at: string;
  cta_email: string | null;
  cta_text: string | null;
};

type ResponseOrder = BaseOrder & {
  email?: string;
  tiplink_url?: string;
};

type Order = BaseOrder & {
  claimed_email: string;
  tiplink_url: string;
};

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const collectibleId = searchParams.get("collectibleId");
    const onlySuccess = searchParams.get("onlySuccess") === "true";
    const limit = searchParams.get("limit")
      ? parseInt(searchParams.get("limit")!)
      : undefined;

    if (!collectibleId) {
      return NextResponse.json(
        { success: false, error: "Collectible ID is required" },
        { status: 400 }
      );
    }

    const supabaseAdmin = await getSupabaseAdmin();

    const { data: collectible, error: collectibleError } = await supabaseAdmin
      .from("collectibles")
      .select(
        "id, created_at, is_light_version, name, description, quantity, price_usd, location, is_light_version, mint_start_date, mint_end_date, cta_title, cta_description, cta_logo_url, cta_text, cta_link, cta_has_email_capture, cta_enable, cta_has_text_capture, enable_card_payments"
      )
      .eq("id", parseInt(collectibleId!))
      .single();

    if (collectibleError || !collectible) {
      return NextResponse.json(
        { success: false, error: "Collectible not found" },
        { status: 404 }
      );
    }

    let query: any;

    if (collectible.is_light_version) {
      query = supabaseAdmin
        .from("light_orders")
        .select(
          "id, wallet_address, status, mint_signature, price_usd, price_sol, created_at, quantity, device_id, updated_at, cta_email, cta_text, email"
        )
        .eq("collectible_id", parseInt(collectibleId!));
    } else {
      query = supabaseAdmin
        .from("orders")
        .select(
          "id, wallet_address, status, mint_signature, price_usd, price_sol, created_at, quantity, device_id, updated_at, cta_email, cta_text, tiplink_url"
        )
        .eq("collectible_id", parseInt(collectibleId!));
    }

    if (onlySuccess) {
      query = query.eq("status", "completed");
    }

    if (limit) {
      query = query.limit(limit);
    }

    query = query.order("created_at", { ascending: false });

    const { data: orders, error: ordersError } = await query;

    if (ordersError) {
      console.error("Error fetching orders:", ordersError);
      return NextResponse.json(
        { success: false, error: "Failed to fetch orders" },
        { status: 500 }
      );
    }

    let transformedOrders: Order[];

    if (collectible.is_light_version) {
      transformedOrders = orders?.map((order: ResponseOrder) => ({
        ...order,
        claimed_email: order.email,
        tiplink_url: "",
        email: undefined,
      }));
    } else {
      transformedOrders = orders?.map((order: ResponseOrder) => ({
        ...order,
        claimed_email: "",
      }));
    }

    return NextResponse.json(
      {
        success: true,
        collectible: collectible,
        orders: transformedOrders,
        is_light_version: collectible.is_light_version,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error fetching orders:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
