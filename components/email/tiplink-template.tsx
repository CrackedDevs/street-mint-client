/* eslint-disable @next/next/no-img-element */
import React from "react";

interface TipLinkEmailTemplateProps {
  tiplinkUrl: string;
  nftImageUrl: string;
  platform: string;
}

export default function TipLinkEmailTemplate({
  tiplinkUrl,
  nftImageUrl,
  platform,
}: TipLinkEmailTemplateProps) {
  console.log("Platform:", platform);
  if (!platform) {
    throw new Error("Platform not found");
  }
  return (
    <div
      style={{
        fontFamily: "'Arial', sans-serif",
        lineHeight: 1.6,
        color: "#333",
        maxWidth: "600px",
        margin: "0 auto",
        padding: "20px",
        backgroundColor: "#f4f4f4",
      }}
    >
      <div
        style={{
          backgroundColor: "#ffffff",
          borderRadius: "10px",
          padding: "30px",
          boxShadow: "0 0 10px rgba(0,0,0,0.1)",
        }}
      >
        <img
          src={
            platform === "STREETMINT"
              ? "https://iaulwnqmthzvuxfubnsb.supabase.co/storage/v1/object/public/nft-images/logo%202.png"
              : "https://iaulwnqmthzvuxfubnsb.supabase.co/storage/v1/object/public/nft-images/photo_2024-09-12_22-11-09.jpg"
          }
          alt={platform === "STREETMINT" ? "StreetMint Logo" : "IRLS Logo"}
          width={150}
          height={70}
          style={{
            display: "block",
            maxWidth: "150px",
            height: "auto",
            margin: "0 auto 20px",
          }}
        />
        <h2
          style={{
            color: "#4a4a4a",
            textAlign: "center",
            marginBottom: "20px",
          }}
        >
          Congratulations! Your{" "}
          {platform === "STREETMINT" ? "StreetMint" : "IRLS"} Collectible is
          ready to be claimed 🎉
        </h2>
        <img
          src={nftImageUrl}
          alt="Your NFT"
          style={{
            display: "block",
            maxWidth: "100%",
            height: "auto",
            margin: "0 auto 20px",
            borderRadius: "10px",
          }}
        />
        <p>Hey there! Your awesome Collectible is minted and ready to go.</p>
        <a
          href={tiplinkUrl}
          style={{
            display: "block",
            backgroundColor: "#3498db",
            color: "white",
            textDecoration: "none",
            padding: "15px 20px",
            borderRadius: "5px",
            margin: "20px auto",
            textAlign: "center",
            fontWeight: "bold",
            textTransform: "uppercase",
          }}
        >
          Claim Your Collectible
        </a>
        <p>
          This link is your golden ticket to your{" "}
          {platform === "STREETMINT"
            ? "StreetMint Collectible"
            : "IRLS Collectible"}
          . Make sure you claim it to qualify for digital and physical prizes!
        </p>
      </div>
    </div>
  );
}

export function getEmailTemplateHTML({
  tiplinkUrl,
  nftImageUrl,
  platform,
}: TipLinkEmailTemplateProps): string {
  if (!platform) {
    platform = "STREETMINT";
  }
  return `<div
      style="
        font-family: 'Arial', sans-serif;
        line-height: 1.6;
        color: #333;
        max-width: 600px;
        margin: 0 auto;
        padding: 20px;
        background-color: #f4f4f4;"
    >
      <div
        style="
          background-color: #ffffff;
          border-radius: 10px;
          padding: 30px;
          box-shadow: 0 0 10px rgba(0,0,0,0.1);"
      >
        <img
          src="${
            platform === "STREETMINT"
              ? "https://iaulwnqmthzvuxfubnsb.supabase.co/storage/v1/object/public/nft-images/logo%202.png"
              : "https://iaulwnqmthzvuxfubnsb.supabase.co/storage/v1/object/public/nft-images/irls-logo.png"  
          }"
          alt="${platform === "STREETMINT" ? "StreetMint Logo" : "IRLS Logo"}"
          width="150"
          height="70"
          style="
            display: block;
            max-width: 150px;
            height: auto;
            margin: 0 auto 20px;"
        />
        <h2
          style="
            color: #4a4a4a;
            text-align: center;
            margin-bottom: 20px;"
        >${platform === "STREETMINT" ? `Congrats on becoming the owner of this rare piece of street art history. This link is your golden ticket to your unique collectible.  It will always be here in your inbox, so you're all set.` : `Success! This IRLS Collectible is now officially yours.`}
        </h2>
        <img
          src="${nftImageUrl}"
          alt="Your NFT"
          style="
            display: block;
            max-width: 100%;
            height: auto;
            margin: 0 auto 20px;
            border-radius: 10px;"
        />
        <p>${platform === "STREETMINT" ? `If you would like to transfer ownership or trade your collectible on a secondary marketplace, just click the claim button below.` : `This link is your golden ticket to your unique collectible.  It will always be here in your inbox, so you're all set. If you would like to transfer ownership or trade your collectible on a secondary marketplace, just click the claim button below. `}</p>
        <a
          href="${tiplinkUrl}"
          style="
            display: block;
            background-color: black;
            color: white;
            text-decoration: none;
            padding: 15px 20px;
            border-radius: 5px;
            margin: 20px auto;
            text-align: center;
            font-weight: bold;
            text-transform: uppercase;"
        >
          ✨ Claim  ✨
        </a>
        <p>${
            platform === "STREETMINT"
              ? `P.S. Want to learn more about Street Mint and the exciting world of digital art collectibles? Check out our FAQs: <a href="https://streetmint.xyz/faq">https://streetmint.xyz/faq</a>`
              : `P.S. Want to learn more about IRLS and the exciting world of digital art collectibles? Check out our FAQs: <a href="https://irls.xyz/faq">https://irls.xyz/faq</a>`
          }
        </p>
        <p>${
            platform === "STREETMINT"
              ? `P.P.S. Show off your latest find! Share your new collectible on social media with #StreetMint and tag us <a href="https://www.instagram.com/streetmint.xyz">https://www.instagram.com/streetmint.xyz</a>`
              : `P.P.S. Show off your latest find! Share your new collectible on social media with #StreetMint and tag us <a href="https://www.instagram.com/streetmint.xyz">https://www.instagram.com/streetmint.xyz</a>`
          }
        </p>
      </div>
    </div>`;
}
