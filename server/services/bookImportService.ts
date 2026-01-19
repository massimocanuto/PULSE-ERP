
import fs from 'fs';
import path from 'path';
import { Book as EBook } from 'epubjs';

import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const pdf = require('pdf-parse');

import { storage } from '../storage';

// Helper to sanitize filenames
const sanitizeFilename = (name: string) => name.replace(/[^a-z0-9]/gi, '_').toLowerCase();

export async function processUploadedBook(filePath: string, originalFilename: string, userId: string): Promise<any> {
    const ext = path.extname(filePath).toLowerCase();

    let title = path.basename(originalFilename, ext);
    let author = "Unknown";
    let coverUrl = null;
    let totalPages = 0;
    let description = "";

    try {
        if (ext === '.epub') {
            // Processing EPUB
            // Note: epubjs in node context is tricky, we might need a workaround or just basic metadata extraction if possible.
            // For now, let's trust the filename or improve if we can use a node-compatible epub parser.
            // Using a simpler approach for metadata if epubjs fails in node.

            // Actually, for Node.js, libraries like 'epub-parser' or 'epub2' are better, but let's try to infer from filename first 
            // to avoid complex dependencies, or use what we have.
            // Assuming the user might rename files like "Author - Title.epub"

            if (title.includes(' - ')) {
                const parts = title.split(' - ');
                author = parts[0];
                title = parts[1];
            }

        } else if (ext === '.pdf') {
            const dataBuffer = fs.readFileSync(filePath);
            const data = await pdf(dataBuffer);

            totalPages = data.numpages;

            // Try to get metadata from PDF info
            if (data.info) {
                if (data.info.Title && data.info.Title !== 'Untitled') title = data.info.Title;
                if (data.info.Author) author = data.info.Author;
            }
        }
    } catch (err) {
        console.error("Error processing book metadata:", err);
    }

    // Move file to permanent location
    const uploadsDir = path.join(process.cwd(), 'uploads', 'books');
    if (!fs.existsSync(uploadsDir)) {
        fs.mkdirSync(uploadsDir, { recursive: true });
    }

    const newFilename = `${Date.now()}_${sanitizeFilename(title)}${ext}`;
    const newPath = path.join(uploadsDir, newFilename);
    const publicPath = `uploads/books/${newFilename}`;

    fs.copyFileSync(filePath, newPath);
    // fs.unlinkSync(filePath); // Cleanup temp

    // Create Book Entry
    const book = await storage.createBook({
        title,
        author,
        userId: userId || null,
        description,
        totalPages,
        status: 'to_read',
        filePath: publicPath,
        fileType: ext.replace('.', ''),
        coverUrl: null // We could extract cover later
    });

    return book;
}
