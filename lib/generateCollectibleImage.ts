import sharp from 'sharp';
import fs from 'fs';
import path from 'path';

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
  if (!imageURL || !x || !y || !displayWidth || !displayHeight || !caption || !labelTextColor) return null;

  try {
    const response = await fetch(imageURL)
    const blob = await response.blob()
    const img = await createImageBitmap(blob)

    const scaleX = img.width / displayWidth
    const scaleY = img.height / displayHeight

    const paddingX = labelOnOutside ? 40 : 0
    const paddingY = labelOnOutside ? 80 : 0

    const canvas = document.createElement("canvas")
    canvas.width = img.width + (labelOnOutside ? paddingX * scaleX : 0)
    canvas.height = img.height + (labelOnOutside ? paddingY * scaleY : 0)
    const ctx = canvas.getContext("2d")
    if (!ctx) return null

    // Draw original image
    ctx.drawImage(
      img,
      labelOnOutside ? (paddingX * scaleX) / 2 : 0,
      labelOnOutside ? (paddingY * scaleY) / 2 : 0,
      img.width,
      img.height
    )

    // Scaled label position
    const scaledX = x * scaleX
    const scaledY = y * scaleY

    // Draw label background
    ctx.fillStyle = labelTextColor
    ctx.beginPath()
    ctx.roundRect(scaledX, scaledY, 120 * scaleX, 32 * scaleY, 6 * scaleX)
    ctx.fill()

    // Draw label text
    ctx.fillStyle = "rgba(31, 41, 55, 1)"
    ctx.font = `${14 * scaleY}px sans-serif`
    ctx.textAlign = "center"
    ctx.textBaseline = "middle"
    ctx.fillText(caption, scaledX + (60 * scaleX), scaledY + (16 * scaleY))

    return await new Promise<File | null>((resolve) => {
      canvas.toBlob((resultBlob) => {
        if (!resultBlob) return resolve(null)
        const file = new File([resultBlob], "labeled-image.png", {
          type: "image/png",
        })
        resolve(file)
      }, "image/png")
    })
  } catch (err) {
    console.error("Error generating labeled image:", err)
    return null
  }
}
