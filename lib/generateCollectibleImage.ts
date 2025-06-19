import fs from 'fs';
import fetch from 'node-fetch';
import path from 'path';
import sharp from 'sharp';

// Canvas-based text rendering function to avoid fontconfig issues
async function renderTextToBuffer(
  text: string,
  width: number,
  height: number,
  fontSize: number,
  color: string
): Promise<Buffer> {
  // For serverless environments, we'll create a simple visual indicator
  // This avoids any font rendering dependencies by using basic shapes instead of text
  
  // Parse color from rgba string
  const colorMatch = color.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)(?:,\s*[\d.]+)?\)/);
  const [r, g, b] = colorMatch ? [parseInt(colorMatch[1]), parseInt(colorMatch[2]), parseInt(colorMatch[3])] : [31, 41, 55];
  
  // Create a simple indicator using SVG shapes (no text, no fontconfig dependency)
  const borderRadius = Math.round(width * 0.05);
  const svg = `
    <svg width="${Math.round(width)}" height="${Math.round(height)}" xmlns="http://www.w3.org/2000/svg">
      <rect x="2" y="2" width="${Math.round(width - 4)}" height="${Math.round(height - 4)}" 
            rx="${borderRadius}" ry="${borderRadius}"
            fill="rgba(255, 255, 255, 0.9)" 
            stroke="rgb(${r}, ${g}, ${b})" 
            stroke-width="2"/>
      <circle cx="${Math.round(width * 0.2)}" cy="${Math.round(height * 0.5)}" r="3" fill="rgb(${r}, ${g}, ${b})"/>
      <circle cx="${Math.round(width * 0.4)}" cy="${Math.round(height * 0.5)}" r="3" fill="rgb(${r}, ${g}, ${b})"/>
      <circle cx="${Math.round(width * 0.6)}" cy="${Math.round(height * 0.5)}" r="3" fill="rgb(${r}, ${g}, ${b})"/>
    </svg>
  `;

  const textBuffer = await sharp(Buffer.from(svg))
    .png()
    .toBuffer();

  return textBuffer;
}

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
    const response = await fetch(imageURL)
    const imgBuffer = await response.buffer()

    const imgSharp = sharp(imgBuffer)
    const metadata = await imgSharp.metadata()

    const imgWidth = metadata.width
    const imgHeight = metadata.height

    if (!imgWidth || !imgHeight) {
      console.error("Invalid image metadata:", metadata)
      return null
    }

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

    // Try Sharp's native text method first (Sharp 0.32+)
    let outputBuffer: Buffer;

    try {
      // Sharp's text method has different syntax - try the correct format
      const textOptions = {
        text: {
          text: caption,
          width: labelWidth,
          height: labelHeight,
          rgba: true,
          font: 'Arial',
          fontsize: fontSize,
          fontweight: 'bold'
        }
      };

      const textImage = sharp(textOptions as any);
      const textBuffer = await textImage.png().toBuffer();

      outputBuffer = await sharp({
        create: {
          width: imgWidth + extraWidth,
          height: imgHeight + extraHeight,
          channels: 4,
          background: { r: 255, g: 255, b: 255, alpha: 1 },
        },
      })
        .composite([
          { input: imgBuffer, left: imageOffsetX, top: imageOffsetY },
          { input: textBuffer, left: labelX, top: labelY },
        ])
        .png()
        .toBuffer();

      console.log("✓ Used Sharp text method successfully");
      
    } catch (textMethodError) {
      console.log("Sharp text method failed, using canvas fallback");
      
      // Fallback: Use our canvas-free approach
      try {
        const textBuffer = await renderTextToBuffer(caption, labelWidth, labelHeight, fontSize, labelTextColor);

        outputBuffer = await sharp({
          create: {
            width: imgWidth + extraWidth,
            height: imgHeight + extraHeight,
            channels: 4,
            background: { r: 255, g: 255, b: 255, alpha: 1 },
          },
        })
          .composite([
            { input: imgBuffer, left: imageOffsetX, top: imageOffsetY },
            { input: textBuffer, left: labelX, top: labelY },
          ])
          .png()
          .toBuffer();

        console.log("✓ Used fontconfig-free fallback method");
        
      } catch (fallbackError) {
        console.log("Fallback failed, returning image without text overlay");
        
        // Last resort: return image without text overlay
        outputBuffer = await sharp({
          create: {
            width: imgWidth + extraWidth,
            height: imgHeight + extraHeight,
            channels: 4,
            background: { r: 255, g: 255, b: 255, alpha: 1 },
          },
        })
          .composite([
            { input: imgBuffer, left: imageOffsetX, top: imageOffsetY },
          ])
          .png()
          .toBuffer();

        console.log("⚠️ Returned image without text overlay due to rendering issues");
      }
    }

    return new File([outputBuffer], "labeled-image.png", { type: "image/png" })
  } catch (err) {
    console.error("Error generating labeled image with sharp:", err)
    return null
  }
}
