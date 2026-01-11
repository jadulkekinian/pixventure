import { NextRequest, NextResponse } from 'next/server';
import { startAdventureSchema } from '@/lib/validation';
import { logger } from '@/lib/logger';
import Groq from 'groq-sdk';

export const maxDuration = 60; // 60s for Pro, but we'll try to stay under 10s for Hobby

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
 * Robust Image Fetcher with Retries
 * Fetches from Pollinations and converts to Base64
 */
async function fetchImageAsBase64(prompt: string, seed: number): Promise<string> {
  const pollUrl = `https://image.pollinations.ai/prompt/${encodeURIComponent(prompt)}?width=512&height=512&seed=${seed}&nologo=true`;

  let attempts = 0;
  const maxAttempts = 5;

  while (attempts < maxAttempts) {
    try {
      const res = await fetch(pollUrl, { signal: AbortSignal.timeout(15000) });

      if (res.ok) {
        const contentType = res.headers.get('content-type') || 'image/jpeg';
        // Check if we actually got an image and not an error page disguised as 200
        if (contentType.includes('image')) {
          const buffer = await res.arrayBuffer();
          const base64 = Buffer.from(buffer).toString('base64');
          return `data:${contentType};base64,${base64}`;
        }
      }

      logger.warn(`Pollinations attempt ${attempts + 1} failed with status ${res.status}`);
    } catch (e) {
      logger.warn(`Pollinations attempt ${attempts + 1} exception`, { error: e });
    }

    attempts++;
    // Small delay between retries
    await new Promise(r => setTimeout(r, 1000));
  }

  // Return direct URL as last-resort fallback if Base64 fails
  return pollUrl;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { language } = startAdventureSchema.parse(body);

    const groqApiKey = process.env.GROQ_API_KEY;
    if (!groqApiKey) return NextResponse.json({ success: false, error: 'Key missing' }, { status: 500 });

    const groq = new Groq({ apiKey: groqApiKey });
    const lang = languageInstructions[language as keyof typeof languageInstructions] || languageInstructions.en;

    // Parallel: Text Generation + Image Generation
    const seed = Math.floor(Math.random() * 9999999);
    const imagePrompt = "pixel art fantasy dungeon entrance, mysterious stone gate, glowing runes, retro RPG style, highly detailed";

    const [storyResponse, base64Image] = await Promise.all([
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

    const story = storyResponse.choices?.[0]?.message?.content;
    if (!story) throw new Error('No story generated');

    return NextResponse.json({
      success: true,
      story,
      imageUrl: base64Image,
    });
  } catch (error: unknown) {
    logger.error('Start adventure error', { error });
    return NextResponse.json({ success: false, error: 'Internal error' }, { status: 500 });
  }
}
