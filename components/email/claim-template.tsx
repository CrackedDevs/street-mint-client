import React from "react";

interface ClaimEmailTemplateProps {
  platform: string;
  nftImageUrl: string;
  signatureCode: string;
  batchUrl?: string;
  batchName?: string;
}

export default function ClaimEmailTemplate({
  platform,
  nftImageUrl,
  signatureCode,
  batchUrl,
  batchName,
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
              : "https://iaulwnqmthzvuxfubnsb.supabase.co/storage/v1/object/public/nft-images/irls-logo.png"
          }"
          alt="${platform === "STREETMINT" ? "StreetMint Logo" : "IRLS Logo"}"
          width="150"
          height="70"
          style="display: block; max-width: 150px; height: auto; margin: 0 auto 20px;"
        />
        <h2 style="color: #4a4a4a; text-align: center; margin-bottom: 20px;">
          Success! This IRLS Collectible is now officially yours.
        </h2>
        <img
          src="${nftImageUrl}"
          alt="Your NFT"
          style="display: block; max-width: 100%; height: auto; margin: 0 auto 20px; border-radius: 10px;"
        />
        <p>This link is your golden ticket to your unique collectible.  It will always be here in your inbox, so you're all set. If you would like to transfer ownership or trade your collectible on a secondary marketplace, just click the claim button below.</p>
        <a
          href="https://streetmint.xyz/claim?signatureCode=${signatureCode}"
          style="display: block; background-color: black; color: white; text-decoration: none; padding: 15px 20px; border-radius: 5px; margin: 20px auto; text-align: center; font-weight: bold; text-transform: uppercase;"
        >
          ✨ Claim ✨
        </a>
        ${
          batchUrl
            ? `
        <a
          href="${batchUrl}"
          style="color: #3498db; text-decoration: underline; font-size: 16px; font-style: italic; font-weight: bold;"
          target="_blank"
        >
          Click here to check how many ${batchName} stamps you've collected
        </a>
        `
            : ""
        }

        <p>${
          platform === "STREETMINT"
            ? `P.S. Want to learn more about Street Mint and the exciting world of digital art collectibles? Check out our FAQs: <a href="https://streetmint.xyz/faq">https://streetmint.xyz/faq</a>`
            : `P.S. Want to learn more about IRLS and the exciting world of digital art collectibles? Check out our FAQs: <a href="https://irls.xyz/faq">https://irls.xyz/faq</a>`
        }
        </p>
      </div>
    </div>`;
}
