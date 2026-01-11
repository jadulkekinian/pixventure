import { NextRequest, NextResponse } from 'next/server';
import { logger } from '@/lib/logger';

export const maxDuration = 45;
export const dynamic = 'force-dynamic';

/**
 * Image Proxy Route
 * Fetches images from Pollinations.ai and serves them through our domain.
 * This bypasses ISP/DNS blocks and provides a consistent experience.
 */
export async function GET(request: NextRequest) {
    const { searchParams } = new URL(request.url);
    const prompt = searchParams.get('prompt');
    const seed = searchParams.get('seed') || '12345';
    const width = searchParams.get('width') || '768';
    const height = searchParams.get('height') || '768';

    if (!prompt) {
        return new NextResponse('Missing prompt', { status: 400 });
    }

    try {
        // Standardized Pollinations URL confirmed to work
        const url = `https://image.pollinations.ai/prompt/${encodeURIComponent(prompt)}?width=${width}&height=${height}&seed=${seed}&nologo=true`;

        logger.info('Proxying image', { prompt, seed, url });

        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 40000);

        const response = await fetch(url, {
            signal: controller.signal,
            cache: 'no-store',
        });

        clearTimeout(timeoutId);

        if (!response.ok) {
            throw new Error(`Pollinations responded with ${response.status}`);
        }

        const arrayBuffer = await response.arrayBuffer();
        const contentType = response.headers.get('Content-Type') || 'image/jpeg';

        return new NextResponse(arrayBuffer, {
            headers: {
                'Content-Type': contentType,
                'Cache-Control': 'no-store, must-revalidate',
                'X-Proxy-Status': 'Success',
            },
        });
    } catch (err: any) {
        logger.error('Proxy failure', { error: err.message });

        // Final fallback: a nice looking geometric pattern/placeholder
        // This tells the user something went wrong but doesn't break the UI
        const fallbackText = "Vision Time-out. Try Refresh.";
        const fallbackUrl = `https://placehold.co/${width}x${height}/1e293b/facc15?text=${encodeURIComponent(fallbackText)}`;

        try {
            const fallbackResponse = await fetch(fallbackUrl);
            const fallbackBlob = await fallbackResponse.blob();
            return new NextResponse(fallbackBlob, {
                headers: { 'Content-Type': 'image/png', 'Cache-Control': 'no-store' }
            });
        } catch {
            return new NextResponse('Failed to load image', { status: 500 });
        }
    }
}
