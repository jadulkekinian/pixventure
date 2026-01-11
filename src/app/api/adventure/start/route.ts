import { NextRequest, NextResponse } from 'next/server';
import { startAdventureSchema } from '@/lib/validation';
import { logger } from '@/lib/logger';
import Groq from 'groq-sdk';

export const maxDuration = 60;

const languageInstructions = {
  en: {
    system: "You are a creative dungeon master for a fantasy text adventure. Create an immersive opening scene.",
    user: "Start a fantasy adventure. The player is at the entrance of a mysterious ancient dungeon.",
  },
  id: {
    system: "Anda adalah dungeon master kreatif untuk petualangan teks fantasi. Buat adegan pembuka yang imersif.",
    user: "Mulai petualangan fantasi. Pemain berada di depan pintu masuk dungeon kuno yang misterius.",
  },
  ja: {
    system: "あなたはファンタジーテキストアドベンチャーのダンジョンマスターです。没入感のあるオープニングシーンを作成してください。",
    user: "ファンタジーアドベンチャーを開始します。プレイヤーは謎めいた古代のダンジョンの入り口にいます。",
  },
};

/**
 * Robust Image Fetcher with Retries and Base64 Conversion
 */
async function fetchImageAsBase64(prompt: string, seed: number): Promise<string> {
  const pollUrl = `https://image.pollinations.ai/prompt/${encodeURIComponent(prompt)}?width=512&height=512&seed=${seed}&nologo=true`;

  let attempts = 0;
  const maxAttempts = 3;

  while (attempts < maxAttempts) {
    try {
      logger.info(`Fetching image from Pollinations (Attempt ${attempts + 1})`, { prompt, seed });
      const res = await fetch(pollUrl, {
        signal: AbortSignal.timeout(15000),
        headers: { 'Accept': 'image/*' }
      });

      if (res.ok) {
        const contentType = res.headers.get('content-type') || 'image/jpeg';
        if (contentType.includes('image')) {
          const buffer = await res.arrayBuffer();
          const base64 = Buffer.from(buffer).toString('base64');
          return `data:${contentType};base64,${base64}`;
        }
      }

      logger.warn(`Pollinations attempt ${attempts + 1} failed with status ${res.status}`);
    } catch (e) {
      logger.warn(`Pollinations attempt ${attempts + 1} error`, { error: e });
    }

    attempts++;
    if (attempts < maxAttempts) {
      await new Promise(r => setTimeout(r, 1000));
    }
  }

  // Last resort: Return the direct URL. The frontend will try to load it.
  return pollUrl;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { language } = startAdventureSchema.parse(body);

    const groqApiKey = process.env.GROQ_API_KEY;
    if (!groqApiKey) return NextResponse.json({ success: false, error: 'Groq API Key missing' }, { status: 500 });

    const groq = new Groq({ apiKey: groqApiKey });
    const lang = languageInstructions[language as keyof typeof languageInstructions] || languageInstructions.en;

    const seed = Math.floor(Math.random() * 9999999);
    const imagePrompt = "pixel art fantasy dungeon entrance, mysterious stone gate, glowing runes, retro RPG style, highly detailed";

    // Parallel execution using Promise.allSettled for maximum resilience
    const [storyResult, imageResult] = await Promise.allSettled([
      groq.chat.completions.create({
        model: 'llama-3.3-70b-versatile',
        messages: [
          { role: 'system', content: lang.system + " 3-4 paragraphs. Use vivid descriptions. End with a question or choices." },
          { role: 'user', content: lang.user },
        ],
        temperature: 0.8,
      }),
      fetchImageAsBase64(imagePrompt, seed)
    ]);

    let story = '';
    if (storyResult.status === 'fulfilled') {
      story = storyResult.value.choices?.[0]?.message?.content || '';
    } else {
      logger.error('Story generation failed', { error: storyResult.reason });
      throw new Error('Failed to generate story');
    }

    let imageUrl = '';
    if (imageResult.status === 'fulfilled') {
      imageUrl = imageResult.value;
    } else {
      logger.warn('Image generation failed settled', { reason: imageResult.reason });
      // Use fallback URL if Base64 fails completely
      imageUrl = `https://image.pollinations.ai/prompt/${encodeURIComponent(imagePrompt)}?width=512&height=512&seed=${seed}&nologo=true`;
    }

    return NextResponse.json({
      success: true,
      story,
      imageUrl,
    });
  } catch (error: unknown) {
    logger.error('Start adventure fatal error', { error });
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}
