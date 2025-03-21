import { getSupabaseAdmin } from "@/lib/supabaseAdminClient";
import { NextResponse } from "next/server";
import { v4 as uuidv4 } from "uuid";

export async function POST(req: Request) {
  const { collectibleId } = await req.json();

  if (!collectibleId) {
    return NextResponse.json(
      { success: false, error: "Invalid collectible id" },
      { status: 400 }
    );
  }

  let signatureCode = uuidv4();
  signatureCode = signatureCode.replace(/-/g, "");

  const supabaseAdmin = await getSupabaseAdmin();

  const { error: createAdminSignatureCode } = await supabaseAdmin
    .from("admin_signature_codes")
    .insert({
      admin_signature_code: signatureCode,
      active: true,
      collectible_id: collectibleId,
    });

  if (createAdminSignatureCode) {
    throw new Error("Failed to create admin signature code");
  }

  return NextResponse.json({ success: true, signatureCode });
}
