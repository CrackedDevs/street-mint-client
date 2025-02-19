import React from "react";

interface ClaimEmailTemplateProps {
  collectibleId: string;
  collectionId: string;
  nftImageUrl: string;
  signatureCode: string;
}

export default function ClaimEmailTemplate({
  collectibleId,
  collectionId,
  nftImageUrl,
  signatureCode,
}: ClaimEmailTemplateProps) {
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
          src="https://iaulwnqmthzvuxfubnsb.supabase.co/storage/v1/object/public/nft-images/photo_2024-09-12_22-11-09.jpg"
          alt="IRLS Logo"
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
          Congratulations! Your IRL Collectible is ready to be claimed 🎉
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
        <p>Hey there! Your awesome Collectible is claimed and ready to go.</p>
        <a
          href={`https://streetmint.xyz/claim?collectibleId=${collectibleId}&signatureCode=${signatureCode}`}
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
          Claim Your IRL Collectible
        </a>
        <p>
          This link is your golden ticket to your IRL Collectible. Make sure you
          claim it to qualify for digital and physical prizes!
        </p>
      </div>
    </div>
  );
}
