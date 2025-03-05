import React from "react";

interface ClaimEmailTemplateProps {
  platform: string;
  nftImageUrl: string;
  signatureCode: string;
}

export default function ClaimEmailTemplate({
  platform,
  nftImageUrl,
  signatureCode,
}: ClaimEmailTemplateProps) {
  if (!platform) {
    platform = "STREETMINT";
  }

  return `
    <div style="font-family: 'Arial', sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f4f4f4;">
      <div style="background-color: #ffffff; border-radius: 10px; padding: 30px; box-shadow: 0 0 10px rgba(0,0,0,0.1);">
        <img
          src="${
            platform === "STREETMINT"
              ? "https://iaulwnqmthzvuxfubnsb.supabase.co/storage/v1/object/public/nft-images/logo%202.png"
              : "https://iaulwnqmthzvuxfubnsb.supabase.co/storage/v1/object/public/nft-images/photo_2024-09-12_22-11-09.jpg"
          }"
          alt="${platform === "STREETMINT" ? "StreetMint Logo" : "IRLS Logo"}"
          width="150"
          height="70"
          style="display: block; max-width: 150px; height: auto; margin: 0 auto 20px;"
        />
        <h2 style="color: #4a4a4a; text-align: center; margin-bottom: 20px;">
          Congratulations! Your IRL Collectible is ready to be claimed 🎉
        </h2>
        <img
          src="${nftImageUrl}"
          alt="Your NFT"
          style="display: block; max-width: 100%; height: auto; margin: 0 auto 20px; border-radius: 10px;"
        />
        <p>Hey there! Your awesome Collectible is claimed and ready to go.</p>
        <a
          href="https://streetmint.xyz/claim?signatureCode=${signatureCode}"
          style="display: block; background-color: #3498db; color: white; text-decoration: none; padding: 15px 20px; border-radius: 5px; margin: 20px auto; text-align: center; font-weight: bold; text-transform: uppercase;"
        >
          Claim Your ${platform === "STREETMINT" ? "StreetMint" : "IRLS"} Light Collectible
        </a>
        <p>
          This link is your golden ticket to your IRL Collectible. Make sure you
          claim it to qualify for digital and physical prizes!
        </p>
      </div>
    </div>`;
}
