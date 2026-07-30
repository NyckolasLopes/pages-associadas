
import fs from "fs/promises";
import path from "path";
import sharp from "sharp";

async function convertDir(dir) {
    const entries = await fs.readdir(dir, { withFileTypes: true });
    for (const entry of entries) {
        const fullPath = path.join(dir, entry.name);
        if (entry.isDirectory()) {
            await convertDir(fullPath);
        } else if (entry.isFile() && (entry.name.endsWith(".png") || entry.name.endsWith(".jpg") || entry.name.endsWith(".jpeg"))) {
            const ext = path.extname(entry.name);
            const newPath = fullPath.replace(new RegExp(`${ext}$`), ".webp");
            console.log(`Converting ${fullPath} to ${newPath}`);
            await sharp(fullPath).webp({ quality: 80 }).toFile(newPath);
            await fs.unlink(fullPath);
        }
    }
}

await convertDir("public/produtos");

