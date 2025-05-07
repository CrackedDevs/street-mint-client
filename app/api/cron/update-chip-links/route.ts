// import { getSupabaseAdmin } from "@/lib/supabaseAdminClient";
// import { Collectible, QuantityType } from "@/lib/supabaseClient";
// import { NumericUUID } from "@/lib/utils";
// import { NextRequest, NextResponse } from "next/server";

// export async function GET(request: NextRequest) {
//   try {
//     const supabaseAdmin = await getSupabaseAdmin();

//     const { data: batchListings, error: fetchError } = await supabaseAdmin
//       .from("batch_listings")
//       .select("*")

//     if (fetchError) {
//       console.error("Error fetching batch listings:", fetchError);
//       return NextResponse.json(
//         { error: "Failed to fetch batch listings" },
//         { status: 500 }
//       );
//     }

//     if (!batchListings || batchListings.length === 0) {
//       return NextResponse.json(
//         { message: "No batch listings to process" },
//         { status: 200 }
//       );
//     }

//     // Process each batch listing
//     for (const listing of batchListings) {
//       const now = new Date();

//       if (listing.batch_end_date && new Date(listing.batch_end_date) <= now && listing.chip_link_id) {
//         const { error: chipError } = await supabaseAdmin
//           .from('chip_links')
//           .delete()
//           .eq('id', listing.chip_link_id);

//         if (chipError) {
//           console.error('Error deleting chip link for listing', listing.id, ':', chipError);
//         } else {
//           console.log('Deleted chip link for listing', listing.id);
//         }
//       }
//     }

//     return NextResponse.json(
//       { batch_listings: batchListings },
//       { status: 200 }
//     );
//   } catch (error) {
//     console.error("Error in GET /api/cron/create-daily-collectibles:", error);
//     return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
//   }
// }