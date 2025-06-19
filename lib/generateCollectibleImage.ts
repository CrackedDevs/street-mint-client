import fs from 'fs';
import fetch from 'node-fetch';
import path from 'path';
import sharp from 'sharp';
import TextToSVG from 'text-to-svg';

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

    const labelX = Math.round(x * scaleX) + 15;
    const labelY = Math.round(y * scaleY) + 15;

    const fontSize = Math.max(10, Math.round(labelSize * 10))

    const textToSVG = TextToSVG.loadSync();
 
    const options = {x: 0, y: 0, fontSize: fontSize, anchor: "top" as TextToSVG.Anchor, attributes: {fill: labelTextColor, fontWeight: 'bold', fontFamily: "Inter"}};
 
    const svg = textToSVG.getSVG(caption, options);

    const outputBuffer = await sharp({
      create: {
        width: imgWidth,
        height: imgHeight,
        channels: 4,
        background: { r: 255, g: 255, b: 255, alpha: 1 },
      },
    })
      .composite([
        { input: imgBuffer, left: 0, top: 0 },
        { input: Buffer.from(svg), left: labelX, top: labelY },
      ])
      .png()
      .toBuffer()

    return new File([outputBuffer], "labeled-image.png", { type: "image/png" })
  } catch (err) {
    console.error("Error generating labeled image with sharp:", err)
    return null
  }
}
