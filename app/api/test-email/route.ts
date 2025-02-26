import { NextResponse } from "next/server";
import { resend } from "@/lib/resendMailer";
import TipLinkEmailTemplate from "@/components/email/tiplink-template";
import { headers } from "next/headers";

export async function POST(req: Request) {
  try {
    // Log environment setup

    const host = headers().get("host") || "";
    console.log("host", host);
    const isIrlsDomain = host == "www.irls.xyz";
    const platform = isIrlsDomain ? "IRLS" : "STREETMINT";
    console.log("isIrlsDomain", isIrlsDomain);

    const { email, nftImageUrl = "https://placeholder.com/image.jpg" } =
      await req.json();

    // Validate email
    if (!email || typeof email !== "string" || !email.includes("@")) {
      return NextResponse.json(
        { success: false, error: "Invalid email address" },
        { status: 400 }
      );
    }

    if (!platform) {
      throw new Error("Platform not found");
    }
    const fromEmail =
      platform === "STREETMINT"
        ? "StreetMint <Hello@claim.streetmint.xyz>"
        : "IRLS <Hello@claim.irls.xyz>";
    const emailSubject =
      platform === "STREETMINT"
        ? "Claim your  StreetMint Collectible!"
        : "Claim your IRLS Collectible!";

    // Log email configuration
    console.log("Sending test email with config:", {
      fromEmail,
      toEmail: email,
      subject: emailSubject,
      platform,
    });

    const { data, error } = await resend.emails.send({
      text: "Test - Claim your Collectible!",
      from: fromEmail,
      to: [email],
      subject: emailSubject,
      react: TipLinkEmailTemplate({
        tiplinkUrl: "https://test-tiplink.com",
        nftImageUrl,
        platform,
      }),
    });

    if (error) {
      console.error("Resend API Error:", error);
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 500 }
      );
    }

    console.log("Email sent successfully:", data);
    return NextResponse.json({
      success: true,
      data,
      config: { fromEmail, subject: emailSubject },
    });
  } catch (error) {
    console.error("Unexpected error:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
