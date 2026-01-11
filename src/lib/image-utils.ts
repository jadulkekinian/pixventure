/**
 * Utility functions for image handling
 */

import { writeFile, mkdir } from 'fs/promises';
import { join } from 'path';
import { existsSync } from 'fs';

/**
 * Save base64 image to the public directory
 * @param base64Data - Base64 encoded image data
 * @param prefix - Optional prefix for the filename
 * @returns Public URL path to the image
 */
export async function saveBase64Image(
    base64Data: string,
    prefix: string = 'scene'
): Promise<string> {
    try {
        // Create scenes directory if it doesn't exist
        const scenesDir = join(process.cwd(), 'public', 'scenes');
        if (!existsSync(scenesDir)) {
            await mkdir(scenesDir, { recursive: true });
        }

        // Generate unique filename
        const filename = `${prefix}_${Date.now()}_${Math.random().toString(36).substring(7)}.png`;
        const filepath = join(scenesDir, filename);

        // Convert base64 to buffer and save
        const imageBuffer = Buffer.from(base64Data, 'base64');
        await writeFile(filepath, imageBuffer);

        // Return public URL
        return `/scenes/${filename}`;
    } catch (error) {
        console.error('Error saving image:', error);
        throw new Error('Failed to save image');
    }
}

/**
 * Generate a data URL from base64 (fallback for development)
 */
export function generateDataUrl(base64Data: string, mimeType: string = 'image/png'): string {
    return `data:${mimeType};base64,${base64Data}`;
}
