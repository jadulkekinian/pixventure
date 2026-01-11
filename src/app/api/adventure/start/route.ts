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
 * Robust Image Fetcher with Retries, Extended Timeouts, and Placeholders
 */
async function fetchImageAsBase64(prompt: string, seed: number): Promise<string> {
  // Use a faster model (flux-schnell if available, but default is flux usually)
  const pollUrl = `https://image.pollinations.ai/prompt/${encodeURIComponent(prompt)}?width=512&height=512&seed=${seed}&nologo=true`;

  let attempts = 0;
  const maxAttempts = 2; // Reduced attempts but longer timeout per attempt

  while (attempts < maxAttempts) {
    try {
      logger.info(`Fetching image (Attempt ${attempts + 1})`, { prompt, seed });

      // Increased timeout to 40 seconds to give Pollinations more time
      const res = await fetch(pollUrl, {
        signal: AbortSignal.timeout(40000),
        headers: { 'Accept': 'image/*' }
      });

      if (res.ok) {
        const contentType = res.headers.get('content-type') || 'image/jpeg';
        if (contentType.includes('image')) {
          const buffer = await res.arrayBuffer();
          const base64 = Buffer.from(buffer).toString('base64');
          const dataUri = `data:${contentType};base64,${base64}`;

          logger.info(`Pollinations success (Attempt ${attempts + 1})`, {
            size: dataUri.length,
            type: contentType
          });
          return dataUri;
        }
      }

      logger.warn(`Pollinations attempt ${attempts + 1} failed status ${res.status}`);
    } catch (e: any) {
      logger.warn(`Pollinations attempt ${attempts + 1} timeout or error`, { error: e.message });
    }

    attempts++;
    if (attempts < maxAttempts) {
      await new Promise(r => setTimeout(r, 500));
    }
  }

  // FINAL FALLBACK: Return a high-quality placeholder if AI fails
  // This ensures the game never breaks.
  logger.error('All image attempts failed, using placeholder fallback');
  return `https://placehold.co/512x512/1e293b/facc15?text=Vision+Faded+Try+Action`;
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

    // Run parallel: Story + Image
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
      imageUrl = `https://placehold.co/512x512/1e293b/facc15?text=Vision+Connection+Issue`;
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
