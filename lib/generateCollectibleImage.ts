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
