import { NextRequest, NextResponse } from 'next/server';
import { logger } from '@/lib/logger';

export const maxDuration = 45; // Increased timeout
export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
    const searchParams = request.nextUrl.searchParams;
    const prompt = searchParams.get('prompt');
    const seed = searchParams.get('seed') || Math.floor(Math.random() * 1000000).toString();
    const width = searchParams.get('width') || '768';
    const height = searchParams.get('height') || '768';

    if (!prompt) {
        return new NextResponse('Prompt is required', { status: 400 });
    }

    try {
        // Using simple model for faster generation
        const pollUrl = `https://image.pollinations.ai/prompt/${encodeURIComponent(prompt)}?width=${width}&height=${height}&seed=${seed}&nologo=true&model=flux`;

        logger.info('Proxying image request', { prompt, seed });

        // Internal fetch with timeout
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 40000);

        const response = await fetch(pollUrl, {
            signal: controller.signal,
            cache: 'no-store'
        });

        clearTimeout(timeoutId);

        if (!response.ok) {
            throw new Error(`Pollinations API returned ${response.status}`);
        }

        const blob = await response.blob();
        const contentType = blob.type || 'image/jpeg';
        const buffer = await blob.arrayBuffer();

        return new NextResponse(buffer, {
            status: 200,
            headers: {
                'Content-Type': contentType,
                'Cache-Control': 'no-store, max-age=0',
                'X-Generated-Seed': seed
            },
        });
    } catch (error: any) {
        logger.error('Image proxy failed', { error: error.message, prompt });

        // Fallback to a nice placeholder instead of a broken image
        const fallbackUrl = `https://placehold.co/${width}x${height}/0f172a/facc15?text=Vision+Faded+Try+Retry`;
        const fallbackResponse = await fetch(fallbackUrl);
        const fallbackBlob = await fallbackResponse.blob();

        return new NextResponse(fallbackBlob, {
            status: 200,
            headers: { 'Content-Type': 'image/png', 'Cache-Control': 'no-store' }
        });
    }
}
