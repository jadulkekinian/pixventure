import { NextRequest, NextResponse } from 'next/server';
import { logger } from '@/lib/logger';

export const maxDuration = 30;

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
        // Construct Pollinations URL
        const pollUrl = `https://image.pollinations.ai/prompt/${encodeURIComponent(prompt)}?width=${width}&height=${height}&seed=${seed}&nologo=true`;

        logger.info('Proxying image request', { prompt, seed });

        const response = await fetch(pollUrl);

        if (!response.ok) {
            throw new Error(`Pollinations API returned ${response.status}`);
        }

        const blob = await response.blob();
        const headers = new Headers();
        headers.set('Content-Type', blob.type || 'image/jpeg');
        headers.set('Cache-Control', 'public, max-age=31536000, immutable');

        return new NextResponse(blob, {
            status: 200,
            headers,
        });
    } catch (error) {
        logger.error('Image proxy failed', { error, prompt });
        return new NextResponse('Failed to load image', { status: 500 });
    }
}
