import fs from 'fs';
import fetch from 'node-fetch';
import path from 'path';
import sharp from 'sharp';

export async function generateLabeledImageFile({
  imageURL,
  caption,
  x,
  y,
  displayWidth,
  displayHeight,
  labelTextColor = "rgba(31, 41, 55, 1)",
  labelSize = 16,
  labelOnOutside = false,
}: {
  imageURL: string
  caption: string | undefined
  x: number | null
  y: number | null
  displayWidth: number | null
  displayHeight: number | null
  labelTextColor?: string | null
  labelSize?: number
  labelOnOutside?: boolean
}): Promise<File | null> {
  // Add environment logging
  console.log("=== Environment Debug Info ===");
  console.log("Platform:", process.platform);
  console.log("Node version:", process.version);
  console.log("Sharp version:", sharp.versions);
  console.log("Environment:", process.env.NODE_ENV);
  console.log("Runtime:", process.env.VERCEL ? 'Vercel' : 'Local');
  
  if (
    !imageURL ||
    caption == null ||
    x == null ||
    y == null ||
    displayWidth == null ||
    displayHeight == null ||
    labelTextColor == null
  ) {
    console.log("Invalid image metadata:", {
      imageURL,
      caption,
      x,
      y,
      displayWidth,
      displayHeight,
      labelTextColor,
      labelSize,
      labelOnOutside
    })
    return null
  }

  try {
    console.log("=== Step 1: Fetching image ===");
    const response = await fetch(imageURL)
    const imgBuffer = await response.buffer()
    console.log("✓ Image fetched successfully, buffer size:", imgBuffer.length);

    console.log("=== Step 2: Processing image with Sharp ===");
    const imgSharp = sharp(imgBuffer)
    const metadata = await imgSharp.metadata()
    console.log("✓ Sharp metadata extracted:", metadata);

    const imgWidth = metadata.width
    const imgHeight = metadata.height

    if (!imgWidth || !imgHeight) {
      console.error("Invalid image metadata:", metadata)
      return null
    }

    console.log("=== Step 3: Calculating dimensions ===");
    const scaleX = imgWidth / displayWidth
    const scaleY = imgHeight / displayHeight

    const paddingX = labelOnOutside ? 40 : 0
    const paddingY = labelOnOutside ? 80 : 0

    const extraWidth = labelOnOutside ? Math.round(paddingX * scaleX) : 0
    const extraHeight = labelOnOutside ? Math.round(paddingY * scaleY) : 0

    const imageOffsetX = labelOnOutside ? Math.round((paddingX * scaleX) / 2) : 0
    const imageOffsetY = labelOnOutside ? Math.round((paddingY * scaleY) / 2) : 0

    const labelX = imageOffsetX + Math.round(x * scaleX)
    const labelY = imageOffsetY + Math.round(y * scaleY)

    const labelWidth = Math.round(120 * scaleX)
    const labelHeight = Math.round(32 * scaleY)
    const borderRadius = Math.round(6 * scaleX)
    const fontSize = Math.max(10, Math.round(labelSize * scaleY))

    console.log("✓ Dimensions calculated:", {
      scaleX, scaleY, labelX, labelY, labelWidth, labelHeight, fontSize
    });

    console.log("=== Step 4: Creating SVG ===");
    const svg = `
      <svg width="${imgWidth + extraWidth}" height="${imgHeight + extraHeight}">
        <defs>
          <style type="text/css">
            .label-text {
              font-size: ${fontSize}px;
              font-weight: 700;
              fill: ${labelTextColor};
            }
          </style>
        </defs>
        <rect x="${labelX}" y="${labelY}" rx="${borderRadius}" ry="${borderRadius}"
              width="${labelWidth}" height="${labelHeight}" fill="transparent" />
        <text x="${labelX + labelWidth / 2 - Math.round(4 * scaleX)}" y="${labelY + labelHeight / 2}" 
              class="label-text" dominant-baseline="middle" text-anchor="middle">
          ${caption}
        </text>
      </svg>
    `
    console.log("✓ SVG created, length:", svg.length);

    console.log("=== Step 5: Sharp composition (CRITICAL STEP) ===");
    console.log("About to perform Sharp composition with SVG text...");
    
    try {
      const outputBuffer = await sharp({
        create: {
          width: imgWidth + extraWidth,
          height: imgHeight + extraHeight,
          channels: 4,
          background: { r: 255, g: 255, b: 255, alpha: 1 },
        },
      })
        .composite([
          { input: imgBuffer, left: imageOffsetX, top: imageOffsetY },
          { input: Buffer.from(svg), left: 0, top: 0 },
        ])
        .png()
        .toBuffer()

      console.log("✓ Sharp composition completed successfully, output size:", outputBuffer.length);
      return new File([outputBuffer], "labeled-image.png", { type: "image/png" })
    } catch (sharpError) {
      console.error("❌ Sharp composition failed:", sharpError);
      console.error("Error details:", {
        name: (sharpError as Error).name,
        message: (sharpError as Error).message,
        stack: (sharpError as Error).stack
      });
      throw sharpError; // Re-throw to see if this is where fontconfig error occurs
    }

  } catch (err) {
    console.error("❌ Error generating labeled image with sharp:", err)
    console.error("Error occurred at:", new Date().toISOString());
    console.error("Full error details:", {
      name: (err as Error).name,
      message: (err as Error).message,
      stack: (err as Error).stack
    });
    return null
  }
}
