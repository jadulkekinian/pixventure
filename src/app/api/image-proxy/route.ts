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
        logger.warn('Image proxy called without prompt');
        return new NextResponse('Prompt is required', { status: 400 });
    }

    try {
        const pollUrl = `https://image.pollinations.ai/prompt/${encodeURIComponent(prompt)}?width=${width}&height=${height}&seed=${seed}&nologo=true`;

        logger.info('Proxying image request', { prompt, seed, url: pollUrl });

        const response = await fetch(pollUrl, {
            next: { revalidate: 3600 } // Cache for 1 hour
        });

        if (!response.ok) {
            const errorText = await response.text();
            logger.error('Pollinations API failure', { status: response.status, error: errorText });
            return new NextResponse(`Pollinations API returned ${response.status}`, { status: response.status });
        }

        const contentType = response.headers.get('Content-Type') || 'image/jpeg';
        const buffer = await response.arrayBuffer();

        logger.info('Proxying image successful', { contentType, bytes: buffer.byteLength });

        return new NextResponse(buffer, {
            status: 200,
            headers: {
                'Content-Type': contentType,
                'Cache-Control': 'public, max-age=31536000, immutable',
                'X-Proxy-Origin': 'Pollinations.ai'
            },
        });
    } catch (error: any) {
        logger.error('Image proxy exception', { error: error.message, stack: error.stack });
        return new NextResponse(`Internal error: ${error.message}`, { status: 500 });
    }
}
