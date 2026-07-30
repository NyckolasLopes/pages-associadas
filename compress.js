import { Jimp } from 'jimp';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function resizeFolder(folderPath, maxWidth) {
  const absolutePath = path.join(__dirname, folderPath);
  try {
    const files = await fs.readdir(absolutePath);
    for (const file of files) {
      if (file.endsWith('.jpg') || file.endsWith('.png')) {
        const fullPath = path.join(absolutePath, file);
        try {
          const image = await Jimp.read(fullPath);
          if (image.bitmap.width > maxWidth) {
            console.log(`Resizing ${file} from ${image.bitmap.width}px to ${maxWidth}px...`);
            image.resize({ w: maxWidth });
            await image.write(fullPath);
          } else {
             console.log(`Skipping ${file}, already ${image.bitmap.width}px`);
          }
        } catch (err) {
          console.error(`Error processing ${file}: ${err.message}`);
        }
      }
    }
  } catch(e) {
    console.error("Folder error:", e);
  }
}

async function run() {
  console.log("Starting compression...");
  await resizeFolder('./public/produtos', 400);
  await resizeFolder('./public/marcas', 150); // logos can be much smaller
  console.log("Done!");
}

run();
