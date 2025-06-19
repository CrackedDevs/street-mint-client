import fs from 'fs';
import fetch from 'node-fetch';
import path from 'path';
import sharp from 'sharp';

const fontPath = path.resolve(process.cwd(), 'public/InterVariable.ttf');
const fontBase64 = fs.readFileSync(fontPath).toString('base64');

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

    const labelWidth = Math.round(85 * scaleX)
    const labelHeight = Math.round(20 * scaleY)
    const borderRadius = Math.round(6 * scaleX)
    const fontSize = Math.max(10, Math.round(labelSize * scaleY))

    const svg = `
      <svg width="${imgWidth + extraWidth}" height="${imgHeight + extraHeight}">
        <defs>
          <style type="text/css">
            @font-face {
              font-family: 'Inter';
              src: url('data:font/ttf;base64,${fontBase64}') format('truetype');
            }
            .label-text {
              font-family: 'Inter', 'Helvetica Neue', 'Arial', sans-serif;
              font-size: ${fontSize}px;
              font-weight: 700;
              fill: ${labelTextColor};
            }
          </style>
        </defs>
        <rect x="${labelX}" y="${labelY}" rx="${borderRadius}" ry="${borderRadius}"
              width="${labelWidth}" height="${labelHeight}" fill="transparent" />
        <text x="${labelX + labelWidth / 2 - Math.round(2 * scaleX)}" y="${labelY + labelHeight / 2}" 
              class="label-text" dominant-baseline="middle" text-anchor="middle">
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
