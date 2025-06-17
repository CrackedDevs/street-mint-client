import fs from 'fs';
import fetch from 'node-fetch';
import path from 'path';
import sharp from 'sharp';

const fontPath = path.resolve(process.cwd(), 'public/InterVariable.ttf');
const fontBase64 = fs.readFileSync(fontPath).toString('base64');

export async function generateCollectibleImage(imageUrl: string, caption: string = 'Street Mint') {
  const response = await fetch(imageUrl);
  if (!response.ok) {
    throw new Error('Failed to fetch image');
  }

  const imageBuffer = Buffer.from(await response.arrayBuffer());
  const image = sharp(imageBuffer);
  const metadata = await image.metadata();

  const width = metadata.width ?? 800;
  const height = metadata.height ?? 800;
  const padding = 128;

  const svgText = `
    <svg width="${width}" height="${padding * 2}">
      <defs>
        <style type="text/css">
          @font-face {
            font-family: 'Inter';
            src: url('data:font/ttf;base64,${fontBase64}') format('truetype');
          }
          text {
            font-family: 'Inter';
            font-size: 128px;
            font-weight: 700;
            fill: #111;
            letter-spacing: 1px;
          }
        </style>
      </defs>
      <rect width="100%" height="100%" fill="white" />
      <text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle">
        ${caption}
      </text>
    </svg>
  `;

  const finalImageBuffer = await image
    .extend({
      top: padding,
      bottom: padding * 3,
      left: padding,
      right: padding,
      background: { r: 255, g: 255, b: 255, alpha: 1 }
    })
    .composite([
      {
        input: Buffer.from(svgText),
        top: height + padding * 1.5,
        left: padding
      }
    ])
    .png()
    .toBuffer();

  // Return both the buffer and a File object
  const file = new File([finalImageBuffer], 'collectible.png', {
    type: 'image/png',
  });

  return { file, buffer: finalImageBuffer };
}
export async function generateLabeledImageFile({
  imageURL,
  caption,
  x,
  y,
  displayWidth,
  displayHeight,
  labelTextColor = "rgba(31, 41, 55, 1)",
  labelOnOutside = false,
}: {
  imageURL: string
  caption: string | undefined
  x: number | null
  y: number | null
  displayWidth: number | null
  displayHeight: number | null
  labelTextColor?: string | null
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
    const fontSize = Math.max(10, Math.round(14 * scaleY))

    const svg = `
      <svg width="${imgWidth + extraWidth}" height="${imgHeight + extraHeight}">
        <rect x="${labelX}" y="${labelY}" rx="${borderRadius}" ry="${borderRadius}"
              width="${labelWidth}" height="${labelHeight}" fill="transparent" />
        <text x="${labelX + labelWidth / 2}" y="${labelY + labelHeight / 2}"
              font-size="${fontSize}" font-family="sans-serif"
              fill="${labelTextColor}" dominant-baseline="middle" text-anchor="middle">
          ${caption}
        </text>
      </svg>
    `

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

    return new File([outputBuffer], "labeled-image.png", { type: "image/png" })
  } catch (err) {
    console.error("Error generating labeled image with sharp:", err)
    return null
  }
}
