// import { NextResponse } from "next/server";
// import { uploadFileToPinata } from "@/lib/supabaseClient";
// import { getSupabaseAdmin } from "@/lib/supabaseAdminClient";
// import fs from "fs";
// import path from "path";

// export async function GET(request: Request) {
//   try {
//     // Construct the full path to the image in the public folder
//     const fullPath = path.join(process.cwd(), "public", "day5.jpg");

//     // Check if the file exists
//     if (!fs.existsSync(fullPath)) {
//       return NextResponse.json({ error: "File not found" }, { status: 404 });
//     }

//     // Read the file
//     const fileBuffer = fs.readFileSync(fullPath);

//     // Get file name from path
//     const fileName = path.basename(fullPath);

//     // Create a File object from the buffer
//     const file = new File([fileBuffer], fileName, {
//       type: getContentType(fileName),
//     });

//     // Upload to Pinata
//     const url = await uploadFileToPinata(file);

//     if (!url) {
//       return NextResponse.json(
//         { error: "Failed to upload to Pinata" },
//         { status: 500 }
//       );
//     }

//     console.log("url", url);

//     return NextResponse.json({ success: true, url });
//   } catch (error) {
//     console.error("Error uploading to Pinata:", error);
//     return NextResponse.json(
//       { error: "Internal server error" },
//       { status: 500 }
//     );
//   }
// }

// // Helper function to determine content type based on file extension
// function getContentType(fileName: string): string {
//   const ext = path.extname(fileName).toLowerCase();

//   switch (ext) {
//     case ".jpg":
//     case ".jpeg":
//       return "image/jpeg";
//     case ".png":
//       return "image/png";
//     case ".gif":
//       return "image/gif";
//     case ".svg":
//       return "image/svg+xml";
//     case ".webp":
//       return "image/webp";
//     default:
//       return "application/octet-stream";
//   }
// }

// export async function POST(request: Request) {
//   const supabaseAdmin = await getSupabaseAdmin();

//   const id = 3219655203;

//   const collectible = await supabaseAdmin
//     .from("collectibles")
//     .select("*")
//     .eq("id", id)
//     .single();

//   if (collectible.error) {
//     return NextResponse.json(
//       { error: "Failed to get collectible" },
//       { status: 500 }
//     );
//   }

//   const nftMetadata = {
//     name: collectible.data.name,
//     description: collectible.data.description,
//     image: collectible.data.primary_image_url,
//     external_url: "https://streetmint.xyz/",
//     properties: {
//       files: [
//         {
//           uri: collectible.data.primary_image_url,
//           type: "image/jpg",
//         },
//         ...collectible.data.gallery_urls.map((url) => ({
//           uri: url,
//           type: "image/jpg",
//         })),
//       ],
//       category: "image",
//     },
//   };

//   const nftMetadataFileName = `${Date.now()}-${collectible.data.name}-metadata.json`;

//   // Create a JSON file from the NFT metadata
//   const nftMetadataFile = new File(
//     [JSON.stringify(nftMetadata)],
//     nftMetadataFileName,
//     {
//       type: "application/json",
//     }
//   );

//   // Upload the JSON file to Pinata
//   const metadataUrl = await uploadFileToPinata(nftMetadataFile);

//   if (!metadataUrl) {
//     console.error("Error uploading NFT metadata to Pinata");
//     return null;
//   }

//   console.log("metadataUrl", metadataUrl);

//   return NextResponse.json({ success: true, metadataUrl });
// }
